import { Item } from '../crdClient/customResourceNG';
import { DatasetSpec } from '../crdClient/crdClientImpl';
import { Crd } from './crd';
import { mutateRelation, mergeVariables, parseBoolean } from './utils';
import RoleRepresentation from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import { Context } from './interface';
import { omit, get, isUndefined, last, isNil } from 'lodash';
import { resolveInDataSet } from './secret';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { keycloakMaxCount } from './constant';
import { ResourceNamePrefix } from './resourceRole';
import {createConfig} from '../config';
import { ApolloError } from 'apollo-server';
import K8sDatasetPvc from '../k8sResource/k8sDatasetPvc';
import { transform } from './groupUtils';

export const ATTRIBUTE_PREFIX = 'dataset.primehub.io';

const uploadServerList = ['pv', 'nfs', 'hostPath'];

const config = createConfig();
const datasetPvcQuery = new K8sDatasetPvc({
  namespace: config.k8sCrdNamespace,
  primehubGroupSc: config.primehubGroupSc,
  groupVolumeStorageClass: config.groupVolumeStorageClass,
});

// utils
const addToAnnotation = (data: any, field: string, annotation: any) => {
  if (isNil(annotation)) {
    return;
  }

  const fieldValue = data[field];
  if (!isNil(fieldValue)) {
    annotation[`${ATTRIBUTE_PREFIX}/${field}`] = fieldValue.toString();
  }
};

const getWritableRole = async ({
  kcAdminClient,
  datasetId,
  getPrefix
}: {
  kcAdminClient: KeycloakAdminClient,
  datasetId: string,
  getPrefix: (customizePrefix?: string) => string
}): Promise<RoleRepresentation> => {
  // make sure the writable role exists
  const roleName = `${getPrefix('rw:')}${datasetId}`;
  const role = await kcAdminClient.roles.findOneByName({name: roleName});
  if (!role) {
    try {
      await kcAdminClient.roles.create({name: roleName});
      return kcAdminClient.roles.findOneByName({name: roleName});
    } catch (e) {
      if (e.response && e.response.status === 409) {
        return kcAdminClient.roles.findOneByName({name: roleName});
      }
      throw e;
    }
  }
  return role;
};

export const mapping = (item: Item<DatasetSpec>) => {
  const enableUploadServer = parseBoolean(get(item, ['spec', 'enableUploadServer'], 'false'));
  return {
    id: item.metadata.name,
    name: item.metadata.name,
    description: item.spec.description,
    displayName: item.spec.displayName || item.metadata.name,
    type: item.spec.type,
    url: item.spec.url,
    variables: item.spec.variables,
    volumeName: item.spec.volumeName,
    spec: item.spec,
    writable: (item as any).roleName && (item as any).roleName.indexOf(':rw:') >= 0,
    pvProvisioning: get(item, 'spec.pv.provisioning', 'auto'),
    nfsServer: get(item, 'spec.nfs.server'),
    nfsPath: get(item, 'spec.nfs.path'),
    hostPath: get(item, 'spec.hostPath.path'),
    secret: get(item, 'spec.gitsync.secret'),
    // default to empty string
    mountRoot: get(item, ['metadata', 'annotations', `${ATTRIBUTE_PREFIX}/mountRoot`], ''),
    // default to false
    homeSymlink: parseBoolean(get(item, ['metadata', 'annotations', `${ATTRIBUTE_PREFIX}/homeSymlink`], 'false')),
    // default to false
    launchGroupOnly:
      parseBoolean(get(item, ['metadata', 'annotations', `${ATTRIBUTE_PREFIX}/launchGroupOnly`], 'false')),
    enableUploadServer,
    uploadServerLink:
      (uploadServerList.includes(item.spec.type) && enableUploadServer) ?
        `${config.datasetEndpoint || ''}/${config.k8sCrdNamespace || 'default'}/${item.metadata.name}/browse`
        : null,
    uploadServerSecret:
      ((item as any).datasetUploadSecretUsername && (item as any).datasetUploadSecretPassword) ?
        {username: (item as any).datasetUploadSecretUsername, password: (item as any).datasetUploadSecretPassword}
        : null
  };
};

