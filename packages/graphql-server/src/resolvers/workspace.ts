import { Context } from './interface';
import { toRelay, filter, paginate, extractPagination, mutateRelation } from './utils';
import * as logger from '../logger';

/**
 * Query
 */

export const query = async (root, args, context: Context) => {
  const {workspaceApi} = context;
  const workspaces = await workspaceApi.find();
  return paginate(workspaces, extractPagination(args));
};

export const connectionQuery = async (root, args, context: Context) => {
  const {workspaceApi} = context;
  const workspaces = await workspaceApi.find();
  return toRelay(workspaces, extractPagination(args));
};

export const queryOne = async (root, args, context: Context) => {
  const id = args.where.id;
  const {workspaceApi} = context;
  try {
    const workspace = await workspaceApi.findOne(id);
    return workspace;
  } catch (e) {
    return null;
  }
};

/**
 * Mutation
 */

export const create = async (root, args, context: Context) => {
  const data = args.data;
  const {workspaceApi, kcAdminClient} = context;

  const created = await workspaceApi.create({
    name: data.name,
    displayName: data.displayName || data.name
  });

  // add users
  try {
    await mutateRelation({
      resource: data.members,
      connect: async where => {
        await workspaceApi.addMember(created.id, where.id);
      }
    });
  } catch (e) {
    logger.error({
      component: logger.components.workspace,
      type: 'CREATE_USER_RELATION_MUTATION',
      stacktrace: e.stack,
      message: e.message,
      workspaceId: created.id
    });
  }

  logger.info({
    component: logger.components.workspace,
    type: 'CREATE',
    userId: context.userId,
    username: context.username,
    id: created.id,
    workspaceId: created.id
  });

  return created;
};

export const update = async (root, args, context: Context) => {
  const id = args.where.id;
  const data = args.data;
  const {workspaceApi, kcAdminClient} = context;

  logger.info({
    component: logger.components.workspace,
    type: 'UPDATE',
    userId: context.userId,
    username: context.username,
    id,
  });

  const workspace = await workspaceApi.update(id, {
    displayName: data.displayName,
  });

  // connect to users
  try {
    await mutateRelation({
      resource: data.members,
      connect: where => {
        // add user to group
        return workspaceApi.addMember(workspace.id, where.id);
      },
      disconnect: where => {
        return workspaceApi.delMember(workspace.id, where.id);
      }
    });
  } catch (e) {
    logger.error({
      component: logger.components.workspace,
      type: 'UPDATE_USER_RELATION_MUTATION',
      stacktrace: e.stack,
      message: e.message,
      workspaceId: id
    });
  }
  return workspace;
};

export const destroy = async (root, args, context: Context) => {
  const id = args.where.id;
  const {workspaceApi} = context;
  await workspaceApi.destroy(id);

  logger.info({
    component: logger.components.workspace,
    type: 'DELETE',
    userId: context.userId,
    username: context.username,
    id
  });

  return {
    id,
    name: id
  };
};

export const typeResolvers = {
  members: async (parent, args, context: Context) => {
    try {
      if (!parent.keycloakGroupId) {
        return [];
      }

      return context.kcAdminClient.groups.listMembers({
        id: parent.keycloakGroupId
      });
    } catch (err) {
      return [];
    }
  },
};
