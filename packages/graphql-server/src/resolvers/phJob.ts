import { Context } from './interface';
import { toRelay, filter, paginate, extractPagination, getFromAttr, parseMemory, getGroupIdsByUser } from './utils';
import { PhJobPhase, PhJobSpec, PhJobStatus } from '../crdClient/crdClientImpl';
import CustomResource, { Item } from '../crdClient/customResource';
import { JobLogCtrl } from '../controllers/jobLogCtrl';
import { orderBy, omit, get, isUndefined, isNil, isEmpty } from 'lodash';
import * as moment from 'moment';
import { escapeToPrimehubLabel } from '../utils/escapism';
import { ApolloError } from 'apollo-server';
import KeycloakAdminClient from 'keycloak-admin';
import { mapping } from './instanceType';
import * as logger from '../logger';
import { keycloakMaxCount } from './constant';
import { isUserAdmin } from './user';
import { SCHEDULE_LABEL } from './phSchedule';

const EXCEED_QUOTA_ERROR = 'EXCEED_QUOTA';
const NOT_AUTH_ERROR = 'NOT_AUTH';

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
  schedule: string;
  phase: PhJobPhase;
  reason?: string;
  message?: string;
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
export const transform = async (item: Item<PhJobSpec, PhJobStatus>, namespace: string, graphqlHost: string, jobLogCtrl: JobLogCtrl, kcAdminClient: KeycloakAdminClient): Promise<PhJob> => {
  const phase = item.spec.cancel ? PhJobPhase.Cancelled : get(item, 'status.phase', PhJobPhase.Pending);
  const group = item.spec.groupId ? await kcAdminClient.groups.findOne({id: item.spec.groupId}) : null;
  const groupName = get(group, 'attributes.displayName.0') || get(group, 'name');
  return {
    id: item.metadata.name,
    displayName: item.spec.displayName,
    cancel: item.spec.cancel,
    command: item.spec.command,
    groupId: item.spec.groupId,
    groupName,
    image: item.spec.image,
    instanceType: item.spec.instanceType,
    userId: item.spec.userId,
    userName: item.spec.userName,
    schedule: item.metadata.labels && item.metadata.labels[SCHEDULE_LABEL],
    phase,
    reason: get(item, 'status.reason'),
    message: get(item, 'status.message'),
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

export const createJob = async (context: Context, data: PhJobCreateInput, labels?: any) => {
  const {crdClient, kcAdminClient, userId, username} = context;
  const group = await kcAdminClient.groups.findOne({id: data.groupId});
  const name = createJobName();
  const metadata = {
    name,
    labels: {
      'primehub.io/group': escapeToPrimehubLabel(group.name),
      'primehub.io/user': escapeToPrimehubLabel(username),
      ...labels
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

const validateQuota = async (context: Context, data: PhJobCreateInput) => {
  const {groupId, instanceType: instanceTypeId} = data;
  const group = await context.kcAdminClient.groups.findOne({id: groupId});
  const quotaCpu: number = getFromAttr('quota-cpu', group.attributes, null, parseFloat);
  const quotaGpu: number = getFromAttr('quota-gpu', group.attributes, null, parseInt);
  const quotaMemory: number = getFromAttr('quota-memory', group.attributes, null, parseMemory);
  const projectQuotaCpu: number = getFromAttr('project-quota-memory', group.attributes, null, parseFloat);
  const projectQuotaGpu: number = getFromAttr('project-quota-gpu', group.attributes, null, parseInt);
  const projectQuotaMemory: number = getFromAttr('project-quota-memory', group.attributes, null, parseMemory);

  // validate
  const instanceType = await context.getInstanceType(instanceTypeId);
  const instanceTypeCpuLimit = instanceType.spec['limits.cpu'];
  const instanceTypeGpuLimit = instanceType.spec['limits.nvidia.com/gpu'];
  const instanceTypeMemoryLimit =
    instanceType.spec['limits.memory'] ? parseMemory(instanceType.spec['limits.memory']) : null;

  // check if gpu quota exceed
  if (!isNil(instanceTypeGpuLimit)) {
    if (!isNil(quotaGpu) && instanceTypeGpuLimit > quotaGpu) {
      throw new ApolloError('User Gpu Quota exceeded', EXCEED_QUOTA_ERROR);
    }

    if (!isNil(projectQuotaGpu) && instanceTypeGpuLimit > projectQuotaGpu) {
      throw new ApolloError('Group Gpu Quota exceeded', EXCEED_QUOTA_ERROR);
    }
  }

  // check if cpu quota exceed
  if (!isNil(instanceTypeCpuLimit)) {
    if (!isNil(quotaCpu) && instanceTypeCpuLimit > quotaCpu) {
      throw new ApolloError('User Cpu Quota exceeded', EXCEED_QUOTA_ERROR);
    }

    if (!isNil(projectQuotaCpu) && instanceTypeCpuLimit > projectQuotaCpu) {
      throw new ApolloError('Group Cpu Quota exceeded', EXCEED_QUOTA_ERROR);
    }
  }

  // check if memory quota exceed
  if (!isNil(instanceTypeMemoryLimit)) {
    if (!isNil(quotaMemory) && instanceTypeMemoryLimit > quotaMemory) {
      throw new ApolloError('User Memory exceeded', EXCEED_QUOTA_ERROR);
    }

    if (!isNil(projectQuotaMemory) && instanceTypeMemoryLimit > projectQuotaMemory) {
      throw new ApolloError('Group Memory exceeded', EXCEED_QUOTA_ERROR);
    }
  }
};

/**
 * Query
 */

export const typeResolvers = {
  async instanceType(parent, args, context: Context) {
    const instanceTypeId = parent.instanceType;
    try {
      const instanceType = await context.getInstanceType(instanceTypeId);
      return mapping(instanceType);
    } catch (error) {
      logger.info({
        component: logger.components.phJob,
        type: 'RESOURCE_NOT_FOUND',
        id: parent.id,
        instanceTypeId
      });
      return {
        id: `${instanceTypeId}-not-found`,
        name: instanceTypeId,
        tolerations: []
      };
    }
  }
};

const canUserViewJob = async (userId: string, phJob: PhJob, context: Context): Promise<boolean> => {
  const isAdmin = await isUserAdmin(context.realm, userId, context.kcAdminClient);
  if (isAdmin) { return true; }

  const members = await context.kcAdminClient.groups.listMembers({
    id: phJob.groupId,
    max: keycloakMaxCount
  });
  const memberIds = members.map(user => user.id);
  if (memberIds.indexOf(userId) >= 0) { return true; }
  return false;
};

const canUserCreate = async (userId: string, groupId: string, context: Context) => {
  const members = await context.kcAdminClient.groups.listMembers({
    id: groupId,
    max: keycloakMaxCount
  });
  const memberIds = members.map(user => user.id);
  return (memberIds.indexOf(userId) >= 0);
};

// tslint:disable-next-line:max-line-length
const listQuery = async (client: CustomResource<PhJobSpec>, where: any = {}, context: Context): Promise<PhJob[]> => {
  const {namespace, graphqlHost, jobLogCtrl, userId: currentUserId, kcAdminClient} = context;
  if (where && where.id) {
    const phJob = await client.get(where.id);
    const transformed = await transform(phJob, namespace, graphqlHost, jobLogCtrl, kcAdminClient);
    const viewable = await canUserViewJob(currentUserId, transformed, context);
    if (!viewable) {
      throw new ApolloError('user not auth', NOT_AUTH_ERROR);
    }
    return [transformed];
  }

  const phJobs = await context.phJobCacheList.list();
  let transformedPhJobs = await Promise.all(
    phJobs.map(job => transform(job, namespace, graphqlHost, jobLogCtrl, kcAdminClient)));

  if (where && where.mine) {
    where.userId_eq = currentUserId;
  }

  if (isEmpty(where.groupId_in)) {
    where.groupId_in = await getGroupIdsByUser(context, currentUserId);
  }

  // sort by createTime
  transformedPhJobs = orderBy(transformedPhJobs, 'createTime', 'desc');
  return filter(transformedPhJobs, omit(where, 'mine'));
};

export const query = async (root, args, context: Context) => {
  const {crdClient} = context;
  // tslint:disable-next-line:max-line-length
  const phJobs = await listQuery(crdClient.phJobs, args && args.where, context);
  return paginate(phJobs, extractPagination(args));
};

export const connectionQuery = async (root, args, context: Context) => {
  const {crdClient} = context;
  // tslint:disable-next-line:max-line-length
  const phJobs = await listQuery(crdClient.phJobs, args && args.where, context);
  return toRelay(phJobs, extractPagination(args));
};

export const queryOne = async (root, args, context: Context) => {
  const id = args.where.id;
  const {crdClient, userId: currentUserId} = context;
  const phJob = await crdClient.phJobs.get(id);
  const transformed =
    await transform(phJob, context.namespace, context.graphqlHost, context.jobLogCtrl, context.kcAdminClient);
  const viewable = await canUserViewJob(currentUserId, transformed, context);
  if (!viewable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }
  return transformed;
};

export const create = async (root, args, context: Context) => {
  const data: PhJobCreateInput = args.data;
  await validateQuota(context, data);
  await canUserCreate(context.userId, data.groupId, context);
  const phJob = await createJob(context, data);

  logger.info({
    component: logger.components.phJob,
    type: 'CREATE',
    userId: context.userId,
    username: context.username,
    id: phJob.metadata.name
  });

  return transform(phJob, context.namespace, context.graphqlHost, context.jobLogCtrl, context.kcAdminClient);
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

  logger.info({
    component: logger.components.phJob,
    type: 'RERUN',
    userId: context.userId,
    username: context.username,
    id: rerunPhJob.metadata.name
  });

  return transform(rerunPhJob, context.namespace, context.graphqlHost, context.jobLogCtrl, context.kcAdminClient);
};

export const cancel = async (root, args, context: Context) => {
  const {id} = args.where;
  await context.crdClient.phJobs.patch(id, {
    spec: {cancel: true} as any
  });

  logger.info({
    component: logger.components.phJob,
    type: 'CANCEL',
    userId: context.userId,
    username: context.username,
    id
  });

  return {id};
};
