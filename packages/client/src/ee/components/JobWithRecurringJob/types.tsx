import type { TInstanceType } from 'admin/InstanceTypes';

export type Job = {
  id: string;
  displayName: string;
  cancel: null;
  command: string;
  groupId: string;
  groupName: string;
  schedule: string;
  image: string;
  instanceType: {
    id: string;
    name: string;
    displayName: string;
    cpuLimit: number;
    memoryLimit: number;
    gpuLimit: number;
  };
  userId: string;
  userName: string;
  phase: JobPhase;
  reason: string;
  message: string;
  createTime: string;
  startTime: string;
  finishTime: string;
  logEndpoint: string;
};

export type RecurringJob = {
  id: string;
  displayName: string;
  invalid: boolean;
  message: string;
  command: string;
  groupId: string;
  groupName: string;
  image: string;
  userId: string;
  userName: string;
  nextRunTime: string | null;
  activeDeadlineSeconds: number;
  recurrence: Recurrence;
  instanceType: TInstanceType;
};

export type JobPhase =
  | 'Pending'
  | 'Preparing'
  | 'Running'
  | 'Succeeded'
  | 'Failed'
  | 'Cancelled'
  | 'Unknown';

export type RecurrenceType =
  | 'inactive'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'custom';

export type Recurrence = {
  type: RecurrenceType;
  cron: string;
};

export interface ActionInfo {
  id: string;
  displayName: string;
}

export type JobActionVariables = {
  variables: {
    where: {
      id: string;
    };
  };
};

export type RerunJob = {
  data: {
    rerunJob: Job;
  };
};

export interface CreateJobVariables {
  groupId: string;
  displayName: string;
  instanceType: string;
  image: string;
  command: string;
  activeDeadlineSeconds: number;
}

export interface CreateScheduleVariables extends CreateJobVariables {
  recurrence: { cron: string; type: string };
}

export type PageInfo = {
  totalPage: number;
  currentPage: number;
};
