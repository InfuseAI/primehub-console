import { Context } from './interface';
import { Item } from '../crdClient/customResource';
import { InstanceTypeSpec } from '../crdClient/crdClientImpl';
import { mutateRelation, parseMemory, stringifyMemory } from './utils';
import { Crd } from './crd';
import { isUndefined, isNil, values, isEmpty, get } from 'lodash';
import RoleRepresentation from 'keycloak-admin/lib/defs/roleRepresentation';
import Boom from 'boom';
import { ErrorCodes } from '../errorCodes';

// utils
const EffectNone = 'None';
const EffectValues = ['NoSchedule', 'PreferNoSchedule', 'NoExecute', EffectNone];
const OperatorValues = {Equal: 'Equal', Exists: 'Exists'};
const validateAndMapTolerations =
  (tolerations: Array<{operator: string, effect?: string, key?: string, value?: string}>, emptyValue: () => any) => {

  if (isNil(tolerations)) {
    return emptyValue();
  }

  return tolerations.map(toleration => {
    const key = isEmpty(toleration.key) ? emptyValue() : toleration.key;
    const value = isEmpty(toleration.value) ? emptyValue() : toleration.value;

    if (!OperatorValues[toleration.operator]) {
      throw Boom.badRequest(`operator should be one of [${values(OperatorValues)}], but got ${toleration.operator}`, {
        code: ErrorCodes.REQUEST_BODY_INVALID
      });
    }

    // If the operator is Exists, key optional & value should not be specified
    if (toleration.operator === OperatorValues.Exists && value) {
      throw Boom.badRequest('If the operator is Exists, value should not be specified', {
        code: ErrorCodes.REQUEST_BODY_INVALID
      });
    }

    // If the operator is Equal, key, value are required
    if (toleration.operator === OperatorValues.Equal && (!key || !value)) {
      throw Boom.badRequest('If the operator is Equal, key, value are required', {
        code: ErrorCodes.REQUEST_BODY_INVALID
      });
    }

    // validate and convert effect
    if (EffectValues.indexOf(toleration.effect) < 0) {
      throw Boom.badRequest(`effect should be one of [${EffectValues.join()}], but got ${toleration.effect}`, {
        code: ErrorCodes.REQUEST_BODY_INVALID
      });
    }

    const effect = (toleration.effect === EffectNone) ? emptyValue() : toleration.effect;
    return {
      operator: toleration.operator,
      effect,
      key,
      value
    };
  });
};

// graphql business logics
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
    spec: item.spec,
    tolerations: item.spec.tolerations ? item.spec.tolerations.map(toleration => {
      return {
        ...toleration,
        // if it's null, return none
        effect: toleration.effect ? toleration.effect : EffectNone
      };
    }) : [],
    nodeSelector: item.spec.nodeSelector
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

  const tolerations = validateAndMapTolerations(get(data, 'tolerations.set'), () => undefined);
  const nodeSelector = isEmpty(data.nodeSelector) ? undefined : data.nodeSelector;

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
      'requests.memory': data.memoryRequest ? stringifyMemory(data.memoryRequest) : undefined,
      tolerations,
      nodeSelector
    }
  };
};

export const updateMapping = (data: any) => {
  expectInputLargerThanZero(data.cpuLimit, 'cpuLimit');
  expectInputLargerThanZero(data.memoryLimit, 'memoryLimit');
  expectInputLargerThanZero(data.cpuRequest, 'cpuRequest');
  expectInputLargerThanZero(data.memoryRequest, 'memoryRequest');

  const tolerations = validateAndMapTolerations(get(data, 'tolerations.set'), () => null);
  const nodeSelector = isEmpty(data.nodeSelector) ? null : data.nodeSelector;

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
      'requests.memory': data.memoryRequest ? stringifyMemory(data.memoryRequest) : undefined,
      tolerations,
      nodeSelector
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
