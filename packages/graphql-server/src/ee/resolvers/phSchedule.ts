import { Context } from '../../resolvers/interface';
import { toRelay, filter, paginate, extractPagination, getFromAttr, parseMemory, getGroupIdsByUser } from '../../resolvers/utils';
import { validateLicense } from './utils';
import { PhScheduleSpec, PhScheduleStatus } from '../../crdClient/crdClientImpl';
import CustomResource, { Item } from '../../crdClient/customResource';
import { orderBy, omit, get, isUndefined, isNil, isEmpty, intersection } from 'lodash';
import * as moment from 'moment';
import { escapeToPrimehubLabel } from '../../utils/escapism';
import { ApolloError } from 'apollo-server';
import KeycloakAdminClient from 'keycloak-admin';
import { mapping } from '../../resolvers/instanceType';
import * as logger from '../../logger';
import { keycloakMaxCount } from '../../resolvers/constant';
import { isUserAdmin } from '../../resolvers/user';
import { createJob } from './phJob';

const EXCEED_QUOTA_ERROR = 'EXCEED_QUOTA';
const NOT_AUTH_ERROR = 'NOT_AUTH';

export const SCHEDULE_LABEL = 'phjob.primehub.io/scheduledBy';

export interface PhSchedule {
  id: string;
  displayName: string;
  recurrence: {
    type: string;
    cron?: string;
  };
  command: string;
  groupId: string;
  groupName: string;
  image: string;
  instanceType: string;
  userId: string;
  userName: string;
  createTime: string;
  updateTime: string;
  nextRunTime: string;
  invalid: boolean;
  message: string;
  activeDeadlineSeconds?: number;
}

export interface PhScheduleMutationInput {
  displayName: string;
  groupId: string;
  instanceType: string;
  image: string;
  command: string;
  recurrence: {
    type: string;
    cron?: string;
  };
  activeDeadlineSeconds?: number;
}

// tslint:disable-next-line:max-line-length
export const transform = async (
  item: Item<PhScheduleSpec, PhScheduleStatus>
): Promise<PhSchedule> => {
  const jobTemplate = item.spec.jobTemplate;
  return {
    id: item.metadata.name,

    // from jobTemplate
    displayName: jobTemplate.spec.displayName,
    command: jobTemplate.spec.command,
    groupId: jobTemplate.spec.groupId,
    groupName: jobTemplate.spec.groupName || '',
    image: jobTemplate.spec.image,
    instanceType: jobTemplate.spec.instanceType,
    userId: jobTemplate.spec.userId,
    userName: jobTemplate.spec.userName,
    activeDeadlineSeconds: jobTemplate.spec.activeDeadlineSeconds,

    // from spec & status
    recurrence: item.spec.recurrence,
    nextRunTime: get(item, 'status.nextRunTime'),
    invalid: get(item, 'status.invalid', false),
    message: get(item, 'status.message'),

    // times
    createTime: item.metadata.creationTimestamp,
    updateTime: item.spec.updateTime
  };
};

// utils
const createScheduleName = () => {
  // generate string like: 201912301200-gxzhaz
  return `schedule-${Math.random().toString(36).slice(2, 8)}`;
};

const createSchedule = async (context: Context, data: PhScheduleMutationInput) => {
  const {crdClient, kcAdminClient, userId, username} = context;
  const group = await kcAdminClient.groups.findOne({id: data.groupId});
  const name = createScheduleName();
  const metadata = {
    name,
    labels: {
      'primehub.io/group': escapeToPrimehubLabel(group.name),
      'primehub.io/user': escapeToPrimehubLabel(username)
    }
  };
  const spec = {
    updateTime: moment.utc().toISOString(),
    recurrence: data.recurrence,

    jobTemplate: {
      metadata: {
        labels: {
          [SCHEDULE_LABEL]: name
        }
      },
      spec: {
        userId,
        userName: username,
        command: data.command,
        displayName: data.displayName,
        groupId: data.groupId,
        groupName: group.name,
        image: data.image,
        instanceType: data.instanceType,
        activeDeadlineSeconds: data.activeDeadlineSeconds,
      }
    }
  };
  return crdClient.phSchedules.create(metadata, spec);
};

const validateQuota = async (context: Context, groupId: string, instanceTypeId: string) => {
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
        id: instanceTypeId,
        name: instanceTypeId,
        tolerations: []
      };
    }
  }
};

