import { ApolloError } from 'apollo-server';

import { Context } from './interface';
import * as logger from '../logger';
import { toGroupPath, isGroupBelongUser } from '../utils/groupCheck';

import { ErrorCodes } from '../errorCodes';
const {NOT_AUTH_ERROR, INTERNAL_ERROR} = ErrorCodes;

interface StoreFile {
  name?: string;
  size?: number;
  lastModified?: Date;
}

const canUserQueryFiles = async (context: Context, userId: string, groupName: string): Promise<boolean> => {
  return isGroupBelongUser(context, userId, groupName);
};

const listQuery = async (context: Context, prefix: string, limit: number, recursive: boolean): Promise<StoreFile[]> => {
  const {minioClient, storeBucket} = context;

  const listObjects = new Promise<StoreFile[]>((resolve, reject) => {
    const fetchedFiles: StoreFile[] = [];
    const stream = minioClient.listObjects(storeBucket, prefix, recursive);
    stream.on('data', obj => {
      if (limit === 0 || fetchedFiles.length < limit) {
        const removedPrefixName = obj.name ? obj.name.replace(prefix, '') : obj.prefix.replace(prefix, '');
        fetchedFiles.push({
          name: removedPrefixName,
          size: obj.size,
          lastModified: obj.lastModified,
        });
      }
    });
    stream.on('error', err => {
      reject(err);
    });
    stream.on('end', () => {
      resolve(fetchedFiles);
    });
  });

  return listObjects;
};

export const query = async (root, args, context: Context) => {
  const {userId} = context;
  const {groupName, prefix} = args.where;

  const viewable = await canUserQueryFiles(context, userId, groupName);
  if (!viewable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }

  let limit = 1000;
  if (args.options && args.options.limit) {
    limit = args.options.limit;
  }
  let recursive = false;
  if (args.options && args.options.recursive) {
    recursive = args.options.recursive;
  }

  const groupPath = toGroupPath(groupName);
  const fullPrefix = `/groups/${groupPath}/${prefix}`;

  let fetchedFiles: StoreFile[] = [];
  try {
    fetchedFiles = await listQuery(context, fullPrefix, limit, recursive);
  } catch (err) {
    logger.error({
      component: logger.components.store,
      type: 'STORE_LIST_OBJECTS',
      stacktrace: err.stack,
      message: err.message
    });
    throw new ApolloError('failed to list store objects', INTERNAL_ERROR);
  }

  return {
    items: fetchedFiles,
    phfsPrefix: prefix,
    prefix: fullPrefix.substring(1),
  };
};

export const destroy = async (root, args, context: Context) => {
  const {minioClient, storeBucket, userId} = context;
  const {groupName, prefix} = args.where;

  const viewable = await canUserQueryFiles(context, userId, groupName);
  if (!viewable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }

  let recursive = false;
  if (args.options && args.options.recursive) {
    recursive = args.options.recursive;
  }

  const groupPath = toGroupPath(groupName);
  const fullPrefix = `/groups/${groupPath}/${prefix}`;

  let fetchedFiles: StoreFile[] = [];
  try {
    fetchedFiles = await listQuery(context, fullPrefix, 0, recursive);
  } catch (err) {
    logger.error({
      component: logger.components.store,
      type: 'STORE_LIST_OBJECTS',
      stacktrace: err.stack,
      message: err.message
    });
    throw new ApolloError('failed to list store objects', INTERNAL_ERROR);
  }
  const removeObjNames = [];
  for (const element of fetchedFiles) {
    if (recursive) {
      removeObjNames.push(`${fullPrefix}${element.name}`);
    } else if (recursive === false && element.name === '') {
      // Element name is without prefix, therefore, if it's exactly match, it will be an empty string
      removeObjNames.push(`${fullPrefix}`);
    }
  }

  try {
    await minioClient.removeObjects(storeBucket, removeObjNames);
    return removeObjNames.length;
  } catch (err) {
    logger.error({
      component: logger.components.store,
      type: 'STORE_REMOVE_OBJECTS',
      stacktrace: err.stack,
      message: err.message
    });
    throw new ApolloError('failed to remove store objects', INTERNAL_ERROR);
  }
};
