import { Context } from './interface';
import { toRelay, filter, paginate, extractPagination, stringifyPackageField } from './utils';
import { get } from 'lodash';
import CustomResource, { Item } from '../crdClient/customResource';
import { ImageSpecJobSpec } from '../crdClient/crdClientImpl';
import { IMAGE_SPEC_JOB_HASH_ANNOTATION, IMAGE_SPEC_JOB_NAME_LABEL } from './constant';

export interface BuildImageJob {
  id: string;
  name: string;
  status: string;
  baseImage: string;
  imageRevision: string;
  useImagePullSecret: string;
  packages: {
    apt: string;
    pip: string;
    conda: string;
  };
  logEndpoint: string;
  updateTime: string;
}

export const transform = (item: Item<ImageSpecJobSpec>): BuildImageJob => {
  return {
    id: item.metadata.name,
    name: item.metadata.name,
    status: item.status.phase,
    baseImage: item.spec.baseImage,
    // tslint:disable-next-line:max-line-length
    imageRevision: `${get(item, ['metadata', 'annotations', IMAGE_SPEC_JOB_NAME_LABEL])}:${get(item, ['metadata', 'labels', IMAGE_SPEC_JOB_HASH_ANNOTATION])}`,
    useImagePullSecret: item.spec.pullSecret,
    packages: {
      apt: stringifyPackageField(get(item, 'spec.packages.apt')),
      pip: stringifyPackageField(get(item, 'spec.packages.pip')),
      conda: stringifyPackageField(get(item, 'spec.packages.conda'))
    },
    logEndpoint: null,
    updateTime: item.spec.updateTime
  };
};

/**
 * Query
 */

// tslint:disable-next-line:max-line-length
const listQuery = async (client: CustomResource<ImageSpecJobSpec>, where: any): Promise<BuildImageJob[]> => {
  const imageSpecJobs = await client.list();
  const transformedimageSpecJobs = imageSpecJobs.map(transform);
  return filter(transformedimageSpecJobs, where);
};

export const query = async (root, args, context: Context) => {
  const {crdClient} = context;
  const imageSpecJobs = await listQuery(crdClient.imageSpecJobs, args && args.where);
  return paginate(imageSpecJobs, extractPagination(args));
};

export const connectionQuery = async (root, args, context: Context) => {
  const {crdClient} = context;
  const imageSpecJobs = await listQuery(crdClient.imageSpecJobs, args && args.where);
  return toRelay(imageSpecJobs, extractPagination(args));
};

export const queryOne = async (root, args, context: Context) => {
  const id = args.where.id;
  const {crdClient} = context;
  try {
    const imageSpec = await crdClient.imageSpecJobs.get(id);
    return transform(imageSpec);
  } catch (e) {
    return null;
  }
};
