import { Context } from './interface';
import { Item } from '../crdClient/customResourceNG';
import { InstanceTypeSpec } from '../crdClient/crdClientImpl';
import { mutateRelation, parseMemory, stringifyMemory, mergeVariables } from './utils';
import { Crd } from './crd';
import { isUndefined, isNil, values, isEmpty, get, omit, isArray } from 'lodash';
import RoleRepresentation from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import Boom from 'boom';
import { ApolloError } from 'apollo-server';
import { ErrorCodes } from '../errorCodes';
import { isNull } from 'util';
import { ResourceNamePrefix } from './resourceRole';

// utils
const EffectNone = 'None';
const EffectValues = ['NoSchedule', 'PreferNoSchedule', 'NoExecute', EffectNone];
const OperatorValues = {Equal: 'Equal', Exists: 'Exists'};
// tslint:disable-next-line:max-line-length
const validateAndMapTolerations = (tolerations: Array<{operator: string, effect?: string, key?: string, value?: string}>, method: 'create' | 'update') => {
  const emptyValue = method === 'create' ? undefined : null;

  // if create method, empty tolerations return undefined
  if (method === 'create' && isEmpty(tolerations)) {
    // do nothing
    return undefined;
  }

  // if update method and tolerations is empty array, means delete all
  if (method === 'update' && isArray(tolerations) && isEmpty(tolerations)) {
    return null;
  }

  // if update method and tolerations is undefined, return undefined
  if (method === 'update' && isNil(tolerations)) {
    return undefined;
  }

  return tolerations.map(toleration => {
    const key = isEmpty(toleration.key) ? emptyValue : toleration.key;
    const value = isEmpty(toleration.value) ? emptyValue : toleration.value;

    if (!OperatorValues[toleration.operator]) {
      throw new ApolloError(`operator should be one of [${values(OperatorValues)}], but got ${toleration.operator}`, ErrorCodes.REQUEST_BODY_INVALID);
    }

    // If the operator is Exists, key optional & value should not be specified
    if (toleration.operator === OperatorValues.Exists && value) {
      throw new ApolloError('If the operator is Exists, value should not be specified', ErrorCodes.REQUEST_BODY_INVALID);
    }

    // If the operator is Equal, key, value are required
    if (toleration.operator === OperatorValues.Equal && (!key || !value)) {
      throw new ApolloError('If the operator is Equal, key, value are required', ErrorCodes.REQUEST_BODY_INVALID);
    }

    // validate and convert effect
    if (EffectValues.indexOf(toleration.effect) < 0) {
      throw new ApolloError(`effect should be one of [${EffectValues.join()}], but got ${toleration.effect}`, ErrorCodes.REQUEST_BODY_INVALID);
    }

    const effect = (toleration.effect === EffectNone) ? emptyValue : toleration.effect;
    return {
      operator: toleration.operator,
      effect,
      key,
      value
    };
  });
};

const requestFieldTransform = (value: any, parseFunction?: (v: any) => any) => {
  if (isNil(value)) {
    return null;
  }

  return parseFunction ? parseFunction(value) : value;
};

// graphql business logics
export const mapping = (item: Item<InstanceTypeSpec>) => {
  return {
    id: item.metadata.name,
    name: item.metadata.name,
    description: item.spec.description,
    displayName: item.spec.displayName || item.metadata.name,
    cpuLimit: item.spec['limits.cpu'] || 0,
    gpuLimit: item.spec['limits.nvidia.com/gpu'] || 0,
    memoryLimit: item.spec['limits.memory'] ? parseMemory(item.spec['limits.memory']) : null,

    // request attributes and be null (disabled field), or number
    cpuRequest: requestFieldTransform(item.spec['requests.cpu']),
    memoryRequest: requestFieldTransform(item.spec['requests.memory'], parseMemory),
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
    const {kcAdminClient} = context;
    const everyoneGroupId = context.everyoneGroupId;
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

  const tolerations = validateAndMapTolerations(get(data, 'tolerations.set'), 'create');
  const nodeSelector = isEmpty(data.nodeSelector) ? undefined : data.nodeSelector;

  const cpuRequest = data.cpuRequest;
  const memoryRequest = data.memoryRequest;

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

      // requests fields should be left empty if not defined by user
      'requests.cpu': cpuRequest,
      'requests.memory': memoryRequest ? stringifyMemory(memoryRequest) : undefined,
      tolerations,
      nodeSelector
    }
  };
};

// Note: for cpuRequest and memoryRequest fields,
// assign them to null means disable them
// undefined means value not change
const parseRequestField = (value: any, parseFunction: (v: any) => any) => {
  if (isNull(value) || isUndefined(value)) {
    return value;
  }

  return parseFunction(value);
};

export const updateMapping = (data: any) => {
  expectInputLargerThanZero(data.cpuLimit, 'cpuLimit');
  expectInputLargerThanZero(data.memoryLimit, 'memoryLimit');

  const tolerations = validateAndMapTolerations(get(data, 'tolerations.set'), 'update');
  const nodeSelector = (data.nodeSelector && isEmpty(data.nodeSelector)) ? null : data.nodeSelector;

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
      'requests.memory': parseRequestField(data.memoryRequest, stringifyMemory),
      'nodeSelector': nodeSelector,
      tolerations,
    }
  };
};

export const customUpdate = async ({
  name, metadata, spec, customResource, context, getPrefix, data
}: {
  name: string, metadata: any, spec: any, customResource: any, context: Context, getPrefix: () => string, data: any
}) => {
  // find original variables first
  const row = await customResource.get(name);
  const originalVariables = row.spec.nodeSelector || {};
  const newVariables = spec.nodeSelector;
  spec.nodeSelector = mergeVariables(originalVariables, newVariables);
  const res = await customResource.patch(name, {
    metadata: omit(metadata, 'name'),
    spec
  });

  return res;
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
  prefixName: ResourceNamePrefix.it,
  resourceName: 'instanceType',
  createMapping,
  updateMapping,
  customUpdate,
  onCreate,
  onUpdate
});
