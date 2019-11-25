import { Context } from './interface';
import { toRelay, filter, paginate, extractPagination, stringifyPackageField } from './utils';
import { get } from 'lodash';
import CustomResource, { Item } from '../crdClient/customResource';
import { ImageSpecJobSpec, ImageSpecJobStatus } from '../crdClient/crdClientImpl';
import { IMAGE_SPEC_JOB_HASH_ANNOTATION, IMAGE_SPEC_JOB_NAME_LABEL } from './constant';
import { JobLogCtrl } from '../controllers/jobLogCtrl';

export interface BuildImageJob {
  id: string;
  name: string;
  status: string;
  baseImage: string;
  imageRevision: string;
  targetImage: string;
  useImagePullSecret: string;
  packages: {
    apt: string;
    pip: string;
    conda: string;
  };
  logEndpoint: string;
  updateTime: string;
}

// tslint:disable-next-line:max-line-length
export const transform = (item: Item<ImageSpecJobSpec, ImageSpecJobStatus>, namespace: string, graphqlHost: string, jobLogCtrl: JobLogCtrl): BuildImageJob => {
  return {
    id: item.metadata.name,
    name: item.metadata.name,
    status: item.status.phase,
    baseImage: item.spec.baseImage,
    // tslint:disable-next-line:max-line-length
    imageRevision: `${get(item, ['metadata', 'labels', IMAGE_SPEC_JOB_NAME_LABEL])}:${get(item, ['metadata', 'annotations', IMAGE_SPEC_JOB_HASH_ANNOTATION])}`,
    targetImage: `${item.spec.repoPrefix}/${item.spec.targetImage}`,
    useImagePullSecret: item.spec.pullSecret,
    packages: {
      apt: stringifyPackageField(get(item, 'spec.packages.apt')),
      pip: stringifyPackageField(get(item, 'spec.packages.pip')),
      conda: stringifyPackageField(get(item, 'spec.packages.conda'))
    },
    logEndpoint: `${graphqlHost}${jobLogCtrl.getEndpoint(namespace, item.metadata.name)}`,
    updateTime: item.spec.updateTime
  };
};

/**
 * Query
 */

// tslint:disable-next-line:max-line-length
const listQuery = async (client: CustomResource<ImageSpecJobSpec>, where: any, namespace: string, graphqlHost: string, jobLogCtrl: JobLogCtrl): Promise<BuildImageJob[]> => {
  if (where.id) {
    const imageSpecJob = await client.get(where.id);
    return [transform(imageSpecJob, namespace, graphqlHost, jobLogCtrl)];
  }

  const imageSpecJobs = await client.list();
  const transformedimageSpecJobs = imageSpecJobs.map(job => transform(job, namespace, graphqlHost, jobLogCtrl));
  return filter(transformedimageSpecJobs, where);
};

export const query = async (root, args, context: Context) => {
  const {crdClient} = context;
  // tslint:disable-next-line:max-line-length
  const imageSpecJobs = await listQuery(crdClient.imageSpecJobs, args && args.where, context.namespace, context.graphqlHost, context.jobLogCtrl);
  return paginate(imageSpecJobs, extractPagination(args));
};

export const connectionQuery = async (root, args, context: Context) => {
  const {crdClient} = context;
  // tslint:disable-next-line:max-line-length
  const imageSpecJobs = await listQuery(crdClient.imageSpecJobs, args && args.where, context.namespace, context.graphqlHost, context.jobLogCtrl);
  return toRelay(imageSpecJobs, extractPagination(args));
};

export const queryOne = async (root, args, context: Context) => {
  const id = args.where.id;
  const {crdClient} = context;
  try {
    const imageSpec = await crdClient.imageSpecJobs.get(id);
    return transform(imageSpec, context.namespace, context.graphqlHost, context.jobLogCtrl);
  } catch (e) {
    return null;
  }
};
