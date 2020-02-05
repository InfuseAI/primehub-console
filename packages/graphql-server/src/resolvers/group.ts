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
  extractPagination,
  parseBoolean
} from './utils';
import { pick, first, isNil, omit } from 'lodash';
import { crd as instanceTypeResolver } from './instanceType';
import { crd as datasetResolver } from './dataset';
import { crd as imageResolver } from './image';
import { Context } from './interface';
import { Attributes, FieldType } from './attr';
import { keycloakMaxCount, defaultWorkspaceId } from './constant';
import { ApolloError } from 'apollo-server';
import * as logger from '../logger';
import * as Boom from 'boom';
import CurrentWorkspace, { createInResolver } from '../workspace/currentWorkspace';
import { isKeycloakGroupNameWorkspace } from '../workspace/api';
import GroupRepresentation from 'keycloak-admin/lib/defs/groupRepresentation';
import {createConfig} from '../config';

const config = createConfig();

// constants
const attrSchema = {
  displayName: {type: FieldType.string},
  quotaCpu: {type: FieldType.float, rename: 'quota-cpu'},
  quotaGpu: {type: FieldType.integer, rename: 'quota-gpu'},
  quotaMemory: {serialize: stringifyMemory, deserialize: parseMemory, rename: 'quota-memory'},
  userVolumeCapacity: {serialize: stringifyDiskQuota, deserialize: parseDiskQuota, rename: 'user-volume-capacity'},
  projectQuotaCpu: {type: FieldType.float, rename: 'project-quota-cpu'},
  projectQuotaGpu: {type: FieldType.integer, rename: 'project-quota-gpu'},
  projectQuotaMemory: {serialize: stringifyMemory, deserialize: parseMemory, rename: 'project-quota-memory'},
  // shared volume
  enabledSharedVolume: {type: FieldType.boolean, rename: 'enabled-shared-volume'},
  sharedVolumeCapacity: {serialize: stringifyDiskQuota, deserialize: parseDiskQuota, rename: 'shared-volume-capacity'},
  homeSymlink: {type: FieldType.boolean, rename: 'home-symlink'},
  launchGroupOnly: {type: FieldType.boolean, rename: 'launch-group-only'}
};

const groupAttrs = Object.keys(attrSchema);

// utils
const validateSharedVolumeAttrs = (attrs: Attributes) => {
  const {enabledSharedVolume, sharedVolumeCapacity} = attrs.getData();

  // if a group has sharedVolumeCapacity = null + enabledSharedVolume, it should raise an error.
  if (enabledSharedVolume && isNil(sharedVolumeCapacity)) {
    throw Boom.badData('sharedVolumeCapacity should not be null');
  }
};

const injectWorkspace = (group: GroupRepresentation, currentWorkspace: CurrentWorkspace) => {
  return {
    ...group,
    currentWorkspace
  };
};

/**
 * Mutation
 */

export const create = async (root, args, context: Context) => {
  const kcAdminClient = context.kcAdminClient;
  const workspaceApi = context.workspaceApi;
  const currentWorkspace = createInResolver(root, args, context);

  // create resource
  // displayName, canUseGpu, quotaGpu, userVolumeCapacity in attributes
  const payload = args.data;

  const attrs = new Attributes({
    data: {
      ...pick(payload, groupAttrs),
      // set homeSymlink to true if enabledSharedVolume
      homeSymlink: payload.enabledSharedVolume ? true : undefined
    },
    schema: attrSchema
  });

  validateSharedVolumeAttrs(attrs);

  let groups = await kcAdminClient.groups.find()
  // max group validation need minus everyone group.
  if (groups.length - 1 > parseInt(config.maxGroup, 10)) {
    throw Boom.badData(`Max group limit: ${config.maxGroup} exceeded`);
  }

  let groupId: string;
  try {
    if (currentWorkspace.checkIsDefault()) {
      const response = await kcAdminClient.groups.create({
        name: payload.name,
        attributes: attrs.toKeycloakAttrs()
      });
      groupId = response.id;
    } else {
      groupId = await workspaceApi.createGroup({
        workspaceId: currentWorkspace.getWorkspaceId(),
        name: payload.name,
        attributes: attrs.toKeycloakAttrs()
      });
    }
  } catch (err) {
    if (!err.response || err.response.status !== 409) {
      throw err;
    }
    throw new ApolloError('Group exists with same name', 'GROUP_CONFLICT_NAME');
  }

  // find the group
  const group = await kcAdminClient.groups.findOne({
    id: groupId
  });

  // create pvc
  if (payload.enabledSharedVolume && payload.sharedVolumeCapacity >= 0) {
    await context.k8sGroupPvc.create({
      groupName: group.name,
      volumeSize: payload.sharedVolumeCapacity
    });
  }

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
    id: group.id,
    workspaceId: currentWorkspace.getWorkspaceId()
  });

  return injectWorkspace(group, currentWorkspace);
};

