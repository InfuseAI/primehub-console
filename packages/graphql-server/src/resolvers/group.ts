import KcAdminClient from 'keycloak-admin';
import {
  toRelay,
  mutateRelation,
  parseDiskQuota,
  stringifyDiskQuota,
  parseMemory,
  stringifyMemory,
  filter,
  paginate,
  extractPagination} from './utils';
import { pick, isNil, omit, get, isEmpty, mapValues } from 'lodash';
import { crd as instanceTypeResolver } from './instanceType';
import { crd as datasetResolver } from './dataset';
import { crd as imageResolver } from './image';
import { Context } from './interface';
import { Attributes, FieldType } from './attr';
import { keycloakMaxCount } from './constant';
import { ApolloError } from 'apollo-server';
import * as logger from '../logger';
import Boom from 'boom';
import CurrentWorkspace, { createInResolver } from '../workspace/currentWorkspace';
import { isKeycloakGroupNameWorkspace } from '../workspace/api';
import GroupRepresentation from 'keycloak-admin/lib/defs/groupRepresentation';
import {createConfig} from '../config';
import { transform } from './groupUtils';

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
  launchGroupOnly: {type: FieldType.boolean, rename: 'launch-group-only'},
  enabledDeployment: {type: FieldType.boolean, rename: 'enabled-deployment'}
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
  // displayName, canUseGpu, quotaGpu in attributes
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

  if (config.primehubMode === 'deploy') {
    // enable model deployment in 'deploy' mode automatically
    attrs.mergeWithData({
      enabledDeployment: true
    });
  }

  const groups = await kcAdminClient.groups.find();
  // max group validation need minus everyone group.
  if (groups.length > config.maxGroup) {
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

  return injectWorkspace(transform(group), currentWorkspace);
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
  // displayName, canUseGpu, quotaGpu in attributes
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
  // create pvc
  if (payload.enabledSharedVolume && payload.sharedVolumeCapacity >= 0) {
    await context.k8sGroupPvc.create({
      groupName: group.name,
      volumeSize: payload.sharedVolumeCapacity
    });
  }

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

  return injectWorkspace(transform(group), currentWorkspace);
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

  return injectWorkspace(transform(group), currentWorkspace);
};

/**
 * Query
 */

const quotaComparator = (fieldName: string) => (group: any) => {
  const fieldValue = group[fieldName];
  if (isNil(fieldValue)) {
    return Number.POSITIVE_INFINITY;
  }
  return fieldValue;
};

const customComparators: Record<string, (group: any) => number> = {
  quotaCpu: quotaComparator('quotaCpu'),
  quotaGpu: quotaComparator('quotaGpu'),
  projectQuotaCpu: quotaComparator('projectQuotaCpu'),
  projectQuotaGpu: quotaComparator('projectQuotaGpu'),
};

const listQuery = async (
  kcAdminClient: KcAdminClient,
  where: any,
  order: any,
  currentWorkspace: CurrentWorkspace,
  context: Context
): Promise<{fetched: boolean, groups: any[]}> => {
  const idWhere = get(where, 'id');
  if (idWhere) {
    const group = await kcAdminClient.groups.findOne({id: idWhere});
    return group ? {
      fetched: true,
      groups: [transform(group)]
     } : {
       fetched: false,
       groups: [],
     };
  }

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

  // do not need to sort, so we do pagination first and then map
  if (isEmpty(order)) {
    groups = filter(groups, whereWithoutWorkspace, order);
    return {
      fetched: false,
      groups,
    };
  } else {
    // need to sort, we fetch all groups first
    const fetchedGroups = await Promise.all(
      groups.map(group => context.kcAdminClient.groups.findOne({id: group.id})));
    const transformed = fetchedGroups.map(transform);
    groups = filter(transformed, whereWithoutWorkspace, order, customComparators);
    return {
      fetched: true,
      groups,
    };
  }
};

export const query = async (root, args, context: Context) => {
  const currentWorkspace = createInResolver(root, args, context);
  const groupQuery =
    await listQuery(context.kcAdminClient, args && args.where, args && args.orderBy, currentWorkspace, context);

  // if not fetched, we paginate first then map
  let fetchedAndPagedGroups;
  if (!groupQuery.fetched) {
    const pageGroups = paginate(groupQuery.groups, extractPagination(args));
    fetchedAndPagedGroups = await Promise.all(
      pageGroups.map(group => context.kcAdminClient.groups.findOne({id: group.id})));
  } else {
    // map already, just paginate
    fetchedAndPagedGroups = paginate(groupQuery.groups, extractPagination(args)).map(transform);
  }

  return fetchedAndPagedGroups.map(group => injectWorkspace(group, currentWorkspace));
};

export const connectionQuery = async (root, args, context: Context) => {
  const currentWorkspace = createInResolver(root, args, context);
  const groupQuery =
    await listQuery(context.kcAdminClient, args && args.where, args && args.orderBy, currentWorkspace, context);

  const relayResponse = toRelay(groupQuery.groups, extractPagination(args));
  relayResponse.edges = await Promise.all(relayResponse.edges.map(
    async edge => {
      // if fetched, we dont fetch again
      const fetchedNode = groupQuery.fetched ?
        edge.node
        : transform(await context.kcAdminClient.groups.findOne({id: edge.node.id}));

      return {
        cursor: edge.cursor,
        node: injectWorkspace(fetchedNode, currentWorkspace)
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
  return group ? injectWorkspace(transform(group), currentWorkspace) : null;
};

export const typeResolvers = {
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
