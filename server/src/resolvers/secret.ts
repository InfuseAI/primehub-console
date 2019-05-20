import { Context } from './interface';
import { toRelay, filter, paginate, extractPagination } from './utils';
import K8sSecret, {SECRET_DOCKER_CONFIG_JSON_TYPE, SECRET_OPAQUE_TYPE} from '../k8sResource/k8sSecret';
import * as logger from '../logger';
import { get, pick } from 'lodash';

export const serializeType = (type: string) => {
  return (type === 'kubernetes') ? SECRET_DOCKER_CONFIG_JSON_TYPE : SECRET_OPAQUE_TYPE;
};

export const deserializeType = (type: string) => {
  return (type === SECRET_DOCKER_CONFIG_JSON_TYPE) ? 'kubernetes' : 'opaque';
};

const transformSecret = (secret: any) => {
  return {
    ...secret,
    type: deserializeType(secret.type)
  };
};

/**
 * Query
 */

const listQuery = async (k8sSecret: K8sSecret, where: any) => {
  // filter ifDockerConfigJson
  const ifDockerConfigJson = get(where, 'ifDockerConfigJson', false);
  const secrets = ifDockerConfigJson ?
    await k8sSecret.find(SECRET_DOCKER_CONFIG_JSON_TYPE) :
    await k8sSecret.find();
  return filter(secrets, where);
};

export const query = async (root, args, context: Context) => {
  const {k8sSecret} = context;
  let secrets = await listQuery(k8sSecret, args && args.where);
  secrets = secrets.map(transformSecret);
  return paginate(secrets, extractPagination(args));
};

export const connectionQuery = async (root, args, context: Context) => {
  const {k8sSecret} = context;
  let secrets = await listQuery(k8sSecret, args && args.where);
  secrets = secrets.map(transformSecret);
  return toRelay(secrets, extractPagination(args));
};

export const queryOne = async (root, args, context: Context) => {
  const id = args.where.id;
  const {k8sSecret} = context;
  try {
    const secret = await k8sSecret.findOne(id);
    return transformSecret(secret);
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
    const {k8sSecret} = context;
    const secret = await k8sSecret.findOne(root.secret);
    return transformSecret(secret);
  }
};

/**
 * Mutation
 */

export const create = async (root, args, context: Context) => {
  const data = args.data;
  const {k8sSecret} = context;

  const created = await k8sSecret.create({
    name: data.name,
    type: serializeType(data.type),
    displayName: data.displayName || data.name,
    config: pick(data, ['secret', 'registryHost', 'username', 'password'])
  });

  logger.info({
    component: logger.components.secret,
    type: 'CREATE',
    userId: context.userId,
    username: context.username,
    id: created.id
  });

  return transformSecret(created);
};

export const update = async (root, args, context: Context) => {
  const id = args.where.id;
  const data = args.data;
  const {k8sSecret} = context;

  logger.info({
    component: logger.components.secret,
    type: 'UPDATE',
    userId: context.userId,
    username: context.username,
    id
  });

  const secret = await k8sSecret.update(id, {
    displayName: data.displayName,
    config: pick(data, ['secret', 'registryHost', 'username', 'password'])
  });
  return transformSecret(secret);
};

export const destroy = async (root, args, context: Context) => {
  const id = args.where.id;
  const {k8sSecret} = context;
  await k8sSecret.delete(id);

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
