import { ApolloError } from 'apollo-server';

import { Context } from './interface';
import * as logger from '../logger';
import { toGroupPath, isGroupBelongUser } from '../utils/groupCheck';

import { ErrorCodes } from '../errorCodes';
const {NOT_AUTH_ERROR} = ErrorCodes;

const canUserQueryFiles = async (context: Context, userId: string, groupName: string): Promise<boolean> => {
  return isGroupBelongUser(context, userId, groupName);
};

export const query = async (root, args, context: Context) => {
  const {minioClient, storeBucket, userId} = context;
  const {groupName, prefix} = args.where;

  const viewable = await canUserQueryFiles(context, userId, groupName);
  if (!viewable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }

  let limit = 1000;
  if (args.options && args.options.limit) {
    limit = args.options.limit;
  }

  const groupPath = toGroupPath(groupName);
  const fullPrefix = `/groups/${groupPath}/${prefix}`;

  const listQuery = new Promise((resolve, reject) => {
    const fetchedFiles = [];
    const stream = minioClient.listObjects(storeBucket, fullPrefix);
    stream.on('data', obj => {
      if (fetchedFiles.length < limit) {
        fetchedFiles.push({
          name: obj.name,
          prefix: obj.prefix,
          size: obj.size,
          lastModified: obj.lastModified,
        });
      }
    });
    stream.on('error', err => {
      logger.error({
        component: logger.components.store,
        type: 'STORE_LIST_OBJECTS',
        stacktrace: err.stack,
        message: err.message
      });
      resolve([]);
    });
    stream.on('end', () => {
      resolve(fetchedFiles);
    });
  });

  return listQuery;
};
