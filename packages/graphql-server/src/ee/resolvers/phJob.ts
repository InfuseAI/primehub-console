import { Context } from '../../resolvers/interface';
import { toRelay, filter, paginate, extractPagination, getFromAttr, parseMemory, getGroupIdsByUser } from '../../resolvers/utils';
import { validateLicense } from './utils';
import { PhJobPhase, PhJobSpec, PhJobStatus } from '../../crdClient/crdClientImpl';
import CustomResource, { Item } from '../../crdClient/customResource';
import { JobLogCtrl } from '../controllers/jobLogCtrl';
import { orderBy, omit, get, isUndefined, isNil, isEmpty, intersection } from 'lodash';
import moment from 'moment';
import { escapeToPrimehubLabel } from '../../utils/escapism';
import { ApolloError } from 'apollo-server';
import KeycloakAdminClient from 'keycloak-admin';
import { mapping } from '../../resolvers/instanceType';
import * as logger from '../../logger';
import { keycloakMaxCount } from '../../resolvers/constant';
import { isUserAdmin } from '../../resolvers/user';
import { SCHEDULE_LABEL } from './phSchedule';
import { BucketItem } from 'minio';
import JobArtifactCleaner from '../utils/jobArtifactCleaner';
import { ErrorCodes } from '../../errorCodes';

const {EXCEED_QUOTA_ERROR, NOT_AUTH_ERROR} = ErrorCodes;

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
  activeDeadlineSeconds?: number;
}

export interface PhJobCreateInput {
  displayName: string;
  groupId: string;
  instanceType: string;
  image: string;
  command: string;
  activeDeadlineSeconds?: number;
}

