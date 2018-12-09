import { Item } from '../crdClient/customResource';
import { DatasetSpec } from '../crdClient/crdClientImpl';
import { Crd } from './crd';
import { mutateRelation, mergeVariables } from './utils';
import RoleRepresentation from 'keycloak-admin/lib/defs/roleRepresentation';
import { Context } from './interface';
import { omit, get, isUndefined, last, isNil } from 'lodash';
import { resolveInDataSet } from './secret';
import KeycloakAdminClient from 'keycloak-admin';

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
    secret: get(item, 'spec.gitsync.secret')
  };
};

export const createMapping = (data: any) => {
  const gitSyncSecretId = get(data, 'secret.connect.id');
  const gitSyncProp = gitSyncSecretId
    ? {gitsync: {secret: gitSyncSecretId}}
    : {};
  const annotations = (data.type === 'git')
    ? {annotations: {'primehub-gitsync': 'true'}}
    : {};
  return {
    metadata: {
      name: data.name,
      ...annotations
    },
    spec: {
      displayName: data.displayName || data.name,
      description: data.description,
      type: data.type,
      url: data.url,
      variables: data.variables,
      volumeName: data.volumeName,
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
      volumeName: data.volumeName,
      ...gitSyncProp
    }
  };
};

export const onCreate = async (
  {role, resource, data, context, getPrefix}:
  {role: RoleRepresentation, resource: any, data: any, context: Context, getPrefix: () => string}) => {
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

  return res;
};

export const resolveType = {
  async global(parent, args, context: Context) {
    const {kcAdminClient, everyoneGroupId} = context;
    // find in everyOne group
    return this.findInGroup(everyoneGroupId, parent.id, kcAdminClient);
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
