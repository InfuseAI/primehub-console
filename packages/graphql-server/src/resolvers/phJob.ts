import { Context } from './interface';
import { toRelay, filter, paginate, extractPagination, stringifyPackageField } from './utils';
import { PhJobPhase, PhJobSpec, PhJobStatus } from '../crdClient/crdClientImpl';
import CustomResource, { Item } from '../crdClient/customResource';
import { JobLogCtrl } from '../controllers/jobLogCtrl';
import { orderBy, omit } from 'lodash';

export interface PhJob {
  id: string;
  displayName: string;
  cancel: boolean;
  command: string;
  group: string;
  image: string;
  instanceType: string;
  userId: string;
  userName: string;
  phase: PhJobPhase;
  reason?: string;
  startTime: string;
  finishTime?: string;
  logEndpoint: string;
}

// tslint:disable-next-line:max-line-length
export const transform = (item: Item<PhJobSpec, PhJobStatus>, namespace: string, graphqlHost: string, jobLogCtrl: JobLogCtrl): PhJob => {
  return {
    id: item.metadata.name,
    displayName: item.spec.displayName,
    cancel: item.spec.cancel,
    command: item.spec.command,
    group: item.spec.group,
    image: item.spec.image,
    instanceType: item.spec.instanceType,
    userId: item.spec.userId,
    userName: item.spec.userName,
    phase: item.status.phase,
    reason: item.status.reason,
    startTime: item.status.startTime,
    finishTime: item.status.finishTime,
    logEndpoint: `${graphqlHost}${jobLogCtrl.getPhJobEndpoint(namespace, item.metadata.name)}`
  };
};

/**
 * Query
 */

// tslint:disable-next-line:max-line-length
const listQuery = async (client: CustomResource<PhJobSpec>, where: any, namespace: string, graphqlHost: string, jobLogCtrl: JobLogCtrl, currentUserId: string): Promise<PhJob[]> => {
  if (where.id) {
    const phJob = await client.get(where.id);
    return [transform(phJob, namespace, graphqlHost, jobLogCtrl)];
  }

  const phJobs = await client.list();
  let transformedPhJobs = phJobs.map(job => transform(job, namespace, graphqlHost, jobLogCtrl));

  if (where.mine) {
    where.userId = currentUserId;
  }

  // sort by startTime
  transformedPhJobs = orderBy(transformedPhJobs, 'startTime', 'desc');
  return filter(transformedPhJobs, omit(where, 'mine'));
};

export const query = async (root, args, context: Context) => {
  const {crdClient} = context;
  // tslint:disable-next-line:max-line-length
  const phJobs = await listQuery(crdClient.phJobs, args && args.where, context.namespace, context.graphqlHost, context.jobLogCtrl, context.userId);
  return paginate(phJobs, extractPagination(args));
};

export const connectionQuery = async (root, args, context: Context) => {
  const {crdClient} = context;
  // tslint:disable-next-line:max-line-length
  const phJobs = await listQuery(crdClient.phJobs, args && args.where, context.namespace, context.graphqlHost, context.jobLogCtrl, context.userId);
  return toRelay(phJobs, extractPagination(args));
};

export const queryOne = async (root, args, context: Context) => {
  const id = args.where.id;
  const {crdClient} = context;
  try {
    const phJob = await crdClient.phJobs.get(id);
    return transform(phJob, context.namespace, context.graphqlHost, context.jobLogCtrl);
  } catch (e) {
    return null;
  }
};