const canUserViewSchedule = async (userId: string, phSchedule: PhSchedule, context: Context): Promise<boolean> => {
  const members = await context.kcAdminClient.groups.listMembers({
    id: phSchedule.groupId,
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
const listQuery = async (client: CustomResource<PhScheduleSpec>, where: any = {}, order: any, context: Context): Promise<PhSchedule[]> => {
  const {namespace, graphqlHost, userId: currentUserId, kcAdminClient} = context;
  if (where && where.id) {
    const phSchedule = await client.get(where.id);
    const transformed = await transform(phSchedule);
    const viewable = await canUserViewSchedule(currentUserId, transformed, context);
    if (!viewable) {
      throw new ApolloError('user not auth', NOT_AUTH_ERROR);
    }
    return [transformed];
  }

  const phSchedules = await client.list();
  const transformedPhSchedules = await Promise.all(
    phSchedules.map(schedule => transform(schedule)));

  if (where && where.mine) {
    where.userId_eq = currentUserId;
  }

  const userGroups = await getGroupIdsByUser(context, currentUserId);
  where.groupId_in = isEmpty(where.groupId_in) ? userGroups : intersection(where.groupId_in, userGroups);

  // sort by updateTime
  order = isEmpty(order) ? {updateTime: 'desc'} : order;
  return filter(transformedPhSchedules, {where: omit(where, 'mine'), order, searchFields: ['id', 'displayName']});
};

export const query = async (root, args, context: Context) => {
  const {crdClient} = context;
  // tslint:disable-next-line:max-line-length
  const phSchedules = await listQuery(crdClient.phSchedules, args && args.where, args && args.orderBy, context);
  return paginate(phSchedules, extractPagination(args));
};

export const connectionQuery = async (root, args, context: Context) => {
  const {crdClient} = context;
  // tslint:disable-next-line:max-line-length
  const phSchedules = await listQuery(crdClient.phSchedules, args && args.where, args && args.orderBy, context);
  return toRelay(phSchedules, extractPagination(args));
};

export const queryOne = async (root, args, context: Context) => {
  const id = args.where.id;
  const {crdClient, userId: currentUserId} = context;
  const phSchedule = await crdClient.phSchedules.get(id);
  const transformed =
    await transform(phSchedule);
  const viewable = await canUserViewSchedule(currentUserId, transformed, context);
  if (!viewable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }
  return transformed;
};

export const create = async (root, args, context: Context) => {
  const data: PhScheduleMutationInput = args.data;
  validateLicense();
  await validateQuota(context, data.groupId, data.instanceType);
  const mutable = await canUserMutate(context.userId, data.groupId, context);
  if (!mutable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }
  const phSchedule = await createSchedule(context, data);
  return transform(phSchedule);
};

export const update = async (root, args, context: Context) => {
  const {crdClient, kcAdminClient, userId, username} = context;
  const data: Partial<PhScheduleMutationInput> = args.data;
  const phSchedule = await crdClient.phSchedules.get(args.where.id);
  const groupId = data.groupId || phSchedule.spec.jobTemplate.spec.groupId;
  const instanceType = data.instanceType || phSchedule.spec.jobTemplate.spec.instanceType;
  await validateQuota(context, groupId, instanceType);

  const mutable = await canUserMutate(context.userId, phSchedule.spec.jobTemplate.spec.groupId, context);
  if (!mutable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }
  if (data.groupId) {
    const mutableInNewGroup = await canUserMutate(context.userId, data.groupId, context);
    if (!mutableInNewGroup) {
      throw new ApolloError('user not auth', NOT_AUTH_ERROR);
    }
  }

  // construct metadata & spec
  const group = await kcAdminClient.groups.findOne({id: data.groupId});
  const metadata = data.groupId ? {
    labels: {
      'primehub.io/group': escapeToPrimehubLabel(group.name)
    }
  } : undefined;

  // todo: fix any type
  const spec: any = {
    updateTime: moment.utc().toISOString(),
    recurrence: data.recurrence,

    jobTemplate: {
      spec: {
        command: data.command,
        displayName: data.displayName,

        // if group is changed
        groupId: data.groupId,
        groupName: data.groupId ? group.name : undefined,

        // image & instanceType
        image: data.image,
        instanceType: data.instanceType,
        activeDeadlineSeconds: data.activeDeadlineSeconds,
      }
    }
  };
  const updatedSchedule = await context.crdClient.phSchedules.patch(args.where.id, {metadata, spec});
  return transform(updatedSchedule);
};

export const run = async (root, args, context: Context) => {
  const {id} = args.where;
  const phSchedule = await context.crdClient.phSchedules.get(id);

  // get job template
  const jobTemplate = phSchedule.spec.jobTemplate;

  const mutable = await canUserMutate(context.userId, jobTemplate.spec.groupId, context);
  if (!mutable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }

  // create job
  const job = await createJob(context, {
    command: jobTemplate.spec.command,
    displayName: jobTemplate.spec.displayName,
    groupId: jobTemplate.spec.groupId,
    image: jobTemplate.spec.image,
    instanceType: jobTemplate.spec.instanceType,
    activeDeadlineSeconds: jobTemplate.spec.activeDeadlineSeconds,
  });

  return {
    job: {
      id: job.metadata.name,
      displayName: job.spec.displayName
    }
  };
};

export const destroy = async (root, args, context: Context) => {
  const {id} = args.where;

  const phSchedule = await context.crdClient.phSchedules.get(id);
  const jobTemplate = phSchedule.spec.jobTemplate;
  const mutable = await canUserMutate(context.userId, jobTemplate.spec.groupId, context);
  if (!mutable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }

  await context.crdClient.phSchedules.del(id);
  logger.info({
    component: logger.components.phSchedule,
    type: 'DELETE',
    userId: context.userId,
    username: context.username,
    id: phSchedule.metadata.name,
  });

  return {id};
};

export const destroyByGroup = async (
  context: Context,
  group: { id: string; name: string },
  dryrun: boolean
) => {
  const { crdClient } = context;
  const phSchedules = await crdClient.phSchedules.list();
  const transformedPhSchedules = await Promise.all(
    phSchedules.map(schedule => transform(schedule))
  );
  let counter = 0;

  for (const schedule of transformedPhSchedules) {
    if (schedule.groupId !== group.id && schedule.groupName !== group.name) {
      continue;
    }

    if (!dryrun) {
      await context.crdClient.phSchedules.del(schedule.id);
      logger.info({
        component: logger.components.phSchedule,
        type: 'DELETE',
        userId: context.userId,
        username: context.username,
        id: schedule.id,
      });
    }
    counter++;
  }
  return counter;
};
