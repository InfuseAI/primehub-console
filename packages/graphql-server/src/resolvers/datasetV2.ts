import { ApolloError } from 'apollo-server';

import { Context } from './interface';
import * as logger from '../logger';
import { toRelay, extractPagination } from './utils';
import { isGroupBelongUser } from '../utils/groupCheck';
import { generatePrefixForQuery } from './store';

import { ErrorCodes } from '../errorCodes';
const {NOT_AUTH_ERROR, INTERNAL_ERROR, RESOURCE_NOT_FOUND} = ErrorCodes;

const DATASET_FOLDER = 'datasets';
const DATASET_METADATA = '.dataset';

interface DatasetV2Metadata {
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: any;
  size: number;
}

const checkPermission = async (context: Context, groupName: string) => {
  const {userId} = context;
  const viewable = await isGroupBelongUser(context, userId, groupName);
  if (!viewable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }
};

const getDatasetPrefix = (groupName: string, prefix: string) => {
  const modifiedPrefixes = generatePrefixForQuery(groupName, prefix, false);
  return `${modifiedPrefixes.fullPrefix}${DATASET_FOLDER}/`;
};

const getMetadata = async (id: string, groupName: string, prefix: string, context: Context) => {
  const {minioClient, storeBucket} = context;

  const objectName = `${getDatasetPrefix(groupName, prefix)}${id}/${DATASET_METADATA}`;
  try {
    await minioClient.statObject(storeBucket, objectName);
  } catch (err) {
    throw new ApolloError('failed to get dataset', RESOURCE_NOT_FOUND, err);
  }
  const object = new Promise<DatasetV2Metadata>((resolve, reject) => {
    const arr = [];
    minioClient.getObject(storeBucket, objectName, (err, stream) => {
      if (err) {
        return reject(err);
      }
      stream.on('data', chunk => {
        arr.push(chunk);
      });
      stream.on('error', error => {
        reject(error);
      });
      stream.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(arr).toString()));
        } catch (error) {
          logger.error({
            component: 'DatasetV2',
            resource: objectName,
            type: 'DATASET_GET_OBJECT',
            stacktrace: error.stack,
            message: error.message
          });
          reject(error);
        }
      });
    });
  });

  return object;
};

const listDatasets = async (objectPrefix: string, context: Context) => {
  const {minioClient, storeBucket} = context;

  const objects = new Promise<any[]>((resolve, reject) => {
    const arr = [];
    const stream = minioClient.listObjectsV2(storeBucket, objectPrefix);
    stream.on('data', obj => {
      const id = obj.prefix.replace(objectPrefix, '').slice(0, -1);
      arr.push({ id, ...obj });
    });
    stream.on('error', err => {
      reject(err);
    });
    stream.on('end', () => {
      resolve(arr);
    });
  });

  return objects;
};

export const query = async (root, args, context: Context) => {
  const {id, groupName, prefix} = args.where;
  await checkPermission(context, groupName);

  const metadata = await getMetadata(id, groupName, prefix, context);
  return { id, ...metadata };
};

export const connectionQuery = async (root, args, context: Context) => {
  const {groupName, prefix, search} = args.where;
  await checkPermission(context, groupName);

  const objectPrefix = getDatasetPrefix(groupName, prefix);
  let list = await listDatasets(objectPrefix, context);
  if (search) {
    list = list.filter(obj => obj.id.includes(search));
  }
  const datasets = await Promise.all(list.map(async obj => {
    const metadata = await getMetadata(obj.id, groupName, prefix, context);
    return {
      id: obj.id,
      ...metadata,
    };
  }));

  return toRelay(datasets, extractPagination(args));
};
