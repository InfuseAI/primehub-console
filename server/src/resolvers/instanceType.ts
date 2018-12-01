import { Context } from './interface';
import { Item } from '../crdClient/customResource';
import { InstanceTypeSpec } from '../crdClient/crdClientImpl';
import { mutateRelation, parseMemory, stringifyMemory } from './utils';
import { Crd } from './crd';
import { isUndefined, isNil } from 'lodash';
import RoleRepresentation from 'keycloak-admin/lib/defs/roleRepresentation';
import Boom from 'boom';

export const mapping = (item: Item<InstanceTypeSpec>) => {
  return {
    id: item.metadata.name,
    name: item.metadata.name,
    description: item.spec.description,
    displayName: item.spec.displayName || item.metadata.name,
    cpuLimit: item.spec['limits.cpu'] || 0,
    cpuRequest: item.spec['requests.cpu'] || 0,
    gpuLimit: item.spec['limits.nvidia.com/gpu'] || 0,
    memoryLimit: item.spec['limits.memory'] ? parseMemory(item.spec['limits.memory']) : null,
    memoryRequest: item.spec['requests.memory'] ? parseMemory(item.spec['requests.memory']) : null,
    spec: item.spec
  };
};

export const resolveType = {
  async global(parent, args, context: Context) {
    const {kcAdminClient, everyoneGroupId} = context;
    // find in everyOne group
    return this.findInGroup(everyoneGroupId, parent.id, kcAdminClient);
  }
};

const expectInputNotNilAndLargerThanZero = (num: number, fieldName: string) => {
  if (isNil(num)) {
    throw Boom.badData(`field ${fieldName} should not be nil`);
  }

  if (num <= 0) {
    throw Boom.badData(`field ${fieldName} should > zero`);
  }
};

const expectInputLargerThanZero = (num: number, fieldName: string) => {
  // not exist, skip
  if (isUndefined(num)) {
    return;
  }

  if (num <= 0) {
    throw Boom.badData(`field ${fieldName} should > zero`);
  }
};

export const createMapping = (data: any) => {
  // validate the request / limit for cpu and memory should always > 0
  expectInputNotNilAndLargerThanZero(data.cpuLimit, 'cpuLimit');
  expectInputNotNilAndLargerThanZero(data.memoryLimit, 'memoryLimit');
  expectInputNotNilAndLargerThanZero(data.cpuRequest, 'cpuRequest');
  expectInputNotNilAndLargerThanZero(data.memoryRequest, 'memoryRequest');

  return {
    metadata: {
      name: data.name
    },
    spec: {
      'displayName': data.displayName || data.name,
      'description': data.description,
      'limits.cpu': data.cpuLimit,
      'limits.memory': data.memoryLimit ? stringifyMemory(data.memoryLimit) : undefined,
      'limits.nvidia.com/gpu': data.gpuLimit,
      'requests.cpu': data.cpuRequest,
      'requests.memory': data.memoryRequest ? stringifyMemory(data.memoryRequest) : undefined
    }
  };
};

export const updateMapping = (data: any) => {
  expectInputLargerThanZero(data.cpuLimit, 'cpuLimit');
  expectInputLargerThanZero(data.memoryLimit, 'memoryLimit');
  expectInputLargerThanZero(data.cpuRequest, 'cpuRequest');
  expectInputLargerThanZero(data.memoryRequest, 'memoryRequest');

  return {
    metadata: {
      name: data.name
    },
    spec: {
      'displayName': data.displayName,
      'description': data.description,
      'limits.cpu': data.cpuLimit,
      'limits.memory': data.memoryLimit ? stringifyMemory(data.memoryLimit) : undefined,
      'limits.nvidia.com/gpu': data.gpuLimit,
      'requests.cpu': data.cpuRequest,
      'requests.memory': data.memoryRequest ? stringifyMemory(data.memoryRequest) : undefined
    }
  };
};

export const onCreate = async (
  {role, resource, data, context}:
  {role: RoleRepresentation, resource: any, data: any, context: Context}) => {
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

export const crd = new Crd<InstanceTypeSpec>({
  customResourceMethod: 'instanceTypes',
  propMapping: mapping,
  resolveType,
  prefixName: 'it',
  resourceName: 'instanceType',
  createMapping,
  updateMapping,
  onCreate,
  onUpdate
});
