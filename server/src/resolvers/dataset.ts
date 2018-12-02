import { Item } from '../crdClient/customResource';
import { DatasetSpec } from '../crdClient/crdClientImpl';
import { Crd } from './crd';
import { mutateRelation, mergeVariables } from './utils';
import RoleRepresentation from 'keycloak-admin/lib/defs/roleRepresentation';
import { Context } from './interface';
import { omit, get, isUndefined } from 'lodash';
import { resolveInDataSet } from './secret';

export const mapping = (item: Item<DatasetSpec>) => {
  return {
    id: item.metadata.name,
    name: item.metadata.name,
    description: item.spec.description,
    displayName: item.spec.displayName || item.metadata.name,
    access: item.spec.access,
    type: item.spec.type,
    url: item.spec.url,
    variables: item.spec.variables,
    volumeName: item.spec.volumeName,
    spec: item.spec,
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
      access: data.access,
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
      access: data.access,
      type: data.type,
      url: data.url,
      variables: data.variables,
      volumeName: data.volumeName,
      ...gitSyncProp
    }
  };
};

export const onCreate = async (
  {role, resource, data, context}:
  {role: RoleRepresentation, resource: any, data: any, context: Context}) => {
  if (data && data.groups) {
    // add to group
    await mutateRelation({
      resource: data.groups,
      connect: async where => {
        await context.kcAdminClient.groups.addRealmRoleMappings({
          id: where.id,
          roles: [{
            id: role.id,
            name: role.name
          }]
        });
      }
    });
  }

  if (data && (data.access === 'everyone' || data.access === 'admin')) {
    const everyoneGroupId = context.everyoneGroupId;
    await context.kcAdminClient.groups.addRealmRoleMappings({
      id: everyoneGroupId,
      roles: [{
        id: role.id,
        name: role.name
      }]
    });
  }
};

export const onUpdate = async (
  {role, resource, data, context}:
  {role: RoleRepresentation, resource: any, data: any, context: Context}) => {
  if (!data) {
    return;
  }

  if (data.groups) {
    // add to group
    await mutateRelation({
      resource: data.groups,
      connect: async where => {
        await context.kcAdminClient.groups.addRealmRoleMappings({
          id: where.id,
          roles: [{
            id: role.id,
            name: role.name
          }]
        });
      },
      disconnect: async where => {
        await context.kcAdminClient.groups.delRealmRoleMappings({
          id: where.id,
          roles: [{
            id: role.id,
            name: role.name
          }]
        });
      }
    });
  }

  const everyoneGroupId = context.everyoneGroupId;
  if (data.access === 'everyone' || data.access === 'admin') {
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
};

const customUpdate = async ({name, metadata, spec, customResource}) => {
  // find original variables first
  const row = await customResource.get(name);
  const originalVariables = row.spec.variables || {};
  const newVariables = spec.variables || {};
  spec.variables = mergeVariables(originalVariables, newVariables);
  return customResource.patch(name, {
    metadata: omit(metadata, 'name'),
    spec
  });
};

export const resolveType = {
  ...resolveInDataSet
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
  resolveType,
  customUpdate
});