export const createMapping = (data: any) => {
  const gitSyncSecretId = get(data, 'secret.connect.id');
  const gitSyncProp = gitSyncSecretId
    ? {gitsync: {secret: gitSyncSecretId}}
    : {};
  const pvProp = (data.type === 'pv' && data.pvProvisioning)
    ? {pv: {provisioning: data.pvProvisioning}}
    : {};
  const nfsProp = (data.nfsServer && data.nfsPath)
    ? {nfs: {server: data.nfsServer, path: data.nfsPath}}
    : {};
  const hostPathProp = data.hostPath
    ? {hostPath: {path: data.hostPath}}
    : {};
  const annotations: any = (data.type === 'git')
    ? {'primehub-gitsync': 'true'}
    : {};

  // add mountRoot
  addToAnnotation(data, 'mountRoot', annotations);
  // homeSymlink is fixed to false
  annotations[`${ATTRIBUTE_PREFIX}/homeSymlink`] = 'false';
  // always add launchGroupOnly when creating a new dataset and value is true
  annotations[`${ATTRIBUTE_PREFIX}/launchGroupOnly`] = 'true';

  // mappings
  return {
    metadata: {
      name: data.name,
      annotations
    },
    spec: {
      displayName: data.displayName || data.name,
      description: data.description || '',
      type: data.type,
      url: data.url,
      variables: data.variables,
      // volumeName = dataset name
      volumeName: data.name,
      ...gitSyncProp,
      ...pvProp,
      ...nfsProp,
      ...hostPathProp
    }
  };
};

export const updateMapping = (data: any) => {
  const secretConnect = get(data, 'secret.connect.id');
  const secretDisconnect = get(data, 'secret.disconnect');
  let gitSyncProp: any = {};
  if (secretConnect) {
    gitSyncProp = {gitsync: {secret: secretConnect}};
  } else if (secretDisconnect) {
    gitSyncProp = {gitsync: null};
  }

  let nfsSyncProp: any = {};
  if (data.nfsServer) {
    nfsSyncProp = {nfs: {server: data.nfsServer}};
  }
  if (data.nfsPath) {
    nfsSyncProp = {nfs: {path: data.nfsPath}};
  }
  if (data.nfsServer && data.nfsPath) {
    nfsSyncProp = {nfs: {server: data.nfsServer, path: data.nfsPath}};
  }

  const hostPathSyncProp = data.hostPath
    ? {hostPath: {path: data.hostPath}}
    : {};

  // gitsync annotation
  let annotations: any = {};
  // update to git type
  if (data.type === 'git') {
    annotations = {annotations: {'primehub-gitsync': 'true'}};
  } else if (!isUndefined(data.type)) {
    // set to other type
    annotations = {annotations: null};
    gitSyncProp = {gitsync: null};
  }

  // add launchGroupOnly
  if (!isNil(data.launchGroupOnly)) {
    annotations.annotations = {
      ...annotations.annotations,
      [`${ATTRIBUTE_PREFIX}/launchGroupOnly`]: data.launchGroupOnly.toString()
    };
  }

  return {
    metadata: {
      name: data.name,
      ...annotations
    },
    spec: {
      displayName: data.displayName,
      description: data.description,
      url: data.url,
      variables: data.variables,
      enableUploadServer: isNil(data.enableUploadServer) ? undefined : data.enableUploadServer.toString(),
      ...gitSyncProp,
      ...nfsSyncProp,
      ...hostPathSyncProp
    }
  };
};

export const onCreate = async (
  {role, resource, data, context, getPrefix}:
  {
    role: RoleRepresentation,
    resource: any,
    data: any,
    context: Context,
    getPrefix: (customizePrefix?: string) => string
  }) => {
  const everyoneGroupId = context.everyoneGroupId;
  // dataset pv, create pvc
  if (resource.spec.type === 'pv' && (!resource.spec.pv || resource.spec.pv.provisioning === 'auto')) {
    if (isNil(data.volumeSize) || data.volumeSize <= 0) {
      throw new Error(`invalid dataset volumeSize: ${data.volumeSize}`);
    }
    await context.k8sDatasetPvc.create({
      volumeName: resource.spec.volumeName,
      volumeSize: data.volumeSize
    });
  }

  if (data && data.global) {
    // assign role to everyone
    await context.kcAdminClient.groups.addRealmRoleMappings({
      id: everyoneGroupId,
      roles: [{
        id: role.id,
        name: role.name
      }]
    });
  }

  if (data && data.groups) {
    const datasetId = resource.metadata.name;
    // add to group
    await mutateRelation({
      resource: data.groups,
      connect: async (where: {id: string, writable: boolean}) => {
        let targetRole = role;
        if (where.writable) {
          const writableRole = await getWritableRole({
            kcAdminClient: context.kcAdminClient,
            datasetId,
            getPrefix
          });
          targetRole = writableRole;
        }
        await context.kcAdminClient.groups.addRealmRoleMappings({
          id: where.id,
          roles: [{
            id: targetRole.id,
            name: targetRole.name
          }]
        });
      }
    });
  }
};

