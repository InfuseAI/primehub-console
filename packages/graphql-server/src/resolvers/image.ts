import { Context } from './interface';
import { Item } from '../crdClient/customResource';
import { ImageSpec } from '../crdClient/crdClientImpl';
import { mutateRelation } from './utils';
import { Crd } from './crd';
import { isUndefined, isNil, isNull } from 'lodash';
import RoleRepresentation from 'keycloak-admin/lib/defs/roleRepresentation';
import CurrentWorkspace from '../workspace/currentWorkspace';

export const mapping = (item: Item<ImageSpec>) => {
  return {
    id: item.metadata.name,
    name: item.metadata.name,
    displayName: item.spec.displayName || item.metadata.name,
    description: item.spec.description,
    url: item.spec.url,
    useImagePullSecret: item.spec.pullSecret,
    spec: item.spec,
  };
};

export const resolveType = {
  async global(parent, args, context: Context) {
    const {kcAdminClient} = context;
    const currentWorkspace: CurrentWorkspace = parent.currentWorkspace;
    const everyoneGroupId = await currentWorkspace.getEveryoneGroupId();
    // find in everyOne group
    return this.findInGroup(everyoneGroupId, parent.id, kcAdminClient, currentWorkspace);
  }
};

export const onCreate = async (
  {role, resource, data, context, currentWorkspace}:
  {role: RoleRepresentation, resource: any, data: any, context: Context, currentWorkspace: CurrentWorkspace}) => {
  const everyoneGroupId = await currentWorkspace.getEveryoneGroupId();
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
  {role, resource, data, context, currentWorkspace}:
  {role: RoleRepresentation, resource: any, data: any, context: Context, currentWorkspace: CurrentWorkspace}) => {
  const everyoneGroupId = await currentWorkspace.getEveryoneGroupId();
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

export const createMapping = (data: any) => {
  return {
    metadata: {
      name: data.name
    },
    spec: {
      displayName: data.displayName || data.name,
      description: data.description,
      url: data.url,
      pullSecret: isNil(data.useImagePullSecret) ? null : data.useImagePullSecret
    }
  };
};

export const updateMapping = (data: any) => {
  return {
    metadata: {
      name: data.name
    },
    spec: {
      displayName: data.displayName,
      description: data.description,
      url: data.url,
      pullSecret: isNull(data.useImagePullSecret) ? null : data.useImagePullSecret
    }
  };
};

export const crd = new Crd<ImageSpec>({
  customResourceMethod: 'images',
  propMapping: mapping,
  resolveType,
  prefixName: 'img',
  resourceName: 'image',
  createMapping,
  updateMapping,
  onCreate,
  onUpdate
});
