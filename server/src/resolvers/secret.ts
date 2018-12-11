import { Context } from './interface';
import { toRelay, filter, paginate, extractPagination } from './utils';
import GitSyncSecret from '../k8sResource/gitSyncSecret';
import * as logger from '../logger';

/**
 * Query
 */

const listQuery = async (gitSyncSecret: GitSyncSecret, where: any) => {
  const secrets = await gitSyncSecret.find();
  return filter(secrets, where);
};

export const query = async (root, args, context: Context) => {
  const {gitSyncSecret} = context;
  const users = await listQuery(gitSyncSecret, args && args.where);
  return paginate(users, extractPagination(args));
};

export const connectionQuery = async (root, args, context: Context) => {
  const {gitSyncSecret} = context;
  const users = await listQuery(gitSyncSecret, args && args.where);
  return toRelay(users, extractPagination(args));
};

export const queryOne = async (root, args, context: Context) => {
  const id = args.where.id;
  const {gitSyncSecret} = context;
  try {
    return gitSyncSecret.findOne(id);
  } catch (e) {
    return null;
  }
};

/**
 * Relation
 */

export const resolveInDataSet = {
  secret: async (root, args, context: Context) => {
    if (!root.secret) {
      return null;
    }
    const {gitSyncSecret} = context;
    return gitSyncSecret.findOne(root.secret);
  }
};

/**
 * Mutation
 */

export const create = async (root, args, context: Context) => {
  const data = args.data;
  const {gitSyncSecret} = context;

  const created = await gitSyncSecret.create({
    ...data,
    displayName: data.displayName || data.name
  });

  logger.info({
    component: logger.components.secret,
    type: 'CREATE',
    userId: context.userId,
    username: context.username,
    id: created.id
  });

  return created;
};

export const update = async (root, args, context: Context) => {
  const id = args.where.id;
  const data = args.data;
  const {gitSyncSecret} = context;

  logger.info({
    component: logger.components.secret,
    type: 'UPDATE',
    userId: context.userId,
    username: context.username,
    id
  });

  return gitSyncSecret.update(id, data);
};

export const destroy = async (root, args, context: Context) => {
  const id = args.where.id;
  const {gitSyncSecret} = context;
  await gitSyncSecret.delete(id);

  logger.info({
    component: logger.components.secret,
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
