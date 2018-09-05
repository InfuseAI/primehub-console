import KcAdminClient from 'keycloak-admin';
import {
  toRelay, getFromAttr, mutateRelation, parseDiskQuota, stringifyDiskQuota, filter, paginate, extractPagination
} from './utils';
import CrdClient from '../crdClient/crdClientImpl';
import { mapValues, find, pick, first } from 'lodash';
import { unflatten } from 'flat';
import { crd as instanceTypeResolver } from './instanceType';
import { crd as datasetResolver } from './dataset';
import { crd as imageResolver } from './image';
import { Context } from './interface';
import { Attributes, FieldType } from './attr';
import { keycloakMaxCount } from './constant';
import { ApolloError } from 'apollo-server';

/**
 * Mutation
 */

export const create = async (root, args, context: Context) => {
  const kcAdminClient = context.kcAdminClient;

  // create resource
  // displayName, canUseGpu, gpuQuota, diskQuota in attributes
  const payload = args.data;
  const attrs = new Attributes({
    data: pick(payload, ['displayName', 'canUseGpu', 'gpuQuota', 'projectGpuQuota', 'cpuQuota', 'diskQuota']),
    schema: {
      displayName: {type: FieldType.string},
      canUseGpu: {type: FieldType.boolean},
      cpuQuota: {type: FieldType.float},
      gpuQuota: {type: FieldType.integer, rename: 'quota-gpu'},
      projectGpuQuota: {type: FieldType.integer, rename: 'project-quota-gpu'},
      diskQuota: {serialize: stringifyDiskQuota, deserialize: parseDiskQuota}
    }
  });
  try {
    await kcAdminClient.groups.create({
      name: payload.name,
      attributes: attrs.toKeycloakAttrs()
    });
  } catch (err) {
    if (!err.response || err.response.status !== 409) {
      throw err;
    }
    throw new ApolloError('Group exists with same name', 'GROUP_CONFLICT_NAME');
  }

  // find the group
  const groups = await kcAdminClient.groups.find({search: payload.name});
  const group = await kcAdminClient.groups.findOne({
    id: first(groups).id
  });

  // add users
  try {
    await mutateRelation({
      resource: payload.users,
      connect: async where => {
        // add user to group
        await kcAdminClient.users.addToGroup({
          id: where.id,
          groupId: group.id
        });
      }
    });
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.log(e);
  }

  return group;
};

export const update = async (root, args, context: Context) => {
  const groupId = args.where.id;
  const kcAdminClient = context.kcAdminClient;

  // update resource
  const payload = args.data;
  const group = await kcAdminClient.groups.findOne({
    id: groupId
  });

  // merge attrs
  // displayName, canUseGpu, gpuQuota, diskQuota in attributes
  const attrs = new Attributes({
    keycloakAttr: group.attributes,
    schema: {
      displayName: {type: FieldType.string},
      canUseGpu: {type: FieldType.boolean},
      cpuQuota: {type: FieldType.float},
      gpuQuota: {type: FieldType.integer, rename: 'quota-gpu'},
      projectGpuQuota: {type: FieldType.integer, rename: 'project-quota-gpu'},
      diskQuota: {serialize: stringifyDiskQuota, deserialize: parseDiskQuota}
    }
  });
  attrs.mergeWithData(pick(payload,
    ['displayName', 'canUseGpu', 'gpuQuota', 'projectGpuQuota', 'cpuQuota', 'diskQuota']));

  // update
  try {
    await kcAdminClient.groups.update({id: groupId}, {
      name: payload.name,
      attributes: attrs.toKeycloakAttrs()
    });
  } catch (err) {
    if (!err.response || err.response.status !== 409) {
      throw err;
    }
    throw new ApolloError('Group exists with same name', 'GROUP_CONFLICT_NAME');
  }

  // connect to users
  try {
    await mutateRelation({
      resource: payload.users,
      connect: async where => {
        // add user to group
        await kcAdminClient.users.addToGroup({
          id: where.id,
          groupId: group.id
        });
      },
      disconnect: async where => {
        // add user to group
        await kcAdminClient.users.delFromGroup({
          id: where.id,
          groupId: group.id
        });
      }
    });
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.log(e);
  }

  return group;
};

export const destroy = async (root, args, context: Context) => {
  const groupId = args.where.id;
  const kcAdminClient = context.kcAdminClient;
  const group = await kcAdminClient.groups.findOne({
    id: groupId
  });
  await kcAdminClient.groups.del({
    id: groupId
  });
  return group;
};

/**
 * Query
 */

const listQuery = async (kcAdminClient: KcAdminClient, where: any, context: Context) => {
  let groups = await kcAdminClient.groups.find({
    max: keycloakMaxCount
  });
  const everyoneGroupId = context.everyoneGroupId;
  // filter out everyone
  groups = groups.filter(group => group.id !== everyoneGroupId);
  groups = filter(groups, where);
  return groups;
};

export const query = async (root, args, context: Context) => {
  const groups = await listQuery(context.kcAdminClient, args && args.where, context);
  const paginatedGroups = paginate(groups, extractPagination(args));
  const fetchedGroups = await Promise.all(
    paginatedGroups.map(group => context.kcAdminClient.groups.findOne({id: group.id})));
  return fetchedGroups;
};

export const connectionQuery = async (root, args, context: Context) => {
  const groups = await listQuery(context.kcAdminClient, args && args.where, context);
  const relayResponse = toRelay(groups, extractPagination(args));
  relayResponse.edges = await Promise.all(relayResponse.edges.map(
    async edge => {
      return {
        cursor: edge.cursor,
        node: await context.kcAdminClient.groups.findOne({id: edge.node.id})
      };
    })
  );
  return relayResponse;
};

export const queryOne = async (root, args, context: Context) => {
  const groupId = args.where.id;
  const kcAdminClient = context.kcAdminClient;
  const group = await kcAdminClient.groups.findOne({id: groupId});
  return group;
};

export const typeResolvers = {
  canUseGpu: async (parent, args, context: Context) =>
    getFromAttr('canUseGpu', parent.attributes, false, v => v === 'true'),

  gpuQuota: async (parent, args, context: Context) =>
    getFromAttr('quota-gpu', parent.attributes, 0, parseInt),

  projectGpuQuota: async (parent, args, context: Context) =>
    getFromAttr('project-quota-gpu', parent.attributes, 0, parseInt),

  cpuQuota: async (parent, args, context: Context) =>
    getFromAttr('cpuQuota', parent.attributes, 0, parseFloat),

  diskQuota: async (parent, args, context: Context) =>
    getFromAttr('diskQuota', parent.attributes, 10, parseDiskQuota),

  displayName: async (parent, args, context: Context) =>
    getFromAttr('displayName', parent.attributes, null),

  users: async (parent, args, context: Context) => {
    try {
      return context.kcAdminClient.groups.listMembers({
        id: parent.id
      });
    } catch (err) {
      return [];
    }
  },

  ...instanceTypeResolver.resolveInGroup(),
  ...datasetResolver.resolveInGroup(),
  ...imageResolver.resolveInGroup()
};
