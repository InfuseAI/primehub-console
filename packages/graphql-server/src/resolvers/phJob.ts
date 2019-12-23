import { Context } from './interface';
import { toRelay, filter, paginate, extractPagination, stringifyPackageField } from './utils';
import { PhJobPhase, PhJobSpec, PhJobStatus } from '../crdClient/crdClientImpl';
import CustomResource, { Item } from '../crdClient/customResource';
import { JobLogCtrl } from '../controllers/jobLogCtrl';
import { orderBy, omit, get } from 'lodash';
import * as moment from 'moment';

const NEW_LINE = '\n';

export interface PhJob {
  id: string;
  displayName: string;
  cancel: boolean;
  command: string;
  groupId: string;
  groupName: string;
  image: string;
  instanceType: string;
  userId: string;
  userName: string;
  phase: PhJobPhase;
  reason?: string;
  createTime: string;
  startTime: string;
  finishTime?: string;
  logEndpoint: string;
}

export interface PhJobCreateInput {
  displayName: string;
  groupId: string;
  instanceType: string;
  image: string;
  command: string;
}

// tslint:disable-next-line:max-line-length
export const transform = (item: Item<PhJobSpec, PhJobStatus>, namespace: string, graphqlHost: string, jobLogCtrl: JobLogCtrl): PhJob => {
  const phase = item.spec.cancel ? PhJobPhase.Cancelled : get(item, 'status.phase', PhJobPhase.Pending);
  return {
    id: item.metadata.name,
    displayName: item.spec.displayName,
    cancel: item.spec.cancel,
    command: item.spec.command,
    groupId: item.spec.groupId,
    groupName: item.spec.groupName,
    image: item.spec.image,
    instanceType: item.spec.instanceType,
    userId: item.spec.userId,
    userName: item.spec.userName,
    phase,
    reason: get(item, 'status.reason'),
    createTime: item.metadata.creationTimestamp,
    startTime: get(item, 'status.startTime'),
    finishTime: get(item, 'status.finishTime'),
    logEndpoint: `${graphqlHost}${jobLogCtrl.getPhJobEndpoint(namespace, item.metadata.name)}`
  };
};

// utils
const createJobName = () => {
  // generate string like: 201912301200-gxzhaz
  return `job-${moment.utc().format('YYYYMMDDHHmm')}-${Math.random().toString(36).slice(2, 8)}`;
};

const createJob = async (context: Context, data: PhJobCreateInput) => {
  const {crdClient, kcAdminClient, userId, username} = context;
  const group = await kcAdminClient.groups.findOne({id: data.groupId});
  const name = createJobName();
  const metadata = {
    name,
    labels: {
      'primehub-group': group.name,
      'primehub-user': username
    }
  };
  const spec = {
    cancel: false,
    userId,
    userName: username,

    // merge from user input
    command: data.command,
    displayName: data.displayName,
    groupId: data.groupId,
    groupName: group.name,
    image: data.image,
    instanceType: data.instanceType,
  };
  return crdClient.phJobs.create(metadata, spec);
};

/**
 * Query
 */

// tslint:disable-next-line:max-line-length
const listQuery = async (client: CustomResource<PhJobSpec>, where: any, namespace: string, graphqlHost: string, jobLogCtrl: JobLogCtrl, currentUserId: string): Promise<PhJob[]> => {
  if (where && where.id) {
    const phJob = await client.get(where.id);
    return [transform(phJob, namespace, graphqlHost, jobLogCtrl)];
  }

  const phJobs = await client.list();
  let transformedPhJobs = phJobs.map(job => transform(job, namespace, graphqlHost, jobLogCtrl));

  if (where && where.mine) {
    where.userId_eq = currentUserId;
  }

  // sort by createTime
  transformedPhJobs = orderBy(transformedPhJobs, 'createTime', 'desc');
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

export const create = async (root, args, context: Context) => {
  const data: PhJobCreateInput = args.data;
  const phJob = await createJob(context, data);
  return transform(phJob, context.namespace, context.graphqlHost, context.jobLogCtrl);
};

export const rerun = async (root, args, context: Context) => {
  const {id} = args.where;
  const phJob = await context.crdClient.phJobs.get(id);

  if (!phJob) {
    return null;
  }

  // rerun found job
  const rerunPhJob = await createJob(context, {
    displayName: phJob.spec.displayName,
    groupId: phJob.spec.groupId,
    instanceType: phJob.spec.instanceType,
    image: phJob.spec.image,
    // todo: use builder pattern, instead of ser and deser like this
    command: phJob.spec.command
  });

  return transform(rerunPhJob, context.namespace, context.graphqlHost, context.jobLogCtrl);
};

export const cancel = async (root, args, context: Context) => {
  const {id} = args.where;
  await context.crdClient.phJobs.patch(id, {
    spec: {cancel: true} as any
  });
  return {id};
};
