import { ApolloError } from 'apollo-server';

import { Context } from './interface';
import * as logger from '../logger';
import { toRelay, extractPagination } from './utils';
import { isGroupBelongUser } from '../utils/groupCheck';
import { generatePrefixForQuery } from './store';

import { ErrorCodes } from '../errorCodes';
import { Readable } from 'stream';
import moment from 'moment';

const {
  NOT_AUTH_ERROR,
  INTERNAL_ERROR,
  RESOURCE_NOT_FOUND,
  RESOURCE_CONFLICT,
} = ErrorCodes;

const DATASET_FOLDER = 'datasets';
const DATASET_METADATA = '.dataset';

interface DatasetV2Metadata {
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  size: number;
}

const checkPermission = async (context: Context, groupName: string) => {
  const { userId } = context;
  const viewable = await isGroupBelongUser(context, userId, groupName);
  if (!viewable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }
};

const getDatasetPrefix = (groupName: string) => {
  const modifiedPrefixes = generatePrefixForQuery(
    groupName,
    DATASET_FOLDER,
    false
  );
  return modifiedPrefixes.fullPrefix;
};

const getMetadata = async (id: string, groupName: string, context: Context) => {
  const { minioClient, storeBucket } = context;

  const objectName = `${getDatasetPrefix(groupName)}${id}/${DATASET_METADATA}`;
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
            component: logger.components.datasetV2,
            resource: objectName,
            type: 'DATASET_GET_OBJECT',
            stacktrace: error.stack,
            message: error.message,
          });
          reject(error);
        }
      });
    });
  });

  return object;
};

const listDatasets = async (objectPrefix: string, context: Context) => {
  const { minioClient, storeBucket } = context;

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
  const { id, groupName } = args.where;
  await checkPermission(context, groupName);

  const metadata = await getMetadata(id, groupName, context);
  return { id, ...metadata };
};

export const connectionQuery = async (root, args, context: Context) => {
  const { groupName, prefix, search } = args.where;
  await checkPermission(context, groupName);

  const objectPrefix = getDatasetPrefix(groupName);
  let list = await listDatasets(objectPrefix, context);
  if (search) {
    list = list.filter(obj => obj.id.includes(search));
  }
  const datasets = await Promise.all(
    list.map(async obj => {
      const metadata = await getMetadata(obj.id, groupName, context);
      return {
        id: obj.id,
        ...metadata,
      };
    })
  );

  return toRelay(datasets, extractPagination(args));
};

const isObjectExisting = async (minioClient, storeBucket, path) => {
  try {
    await minioClient.statObject(storeBucket, path);
    return true;
  } catch (err) {
    if (err.code === 'NotFound') {
      return false;
    } else {
      logger.error({
        component: logger.components.datasetV2,
        type: 'DATASET_STAT',
        resource: path,
        stacktrace: err.stack,
        message: err.message,
      });
      throw new ApolloError('failed to check file existing', INTERNAL_ERROR);
    }
  }
};

export const create = async (root, args, context: Context) => {
  const { minioClient, storeBucket } = context;
  const { id, groupName, tags } = args.data;
  const name = args.data.name || id;
  await checkPermission(context, groupName);

  const dataPath = toDataPath(groupName, id);
  const metadata = {
    name,
    tags,
    createdBy: context.username,
    createdAt: moment().utc().toISOString(),
    updatedAt: moment().utc().toISOString(),
    size: 0,
  };

  if (await isObjectExisting(minioClient, storeBucket, dataPath)) {
    throw new ApolloError(
      `failed to create dataset, ${name} has already created`,
      RESOURCE_CONFLICT
    );
  }

  await putMetaData(context, dataPath, metadata);
  return { id, ...metadata };
};

export const update = async (root, args, context: Context) => {
  const { id, groupName } = args.where;
  await checkPermission(context, groupName);

  const existingMetadata = await getMetadata(id, groupName, context);
  const metadata = {
    ...existingMetadata,
    ...args.data,
    updatedAt: moment().utc().toISOString(),
  };

  if (metadata.name === null) {
    metadata.name = id;
  }

  if (!metadata.tags) {
    metadata.tags = [];
  }

  await putMetaData(context, toDataPath(groupName, id), metadata);
  return { id, ...metadata };
};

function toDataPath(groupName: any, id: any) {
  return `${getDatasetPrefix(groupName)}${id}/${DATASET_METADATA}`;
}

async function putMetaData(
  context: Context,
  dataPath: string,
  metadata: DatasetV2Metadata
) {
  const { minioClient, storeBucket } = context;
  const content = (Readable as any).from([JSON.stringify(metadata)]);
  try {
    await minioClient.putObject(storeBucket, dataPath, content);
  } catch (err) {
    if (err.code === 'NotFound') {
      throw new ApolloError('failed to create dataset', RESOURCE_NOT_FOUND);
    } else {
      logger.error({
        component: logger.components.datasetV2,
        resource: dataPath,
        content,
        type: 'DATASET_PUT_OBJECT',
        stacktrace: err.stack,
        message: err.message,
      });
      throw new ApolloError('failed to create dataset', INTERNAL_ERROR);
    }
  }
}
