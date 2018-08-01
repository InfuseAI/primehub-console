import { Context } from './interface';
import { Item } from '../crdClient/customResource';
import { ImageSpec } from '../crdClient/crdClientImpl';
import { findResourceInGroup, mutateRelation } from './utils';
import { EVERYONE_GROUP_ID } from './constant';
import { Crd } from './crd';
import { isUndefined } from 'lodash';
import RoleRepresentation from 'keycloak-admin/lib/defs/roleRepresentation';

export const mapping = (item: Item<ImageSpec>) => {
  return {
    id: item.metadata.name,
    name: item.metadata.name,
    displayName: item.spec.displayName,
    description: item.metadata.description,
    url: item.spec.url
  };
};

export const resolveType = {
  global: async (parent, args, context: Context) => {
    // find in everyOne group
    return findResourceInGroup({
      kcAdminClient: context.kcAdminClient,
      groupId: EVERYONE_GROUP_ID,
      // id should be same with name
      resourceName: parent.id
    });
  }
};

export const onCreate = async (
  {role, resource, data, context}:
  {role: RoleRepresentation, resource: any, data: any, context: Context}) => {
  if (data && data.global) {
    // assign role to everyone
    await context.kcAdminClient.groups.addRealmRoleMappings({
      id: EVERYONE_GROUP_ID,
      roles: [{
        id: role.id,
        name: role.name
      }]
    });
  }

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
};

export const onUpdate = async (
  {role, resource, data, context}:
  {role: RoleRepresentation, resource: any, data: any, context: Context}) => {

  if (data && !isUndefined(data.global)) {
    if (data.global) {
      // assign role to everyone
      await context.kcAdminClient.groups.addRealmRoleMappings({
        id: EVERYONE_GROUP_ID,
        roles: [{
          id: role.id,
          name: role.name
        }]
      });
    } else {
      await context.kcAdminClient.groups.delRealmRoleMappings({
        id: EVERYONE_GROUP_ID,
        roles: [{
          id: role.id,
          name: role.name
        }]
      });
    }
  }

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
};

export const mutationMapping = (data: any) => {
  return {
    metadata: {
      name: data.name,
      description: data.description
    },
    spec: {
      displayName: data.displayName,
      url: data.url
    }
  };
};

export const crd = new Crd<ImageSpec>({
  customResourceMethod: 'images',
  propMapping: mapping,
  resolveType,
  prefixName: 'img',
  resourceName: 'image',
  mutationMapping,
  onCreate,
  onUpdate
});