// tslint:disable-next-line:max-line-length
export const transform = async (item: Item<PhJobSpec, PhJobStatus>, namespace: string, graphqlHost: string, jobLogCtrl: JobLogCtrl, kcAdminClient: KeycloakAdminClient): Promise<PhJob> => {
  const phase = item.spec.cancel ? PhJobPhase.Cancelled : get(item, 'status.phase', PhJobPhase.Pending);
  return {
    id: item.metadata.name,
    displayName: item.spec.displayName,
    cancel: item.spec.cancel,
    command: item.spec.command,
    groupId: item.spec.groupId,
    groupName: item.spec.groupName || '',
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
    logEndpoint: `${graphqlHost}${jobLogCtrl.getPhJobEndpoint(namespace, item.metadata.name)}`,
    activeDeadlineSeconds: get(item, 'spec.activeDeadlineSeconds', null)
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
    activeDeadlineSeconds: data.activeDeadlineSeconds,
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
  },
  async artifact(parent, args, context: Context) {
    const {minioClient, storeBucket} = context;
    const phjobID = parent.id;
    const groupName = `${parent.groupName}`.toLowerCase();
    const prefix = `groups/${groupName}/jobArtifacts/${phjobID}`;

    return new Promise<any>((resolve, reject) => {
      if (!minioClient) {
        // Throw empty object if primehub store is not enabled
        resolve({
          prefix,
          items: []
        });
        return;
      }

      const list: any[] = [];
      const stream = minioClient.listObjects(storeBucket, prefix, true);
      stream.on('data', (obj: BucketItem) => {
        const name = obj.name.substring(prefix.length + 1);
        if (name.startsWith('.metadata/')) {
          return;
        }
        list.push({
          name,
          size: obj.size,
          lastModified: obj.lastModified.toISOString(),
        });
      });
      stream.on('error', (error: Error) => {
        reject(error);
      });
      stream.on('end', () => {
        resolve({
          prefix,
          items: list
        });
      });
    });
  },
  async monitoring(parent, args, context: Context) {
    const { minioClient, storeBucket } = context;
    const phjobID = parent.id;
    const groupName = `${parent.groupName}`.toLowerCase();
    const objectName = `groups/${groupName}/jobArtifacts/${phjobID}/.metadata/monitoring`;

    return new Promise<any>((resolve, reject) => {
      if (!minioClient) {
        reject(new Error('primehub-store is not enabled.'));
        return;
      }

      minioClient.getObject(storeBucket, objectName, (err: any, dataStream) => {
        if (err) {
          if (err.code === 'NoSuchKey') {
            resolve(null);
            return;
          }
          reject(err);
          return;
        }

        let body = '';
        dataStream.on('data', buffer => {
          body += buffer.toString();
        });
        dataStream.on('error', error => {
          reject(error);
        });
        dataStream.on('end', () => {
          try {
            const result = JSON.parse(body);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    });
  }
};

const canUserViewJob = async (userId: string, phJob: PhJob, context: Context): Promise<boolean> => {
  const members = await context.kcAdminClient.groups.listMembers({
    id: phJob.groupId,
    max: keycloakMaxCount
  });
  const memberIds = members.map(user => user.id);
  if (memberIds.indexOf(userId) >= 0) { return true; }
  return false;
};

const canUserMutate = async (userId: string, groupId: string, context: Context) => {
  const members = await context.kcAdminClient.groups.listMembers({
    id: groupId,
    max: keycloakMaxCount
  });
  const memberIds = members.map(user => user.id);
  return (memberIds.indexOf(userId) >= 0);
};

// tslint:disable-next-line:max-line-length
const listQuery = async (client: CustomResource<PhJobSpec>, where: any = {}, order: any, context: Context): Promise<PhJob[]> => {
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
  const transformedPhJobs = await Promise.all(
    phJobs.map(job => transform(job, namespace, graphqlHost, jobLogCtrl, kcAdminClient)));

  if (where && where.mine) {
    where.userId_eq = currentUserId;
  }

  const userGroups = await getGroupIdsByUser(context, currentUserId);
  where.groupId_in = isEmpty(where.groupId_in) ? userGroups : intersection(where.groupId_in, userGroups);

  // sort by createTime
  order = isEmpty(order) ? {createTime: 'desc'} : order;
  return filter(transformedPhJobs, omit(where, 'mine'), order);
};

export const query = async (root, args, context: Context) => {
  const {crdClient} = context;
  // tslint:disable-next-line:max-line-length
  const phJobs = await listQuery(crdClient.phJobs, args && args.where, args && args.orderBy, context);
  return paginate(phJobs, extractPagination(args));
};

export const connectionQuery = async (root, args, context: Context) => {
  const {crdClient} = context;
  // tslint:disable-next-line:max-line-length
  const phJobs = await listQuery(crdClient.phJobs, args && args.where, args && args.orderBy, context);
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
  validateLicense();
  await validateQuota(context, data);
  const mutable = await canUserMutate(context.userId, data.groupId, context);
  if (!mutable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }
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
  const mutable = await canUserMutate(context.userId, phJob.spec.groupId, context);
  if (!mutable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }

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
  const phJob = await context.crdClient.phJobs.get(id);
  const mutable = await canUserMutate(context.userId, phJob.spec.groupId, context);
  if (!mutable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }
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

export const artifactCleanUp = async (root, args, context: Context) => {
  const {minioClient, storeBucket} = context;

  const cleaner = new JobArtifactCleaner(minioClient, storeBucket);
  await cleaner.cleanUp();
  return 0;
};

export const notifyJobEvent = async (root, args, context: Context) => {
  const {id, type} = args.data;
  const phJob = await context.crdClient.phJobs.get(id);
  const {telemetry} = context;
  let duration = 0;
  if (phJob.status.startTime) {
    const finishTime = phJob.status.finishTime ? phJob.status.finishTime : new Date().toISOString();
    duration = moment.duration(moment(finishTime).diff(moment(phJob.status.startTime))).asSeconds();
  }

  if ([PhJobPhase.Succeeded, PhJobPhase.Failed, PhJobPhase.Cancelled, PhJobPhase.Unknown].includes(type)) {
    telemetry.track('Job Completed', {
      jobStatus: type,
      jobDuration: duration,
    });
  }
  return 0;
};
