import { Context } from './interface';
import { toRelay, filter, paginate, extractPagination, parsePackageField, stringifyPackageField } from './utils';
import * as logger from '../logger';
import { get, isEmpty, isUndefined, isNil, isNull, sortBy, orderBy } from 'lodash';
import CustomResource, { Item } from '../crdClient/customResource';
import { ImageSpecSpec, ImageSpecStatus } from '../crdClient/crdClientImpl';
import moment = require('moment');
import { transform as transformJob } from './buildImageJob';
import { IMAGE_SPEC_JOB_NAME_LABEL } from './constant';

export interface BuildImage {
  id: string;
  name: string;
  status: string;
  baseImage: string;
  image: string;
  useImagePullSecret: string;
  packages: {
    apt: string;
    pip: string;
    conda: string;
  };
  updateTime: string;
}

const updatePackageField = (pkgs: string): string[] => {
  if (isUndefined(pkgs)) {
    return undefined;
  }

  if (isNull(pkgs) || isEmpty(pkgs)) {
    return null;
  }

  return parsePackageField(pkgs);
};

const transform = (item: Item<ImageSpecSpec, ImageSpecStatus>): BuildImage => {
  return {
    id: item.metadata.name,
    name: item.metadata.name,
    status: get(item, 'status.phase'),
    baseImage: item.spec.baseImage,
    image: get(item, 'status.image'),
    useImagePullSecret: item.spec.pullSecret,
    packages: {
      apt: stringifyPackageField(get(item, 'spec.packages.apt')),
      pip: stringifyPackageField(get(item, 'spec.packages.pip')),
      conda: stringifyPackageField(get(item, 'spec.packages.conda'))
    },
    updateTime: item.spec.updateTime
  };
};

/**
 * Query
 */

// tslint:disable-next-line:max-line-length
const listQuery = async (imageSpecClient: CustomResource<ImageSpecSpec, ImageSpecStatus>, where: any, order: any): Promise<BuildImage[]> => {
  if (where && where.id) {
    const imageSpec = await imageSpecClient.get(where.id);
    return [transform(imageSpec)];
  }

  const imageSpecs = await imageSpecClient.list();
  const transformedImageSpecs = imageSpecs.map(transform);

  // sort by updateTime in desc
  order = isEmpty(order) ? {updateTime: 'desc'} : order;
  return filter(transformedImageSpecs, where, order);
};

export const query = async (root, args, context: Context) => {
  const {crdClient} = context;
  const imageSpecs = await listQuery(crdClient.imageSpecs, args && args.where, args && args.orderBy);
  return paginate(imageSpecs, extractPagination(args));
};

export const connectionQuery = async (root, args, context: Context) => {
  const {crdClient} = context;
  const imageSpecs = await listQuery(crdClient.imageSpecs, args && args.where, args && args.orderBy);
  return toRelay(imageSpecs, extractPagination(args));
};

export const queryOne = async (root, args, context: Context) => {
  const id = args.where.id;
  const {crdClient} = context;
  try {
    const imageSpec = await crdClient.imageSpecs.get(id);
    return transform(imageSpec);
  } catch (e) {
    return null;
  }
};

/**
 * Mutation
 */

export const create = async (root, args, context: Context) => {
  const data = args.data;
  const {crdClient} = context;
  const imageSpecClient = crdClient.imageSpecs;

  const spec = {
    baseImage: data.baseImage,
    pullSecret: isEmpty(data.useImagePullSecret) ? undefined : data.useImagePullSecret,
    packages: {
      apt: isNil(get(data, 'packages.apt')) ? undefined : parsePackageField(get(data, 'packages.apt')),
      pip: isNil(get(data, 'packages.pip')) ? undefined : parsePackageField(get(data, 'packages.pip')),
      conda: isNil(get(data, 'packages.conda')) ? undefined : parsePackageField(get(data, 'packages.conda'))
    },
    // iso8601
    updateTime: moment.utc().toISOString()
  };

  const created = await imageSpecClient.create({
    name: data.name
  }, spec);

  logger.info({
    component: logger.components.buildImage,
    type: 'CREATE',
    userId: context.userId,
    username: context.username,
    id: created.metadata.name
  });

  return transform(created);
};

export const update = async (root, args, context: Context) => {
  const id = args.where.id;
  const data = args.data;
  const {crdClient} = context;
  const imageSpecClient = crdClient.imageSpecs;

  logger.info({
    component: logger.components.buildImage,
    type: 'UPDATE',
    userId: context.userId,
    username: context.username,
    id
  });

  // if it's null, assign null to remove this field
  const useImagePullSecret = isNull(data.useImagePullSecret) ? null
  // if it's empty string, other than a specified string, we don't change this value
    : isEmpty(data.useImagePullSecret) ? undefined : data.useImagePullSecret;

  const spec = {
    baseImage: data.baseImage,
    pullSecret: useImagePullSecret,
    packages: {
      apt: updatePackageField(get(data, 'packages.apt')),
      pip: updatePackageField(get(data, 'packages.pip')),
      conda: updatePackageField(get(data, 'packages.conda'))
    },
    updateTime: moment.utc().toISOString()
  };

  const updated = await imageSpecClient.patch(id, {
    spec
  });
  return transform(updated);
};

export const destroy = async (root, args, context: Context) => {
  const id = args.where.id;
  const {crdClient} = context;
  const imageSpecClient = crdClient.imageSpecs;

  await imageSpecClient.del(id);

  logger.info({
    component: logger.components.buildImage,
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
  buildImageJobs: async (parent, args, context: Context) => {
    const buildImageName = parent.id;
    const jobs =
      await context.crdClient.imageSpecJobs.list(
        null, {labelSelector: `${IMAGE_SPEC_JOB_NAME_LABEL}=${buildImageName}`});
    // tslint:disable-next-line:max-line-length
    const transformedJobs = (jobs || []).map(job => transformJob(job, context.namespace, context.graphqlHost, context.jobLogCtrl));
    return orderBy(transformedJobs, 'updateTime', 'desc');
  }
};
