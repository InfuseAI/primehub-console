export interface ActionInfo {
  id: string;
  displayName: string;
}

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
