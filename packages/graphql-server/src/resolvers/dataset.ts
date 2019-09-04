import { Item } from '../crdClient/customResource';
import { DatasetSpec } from '../crdClient/crdClientImpl';
import { Crd } from './crd';
import { mutateRelation, mergeVariables, parseBoolean } from './utils';
import RoleRepresentation from 'keycloak-admin/lib/defs/roleRepresentation';
import { Context } from './interface';
import { omit, get, isUndefined, last, isNil } from 'lodash';
import { resolveInDataSet } from './secret';
import KeycloakAdminClient from 'keycloak-admin';
import {createConfig} from '../config';

export const ATTRIBUTE_PREFIX = 'dataset.primehub.io';

const config = createConfig();

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
  getPrefix: () => string
}): Promise<RoleRepresentation> => {
  // make sure the writable role exists
  const roleName = `${getPrefix()}rw:${datasetId}`;
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
      (item.spec.type === 'pv' && enableUploadServer) ?
        `${config.appPrefix || ''}/dataset/${config.k8sCrdNamespace || 'default'}/${item.metadata.name}/browse`
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
  const annotations: any = (data.type === 'git')
    ? {'primehub-gitsync': 'true'}
    : {};

  // add mountRoot & launchGroupOnly
  addToAnnotation(data, 'mountRoot', annotations);
  addToAnnotation(data, 'launchGroupOnly', annotations);
  // homeSymlink is fixed to false
  annotations[`${ATTRIBUTE_PREFIX}/homeSymlink`] = 'false';

  // mappings
  return {
    metadata: {
      name: data.name,
      annotations
    },
    spec: {
      displayName: data.displayName || data.name,
      description: data.description,
      type: data.type,
      url: data.url,
      variables: data.variables,
      // volumeName = dataset name
      volumeName: data.name,
      ...gitSyncProp
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
      type: data.type,
      url: data.url,
      variables: data.variables,
      enableUploadServer: data.enableUploadServer.toString(),
      ...gitSyncProp
    }
  };
};

export const onCreate = async (
  {role, resource, data, context, getPrefix}:
  {role: RoleRepresentation, resource: any, data: any, context: Context, getPrefix: () => string}) => {
  // dataset pvc
  if (data.type === 'pv') {
    if (isNil(data.volumeSize) || data.volumeSize <= 0) {
      throw new Error(`invalid dataset volumeSize: ${data.volumeSize}`);
    }
    // create pvc
    await context.k8sDatasetPvc.create({
      datasetName: data.name,
      volumeSize: data.volumeSize
    });
  }

  // group relation
  const everyoneGroupId = context.everyoneGroupId;
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
  {role: RoleRepresentation, resource: any, data: any, context: Context, getPrefix: () => string}) => {
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
    // add to group
    await mutateRelation({
      resource: data.groups,
      connect: async (where: {id: string, writable: boolean}) => {
        if (datasetType !== 'pv') {
          return context.kcAdminClient.groups.addRealmRoleMappings({
            id: where.id,
            roles: [{
              id: role.id,
              name: role.name
            }]
          });
        }
        // pv dataset
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

        if (datasetType === 'pv') {
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
  name, context, getPrefix
}: {name: string, context: Context, getPrefix: () => string}) => {
  // delete dataset pvc
  await context.k8sDatasetPvc.delete(name);
  await context.k8sUploadServerSecret.delete(name);
  // delete writable as well
  try {
    await context.kcAdminClient.roles.delByName({
      name: `${getPrefix()}rw:${name}`
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
  name: string, metadata: any, spec: any, customResource: any, context: Context, getPrefix: () => string
}) => {
  // find original variables first
  const row = await customResource.get(name);
  const originalVariables = row.spec.variables || {};
  const newVariables = spec.variables || {};
  spec.variables = mergeVariables(originalVariables, newVariables);

  // if type is pv
  let datasetUploadSecretUsername;
  let datasetUploadSecretPassword;
  if (row.spec.type === 'pv' && !isNil(spec.enableUploadServer)) {
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
    const groups = await context.kcAdminClient.groups.find();
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
            role.name === `${getPrefix()}rw:${name}`);

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
    const {kcAdminClient, everyoneGroupId} = context;
    // find in everyOne group
    return this.findInGroup(everyoneGroupId, parent.id, kcAdminClient);
  },
  async volumeSize(parent, args, context: Context) {
    const {k8sDatasetPvc} = context;
    const type = parent.type;
    if (type !== 'pv') {
      return null;
    }

    const datasetPvc = await k8sDatasetPvc.findOne(parent.name);
    return get(datasetPvc, 'volumeSize');
  },
  async groups(parent, args, context: Context) {
    const resourceId = parent.id;
    // find all groups
    const groups = await context.kcAdminClient.groups.find();
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
            role.name === `${this.getPrefix()}${resourceId}` || role.name === `${this.getPrefix()}rw:${resourceId}`);

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
    return groupsWithRole.filter(v => v);
  },
  ...resolveInDataSet
};

export const customParseNameFromRole = (roleName: string) => {
  return last(roleName.split(':'));
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

export const crd = new Crd<DatasetSpec>({
  customResourceMethod: 'datasets',
  propMapping: mapping,
  prefixName: 'ds',
  resourceName: 'dataset',
  createMapping,
  updateMapping,
  onCreate,
  onUpdate,
  onDelete,
  customParseNameFromRole,
  resolveType,
  customUpdate
});