export const onUpdate = async (
  {role, resource, data, context, getPrefix}:
  {
    role: RoleRepresentation,
    resource: any,
    data: any,
    context: Context,
    getPrefix: (customizePrefix?: string) => string
  }) => {
  if (!data) {
    return;
  }

  const everyoneGroupId = context.everyoneGroupId;
  if (data && !isUndefined(data.global)) {
    if (data.global) {
      // assign role to everyone
      await context.kcAdminClient.groups.addRealmRoleMappings({
        id: everyoneGroupId,
        roles: [{
          id: role.id,
          name: role.name
        }]
      });
    } else {
      await context.kcAdminClient.groups.delRealmRoleMappings({
        id: everyoneGroupId,
        roles: [{
          id: role.id,
          name: role.name
        }]
      });
    }
  }

  if (data && data.groups) {
    const datasetId = resource.metadata.name;
    const datasetType = resource.spec.type;
    const datasetWritableTypeList = ['pv', 'nfs', 'hostPath'];
    // add to group
    await mutateRelation({
      resource: data.groups,
      connect: async (where: {id: string, writable: boolean}) => {
        if (!datasetWritableTypeList.includes(datasetType)) {
          return context.kcAdminClient.groups.addRealmRoleMappings({
            id: where.id,
            roles: [{
              id: role.id,
              name: role.name
            }]
          });
        }
        // dataset_writable_type
        const writableRole = await getWritableRole({
          kcAdminClient: context.kcAdminClient,
          datasetId,
          getPrefix
        });
        // change to writable
        if (where.writable) {
          // delete original read permission role
          await context.kcAdminClient.groups.delRealmRoleMappings({
            id: where.id,
            roles: [{
              id: role.id,
              name: role.name
            }]
          });

          return context.kcAdminClient.groups.addRealmRoleMappings({
            id: where.id,
            roles: [{
              id: writableRole.id,
              name: writableRole.name
            }]
          });
        } else {
          // change to read only
          // delete write permission role if exist
          await context.kcAdminClient.groups.delRealmRoleMappings({
            id: where.id,
            roles: [{
              id: writableRole.id,
              name: writableRole.name
            }]
          });
          // add read permission role
          await context.kcAdminClient.groups.addRealmRoleMappings({
            id: where.id,
            roles: [{
              id: role.id,
              name: role.name
            }]
          });
        }
      },
      disconnect: async where => {
        await context.kcAdminClient.groups.delRealmRoleMappings({
          id: where.id,
          roles: [{
            id: role.id,
            name: role.name
          }]
        });

        if (datasetWritableTypeList.includes(datasetType)) {
          // remove writable as well
          const writableRole = await getWritableRole({
            kcAdminClient: context.kcAdminClient,
            datasetId,
            getPrefix
          });
          await context.kcAdminClient.groups.delRealmRoleMappings({
            id: where.id,
            roles: [{
              id: writableRole.id,
              name: writableRole.name
            }]
          });
        }
      }
    });
  }
};

export const onDelete = async ({
  name, context, resource, getPrefix
}: {name: string, context: Context, resource: any, getPrefix: (customizePrefix?: string) => string}) => {
  // delete dataset pvc
  if (resource.spec.type === 'pv' && (!resource.spec.pv || resource.spec.pv.provisioning === 'auto')) {
    await context.k8sDatasetPvc.delete(resource.spec.volumeName);
  }
  await context.k8sUploadServerSecret.delete(name);

  // delete writable as well
  try {
    await context.kcAdminClient.roles.delByName({
      name: `${getPrefix('rw:')}${name}`
    });
  } catch (e) {
    if (e.response && e.response.status === 404) {
      return;
    }
    throw e;
  }
};

