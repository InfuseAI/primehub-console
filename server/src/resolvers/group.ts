import KcAdminClient from 'keycloak-admin';
import {
  toRelay,
  getFromAttr,
  mutateRelation,
  parseDiskQuota,
  stringifyDiskQuota,
  parseMemory,
  stringifyMemory,
  filter,
  paginate,
  extractPagination
} from './utils';
import { pick, first } from 'lodash';
import { crd as instanceTypeResolver } from './instanceType';
import { crd as datasetResolver } from './dataset';
import { crd as imageResolver } from './image';
import { Context } from './interface';
import { Attributes, FieldType } from './attr';
import { keycloakMaxCount } from './constant';
import { ApolloError } from 'apollo-server';
import * as logger from '../logger';

// constants
const groupAttrs = [
  'displayName',
  'quotaCpu',
  'quotaGpu',
  'quotaMemory',
  'quotaDisk',
  'projectQuotaGpu',
  'projectQuotaCpu',
  'projectQuotaMemory'
];

const attrSchema = {
  displayName: {type: FieldType.string},
  quotaCpu: {type: FieldType.float, rename: 'quota-cpu'},
  quotaGpu: {type: FieldType.integer, rename: 'quota-gpu'},
  quotaMemory: {serialize: stringifyMemory, deserialize: parseMemory, rename: 'quota-memory'},
  quotaDisk: {serialize: stringifyDiskQuota, deserialize: parseDiskQuota, rename: 'quota-disk'},
  projectQuotaCpu: {type: FieldType.float, rename: 'project-quota-cpu'},
  projectQuotaGpu: {type: FieldType.integer, rename: 'project-quota-gpu'},
  projectQuotaMemory: {serialize: stringifyMemory, deserialize: parseMemory, rename: 'project-quota-memory'}
};

/**
 * Mutation
 */

export const create = async (root, args, context: Context) => {
  const kcAdminClient = context.kcAdminClient;

  // create resource
  // displayName, canUseGpu, quotaGpu, quotaDisk in attributes
  const payload = args.data;
  const attrs = new Attributes({
    data: pick(payload, groupAttrs),
    schema: attrSchema
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
    logger.error({
      component: logger.components.group,
      type: 'CREATE_USER_RELATION_MUTATION',
      stacktrace: e.stack,
      message: e.message
    });
  }

  logger.info({
    component: logger.components.group,
    type: 'CREATE',
    userId: context.userId,
    username: context.username,
    id: group.id
  });

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
  // displayName, canUseGpu, quotaGpu, quotaDisk in attributes
  const attrs = new Attributes({
    keycloakAttr: group.attributes,
    schema: attrSchema
  });
  attrs.mergeWithData(pick(payload, groupAttrs));

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
    logger.error({
      component: logger.components.watcher,
      type: 'UPDATE_USER_RELATION_MUTATION',
      stacktrace: e.stack,
      message: e.message
    });
  }

  logger.info({
    component: logger.components.group,
    type: 'UPDATE',
    userId: context.userId,
    username: context.username,
    id: group.id
  });

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

  logger.info({
    component: logger.components.group,
    type: 'DELETE',
    userId: context.userId,
    username: context.username,
    id: group.id
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
  quotaCpu: async (parent, args, context: Context) =>
    getFromAttr('quota-cpu', parent.attributes, null, parseFloat),

  quotaGpu: async (parent, args, context: Context) =>
    getFromAttr('quota-gpu', parent.attributes, null, parseInt),

  quotaMemory: async (parent, args, context: Context) =>
    getFromAttr('quota-memory', parent.attributes, null, parseMemory),

  quotaDisk: async (parent, args, context: Context) =>
    getFromAttr('quota-disk', parent.attributes, 20, parseDiskQuota),

  projectQuotaCpu: async (parent, args, context: Context) =>
    getFromAttr('project-quota-cpu', parent.attributes, null, parseFloat),

  projectQuotaGpu: async (parent, args, context: Context) =>
    getFromAttr('project-quota-gpu', parent.attributes, null, parseInt),

  projectQuotaMemory: async (parent, args, context: Context) =>
    getFromAttr('project-quota-memory', parent.attributes, null, parseMemory),

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
