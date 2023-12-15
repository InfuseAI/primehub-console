import { ApolloError } from 'apollo-server';
import axios from "axios";

import { Context, Role } from './interface';
import * as logger from '../logger';
import { toGroupPath, isGroupBelongUser } from '../utils/groupCheck';

import { ErrorCodes } from '../errorCodes';
import { createHash } from 'crypto';
import { Readable, Stream } from 'stream';
import getStream from 'get-stream';
import { createConfig } from '../config';
const {NOT_AUTH_ERROR, INTERNAL_ERROR, RESOURCE_NOT_FOUND} = ErrorCodes;

interface StoreFile {
  name?: string;
  size?: number;
  lastModified?: string;
}

const checkPermission = async (context: Context, groupName: string) => {
  const {userId} = context;
  const viewable = await isGroupBelongUser(context, userId, groupName);
  if (!viewable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }
};

const listQuery = async (context: Context, prefix: string, limit: number, recursive: boolean): Promise<StoreFile[]> => {
  const {minioClient, storeBucket} = context;

  const listObjects = new Promise<StoreFile[]>((resolve, reject) => {
    const fetchedFiles: StoreFile[] = [];
    const stream = minioClient.listObjectsV2(storeBucket, prefix, recursive);
    stream.on('data', obj => {
      if (limit === 0 || fetchedFiles.length < limit) {
        const removedPrefixName = obj.name ? obj.name.replace(prefix, '') : obj.prefix.replace(prefix, '');
        fetchedFiles.push({
          name: removedPrefixName,
          size: obj.size,
          lastModified: obj.lastModified ? obj.lastModified.toISOString() : null,
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

export const generatePrefixForQuery = (groupName: string, phfsPrefix: string, recursive: boolean) => {
  if (!phfsPrefix.startsWith('/')) {
    phfsPrefix = '/'  + phfsPrefix;
  }
  if (recursive === false) {
    if (!phfsPrefix.endsWith('/')) {
      phfsPrefix = phfsPrefix + '/';
    }
  }

  const groupPath = toGroupPath(groupName);
  const fullPrefix = `groups/${groupPath}${phfsPrefix}`;

  return {
    fullPrefix,
    phfsPrefix
  };
};

const getShareInfo = (context: Context, groupName: any, opts: {phfsPath?: string, objectPath?: string}) => {
  const {graphqlHost} = context;
  const path: any = opts.phfsPath ?
    `groups/${toGroupPath(groupName)}/${opts.phfsPath}` :
    opts.objectPath;
  const shasum = createHash('sha1');
  shasum.update(path);
  const hash = shasum.digest('hex');
  const sharePath = `share/${hash}`;
  const shareLink = `${graphqlHost}/console/share/${hash}`;
  return { path, sharePath, shareLink, hash };
};

export const query = async (root, args, context: Context) => {
  const {userId} = context;
  const {groupName, phfsPrefix} = args.where;

  await checkPermission(context, groupName);

  let limit = 1000;
  if (args.options && args.options.limit) {
    limit = args.options.limit;
  }
  let recursive = false;
  if (args.options && args.options.recursive) {
    recursive = args.options.recursive;
  }

  const modifiedPrefixes = generatePrefixForQuery(groupName, phfsPrefix, recursive);

  let fetchedFiles: StoreFile[] = [];
  try {
    fetchedFiles = await listQuery(context, modifiedPrefixes.fullPrefix, limit, recursive);
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
    phfsPrefix: modifiedPrefixes.phfsPrefix,
    prefix: modifiedPrefixes.fullPrefix,
  };
};

export const destroy = async (root, args, context: Context) => {
  const {minioClient, storeBucket} = context;
  const {groupName, phfsPrefix} = args.where;

  if (context.role !== Role.ADMIN) {
    await checkPermission(context, groupName);
  }

  let recursive = false;
  if (args.options && args.options.recursive) {
    recursive = args.options.recursive;
  }

  const groupPath = toGroupPath(groupName);
  const fullPrefix = `groups/${groupPath}/${phfsPrefix}`;

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
  const removeSharedNames = [];
  for (const element of fetchedFiles) {
    if (recursive) {
      const objName = `${fullPrefix}${element.name}`;
      removeObjNames.push(objName);
      const {sharePath} = getShareInfo(context, groupName, {objectPath: objName});
      removeSharedNames.push(sharePath);
    } else if (recursive === false && element.name === '') {
      // Element name is without prefix, therefore, if it's exactly match, it will be an empty string
      removeObjNames.push(fullPrefix);
      const {sharePath} = getShareInfo(context, groupName, {objectPath: fullPrefix});
      removeSharedNames.push(sharePath);
    }
  }

  try {
    await minioClient.removeObjects(storeBucket, removeObjNames);
    await minioClient.removeObjects(storeBucket, removeSharedNames);
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

export const share = async (root, args, context: Context) => {
  const {minioClient, storeBucket} = context;
  const {groupName, phfsPath} = args.where;
  const { path, hash, sharePath, shareLink } = await getShareInfo(context, groupName, {phfsPath});

  await checkPermission(context, groupName);

  // check if file available
  try {
    await minioClient.statObject(storeBucket, path);
  } catch (err) {
    if (err.code === 'NotFound') {
      throw new ApolloError('failed to share store object', RESOURCE_NOT_FOUND);
    } else {
      logger.error({
        component: logger.components.store,
        type: 'STORE_SHARE_OBJECT',
        stacktrace: err.stack,
        message: err.message
      });
      throw new ApolloError('failed to share store object', INTERNAL_ERROR);
    }
  }

  try {
    const sharedFileMetadata = {
      path
    };

    const content = (Readable as any).from([JSON.stringify(sharedFileMetadata)]);
    await minioClient.putObject(storeBucket, sharePath, content);
  } catch (err) {
    if (err.code === 'NotFound') {
      throw new ApolloError('failed to share store object', RESOURCE_NOT_FOUND);
    } else {
      logger.error({
        component: logger.components.store,
        type: 'STORE_SHARE_OBJECT',
        stacktrace: err.stack,
        message: err.message
      });
      throw new ApolloError('failed to share file', INTERNAL_ERROR);
    }
  }

  return {
    shared: true,
    hash,
    shareLink,
  };
};

export const unshare = async (root, args, context: Context) => {
  const {minioClient, storeBucket} = context;
  const {groupName, phfsPath} = args.where;
  const { sharePath } = getShareInfo(context, groupName, {phfsPath});

  await checkPermission(context, groupName);

  try {
    await minioClient.removeObject(storeBucket, sharePath);
  } catch (err) {
    if (err.code === 'NotFound') {
      throw new ApolloError('failed to unshare file', RESOURCE_NOT_FOUND);
    } else {
      logger.error({
        component: logger.components.store,
        type: 'STORE_SHARE_OBJECT',
        stacktrace: err.stack,
        message: err.message
      });
      throw new ApolloError('failed to unshare', INTERNAL_ERROR);
    }
  }

  return {
    shared: false,
  };
};

export const querySharedFile = async (root, args, context: Context) => {
  const {minioClient, storeBucket} = context;
  const {groupName, phfsPath} = args.where;
  const { sharePath, shareLink, hash } = getShareInfo(context, groupName, {phfsPath});
  let sharedFileMetadata;
  let shared = false;

  try {
    const stream: Stream = await minioClient.getObject(storeBucket, sharePath);
    const result = await getStream(stream);
    sharedFileMetadata = JSON.parse(result);
    shared = true;
  } catch (e) {
    return {
      shared: false
    };
  }

  return {
    shared: true,
    hash,
    shareLink,
  };
};

export const destroyByGroup = async (
  context: Context,
  group: { id: string; name: string },
  dryrun: boolean
) => {

  const config = createConfig();
  if (!config.enableStore) {
    return 0;
  }

  // Always report count to 1, shared files are uncountable.
  if (dryrun) {
    return 1;
  }

  // inovke the destroy with empty prefix
  const args = {
    where: { groupName: group.name, phfsPrefix: '' },
    options: { recursive: true },
  };
  destroy(null, args, context);
  return 1;
};

export const zipFiles = async (_root, args, context: Context) => {
  const config = createConfig();
  const data = {
    user_id: context.userId,
    ...args.data,
  };
  axios.post(`${config.zippingEndpoint}/zipping`, data);
};

export const jobQueueStatus = async (_root, _args, context: Context) => {
  const config = createConfig();
  const result = await axios.get(
    `${config.zippingEndpoint}/job-queue/${context.userId}`
  );
  return result.data;
};

export const downloadableFiles = async (_root, _args, context: Context) => {
  const config = createConfig();
  const result = await axios.get(
    `${config.zippingEndpoint}/downloadable/${context.userId}`
  );
  return result.data;
};