const customUpdate = async ({
  name, metadata, spec, customResource, context, getPrefix
}: {
  name: string,
  metadata: any,
  spec: any,
  customResource: any,
  context: Context,
  getPrefix: (customizePrefix?: string) => string
}) => {
  // find original variables first
  const row = await customResource.get(name);
  const originalVariables = row.spec.variables || {};
  const newVariables = spec.variables || {};
  spec.variables = mergeVariables(originalVariables, newVariables);

  // if type is pv
  let datasetUploadSecretUsername;
  let datasetUploadSecretPassword;
  if (uploadServerList.includes(row.spec.type) && !isNil(spec.enableUploadServer)) {
    const orginalEnabledUploadServer = get(row, 'spec.enableUploadServer', 'false').toString() === 'true';
    const updatedEnabledUploadServer = spec.enableUploadServer.toString() === 'true';
    // original enableUploadServer is false and update with enableUploadServer true
    if (!orginalEnabledUploadServer && updatedEnabledUploadServer) {
      const secret = await context.k8sUploadServerSecret.create({
        datasetName: name
      });
      datasetUploadSecretUsername = secret.username;
      datasetUploadSecretPassword = secret.password;
      metadata.annotations = {
        ...metadata.annotations,
        'dataset.primehub.io/uploadServer': 'true',
        'dataset.primehub.io/uploadServerAuthSecretName': secret.secretName
      };
    } else if (orginalEnabledUploadServer && !updatedEnabledUploadServer) {
      // original enableUploadServer is true and update with enableUploadServer false
      metadata.annotations = {
        ...metadata.annotations,
        'dataset.primehub.io/uploadServer': null,
        'dataset.primehub.io/uploadServerAuthSecretName': null
      };
      // delete secret
      await context.k8sUploadServerSecret.delete(name);
    }
  }

  const res = await customResource.patch(name, {
    metadata: omit(metadata, 'name'),
    spec
  });

  // if changing from pv to other types
  // change all rw roles to normal roles
  const originType = row.spec.type;
  const changedType = res.spec.type;
  if (originType !== changedType && originType === 'pv') {
    // find all groups with this role and change them
    const groups = await context.kcAdminClient.groups.find({ max: keycloakMaxCount });
    // find each role-mappings
    await Promise.all(
      groups
      .filter(group => group.id !== context.everyoneGroupId)
      .map(async group => {
        const roles = await context.kcAdminClient.groups.listRealmRoleMappings({
          id: group.id
        });

        // find roles with rw
        const writableRole = roles.find(role =>
            role.name === `${getPrefix('rw:')}${name}`);

        // no role
        if (!writableRole) {
          return;
        }

        // remove rw
        await context.kcAdminClient.groups.delRealmRoleMappings({
          id: group.id,
          roles: [{
            id: writableRole.id,
            name: writableRole.name
          }]
        });
        // add read permission role
        const readRole = await context.kcAdminClient.roles.findOneByName({
          name: `${getPrefix()}${name}`
        });
        return context.kcAdminClient.groups.addRealmRoleMappings({
          id: group.id,
          roles: [{
            id: readRole.id,
            name: readRole.name
          }]
        });
      })
    );
  }

  return {
    ...res,
    datasetUploadSecretUsername,
    datasetUploadSecretPassword
  };
};

export const resolveType = {
  async global(parent, args, context: Context) {
    const {kcAdminClient} = context;
    // find in everyOne group
    const everyoneGroupId = context.everyoneGroupId;
    return this.findInGroup(everyoneGroupId, parent.id, kcAdminClient);
  },
  async volumeSize(parent, args, context: Context) {
    const {k8sDatasetPvc} = context;
    const type = parent.type;
    if (type !== 'pv') {
      return null;
    }

    const datasetPvc = await k8sDatasetPvc.findOne(parent.volumeName);
    if (!datasetPvc) {
      return -1;
    }
    return get(datasetPvc, 'volumeSize');
  },
  async groups(parent, args, context: Context) {
    const resourceId = parent.id;
    // find all groups
    const groups = await context.kcAdminClient.groups.find({ max: keycloakMaxCount });
    // find each role-mappings
    const groupsWithRole = await Promise.all(
      groups
      .filter(group => group.id !== context.everyoneGroupId)
      .map(async group => {
        const roles = await context.kcAdminClient.groups.listRealmRoleMappings({
          id: group.id
        });

        // find roles with prefix:ds && prefix:rw:ds
        const findRole = roles.find(role =>
            role.name === `${this.getPrefix()}${resourceId}`
            || role.name === `${this.getPrefix('rw:')}${resourceId}`);

        // no role
        if (!findRole) {
          return null;
        }

        const groupRep = await context.kcAdminClient.groups.findOne({id: group.id});
        return (findRole.name.indexOf(':rw:') >= 0)
          ? {...groupRep, writable: true}
          : {...groupRep, writable: false};
      })
    );
    // filter out
    return groupsWithRole.filter(v => v).map(transform);
  },
  ...resolveInDataSet
};

export const regenerateUploadSecret = async (root, args, context: Context) => {
  const datasetName = args.where.id;
  const secret = await context.k8sUploadServerSecret.regenerateSecret(datasetName);
  return {
    id: datasetName,
    uploadServerSecret: {
      username: secret.username,
      password: secret.password
    }
  };
};

export const preCreateCheck = async (
  {resource}:
  {
    resource: any
  }) => {
  if (resource.spec.type === 'pv' && (!resource.spec.pv || resource.spec.pv.provisioning === 'auto')) {
    // find pvc
    try {
      const found = await datasetPvcQuery.findOne(resource.spec.volumeName);
      if (found !== null) {
        throw new ApolloError(`PVC already exist`, 'PVC_CONFLICT');
      }
    } catch (e) {
      throw e;
    }
  }
};

export const crd = new Crd<DatasetSpec>({
  customResourceMethod: 'datasets',
  propMapping: mapping,
  prefixName: ResourceNamePrefix.ds,
  resourceName: 'dataset',
  createMapping,
  updateMapping,
  onCreate,
  onUpdate,
  onDelete,
  resolveType,
  customUpdate,
  preCreateCheck
});
