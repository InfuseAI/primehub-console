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
    gpuLimit: string;
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

export type JobPhase =
  | 'Pending'
  | 'Preparing'
  | 'Running'
  | 'Succeeded'
  | 'Failed'
  | 'Cancelled'
  | 'Unknown';

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