export const update = async (root, args, context: Context) => {
  const groupId = args.where.id;
  const currentWorkspace = createInResolver(root, args, context);
  const kcAdminClient = context.kcAdminClient;

  // update resource
  // even workspace sub-group is created under workspace group,
  // id can still find the right group
  const payload = args.data;
  const group = await kcAdminClient.groups.findOne({
    id: groupId
  });

  // merge attrs
  // displayName, canUseGpu, quotaGpu, userVolumeCapacity in attributes
  const attrs = new Attributes({
    keycloakAttr: group.attributes,
    schema: attrSchema
  });

  const data = pick(payload, groupAttrs);
  // set homeSymlink to true if enabledSharedVolume
  // if enabledSharedVolume not specified, do not update the homeSymlink field
  if (payload.enabledSharedVolume) {
    data.homeSymlink = true;
  }
  attrs.mergeWithData(data);

  // validate if a group has sharedVolumeCapacity = null + enabledSharedVolume, it should raise an error.
  validateSharedVolumeAttrs(attrs);

  // update
  try {
    await kcAdminClient.groups.update({id: groupId}, {
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
    id: group.id,
    workspaceId: currentWorkspace.getWorkspaceId()
  });

  return injectWorkspace(group, currentWorkspace);
};

export const destroy = async (root, args, context: Context) => {
  const groupId = args.where.id;
  const currentWorkspace = createInResolver(root, args, context);
  const kcAdminClient = context.kcAdminClient;
  const group = await kcAdminClient.groups.findOne({
    id: groupId
  });
  await kcAdminClient.groups.del({
    id: groupId
  });
  await context.k8sGroupPvc.delete(group.name);

  logger.info({
    component: logger.components.group,
    type: 'DELETE',
    userId: context.userId,
    username: context.username,
    id: group.id,
    workspaceId: currentWorkspace.getWorkspaceId()
  });

  return injectWorkspace(group, currentWorkspace);
};

/**
 * Query
 */

const listQuery = async (
  kcAdminClient: KcAdminClient, where: any, currentWorkspace: CurrentWorkspace, context: Context) => {
  const whereWithoutWorkspace = omit(where, 'workspaceId');
  const workspaceApi = context.workspaceApi;
  let groups = (currentWorkspace.checkIsDefault()) ?
    await kcAdminClient.groups.find({
      max: keycloakMaxCount
    }) :
    await workspaceApi.listGroups(currentWorkspace.getWorkspaceId());
  const everyoneGroupId = context.everyoneGroupId;
  // filter out everyone
  groups = groups.filter(group => group.id !== everyoneGroupId);
  // filter workspace groups
  groups = groups.filter(group => !isKeycloakGroupNameWorkspace(group.name));
  groups = filter(groups, whereWithoutWorkspace);
  return groups.map(group => injectWorkspace(group, currentWorkspace));
};

export const query = async (root, args, context: Context) => {
  const currentWorkspace = createInResolver(root, args, context);
  const groups = await listQuery(context.kcAdminClient, args && args.where, currentWorkspace, context);
  const paginatedGroups = paginate(groups, extractPagination(args));
  const fetchedGroups = await Promise.all(
    paginatedGroups.map(group => context.kcAdminClient.groups.findOne({id: group.id})));
  return fetchedGroups.map(group => injectWorkspace(group, currentWorkspace));
};

export const connectionQuery = async (root, args, context: Context) => {
  const currentWorkspace = createInResolver(root, args, context);
  const groups = await listQuery(context.kcAdminClient, args && args.where, currentWorkspace, context);
  const relayResponse = toRelay(groups, extractPagination(args));
  relayResponse.edges = await Promise.all(relayResponse.edges.map(
    async edge => {
      const group = await context.kcAdminClient.groups.findOne({id: edge.node.id});
      return {
        cursor: edge.cursor,
        node: injectWorkspace(group, currentWorkspace)
      };
    })
  );
  return relayResponse;
};

export const queryOne = async (root, args, context: Context) => {
  const currentWorkspace = createInResolver(root, args, context);
  const groupId = args.where.id;
  const kcAdminClient = context.kcAdminClient;
  const group = await kcAdminClient.groups.findOne({id: groupId});
  return group ? injectWorkspace(group, currentWorkspace) : null;
};

export const typeResolvers = {
  quotaCpu: async (parent, args, context: Context) =>
    getFromAttr('quota-cpu', parent.attributes, null, parseFloat),

  quotaGpu: async (parent, args, context: Context) =>
    getFromAttr('quota-gpu', parent.attributes, null, parseInt),

  quotaMemory: async (parent, args, context: Context) =>
    getFromAttr('quota-memory', parent.attributes, null, parseMemory),

  userVolumeCapacity: async (parent, args, context: Context) =>
    getFromAttr('user-volume-capacity', parent.attributes, null, parseDiskQuota),

  projectQuotaCpu: async (parent, args, context: Context) =>
    getFromAttr('project-quota-cpu', parent.attributes, null, parseFloat),

  projectQuotaGpu: async (parent, args, context: Context) =>
    getFromAttr('project-quota-gpu', parent.attributes, null, parseInt),

  projectQuotaMemory: async (parent, args, context: Context) =>
    getFromAttr('project-quota-memory', parent.attributes, null, parseMemory),

  // shared volume
  enabledSharedVolume: async (parent, args, context: Context) =>
    getFromAttr('enabled-shared-volume', parent.attributes, false, parseBoolean),

  sharedVolumeCapacity: async (parent, args, context: Context) =>
    getFromAttr('shared-volume-capacity', parent.attributes, null, parseDiskQuota),

  homeSymlink: async (parent, args, context: Context) =>
    getFromAttr('home-symlink', parent.attributes, null, parseBoolean),

  launchGroupOnly: async (parent, args, context: Context) =>
    getFromAttr('launch-group-only', parent.attributes, null, parseBoolean),

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
