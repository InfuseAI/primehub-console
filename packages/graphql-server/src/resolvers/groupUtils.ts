import {
  getFromAttr,
  getMultivaluedFromAttr,
  parseDiskQuota,
  parseMemory,
  parseBoolean
} from './utils';

export const transform = (group: any): any => {
  return {
    ...group,
    quotaCpu: getFromAttr('quota-cpu', group.attributes, null, parseFloat),
    quotaGpu: getFromAttr('quota-gpu', group.attributes, null, parseInt),
    quotaMemory: getFromAttr('quota-memory', group.attributes, null, parseMemory),
    userVolumeCapacity: getFromAttr('user-volume-capacity', group.attributes, null, parseDiskQuota),
    projectQuotaCpu: getFromAttr('project-quota-cpu', group.attributes, null, parseFloat),
    projectQuotaGpu: getFromAttr('project-quota-gpu', group.attributes, null, parseInt),
    projectQuotaMemory: getFromAttr('project-quota-memory', group.attributes, null, parseMemory),
    enabledSharedVolume: getFromAttr('enabled-shared-volume', group.attributes, false, parseBoolean),
    sharedVolumeCapacity: getFromAttr('shared-volume-capacity', group.attributes, null, parseDiskQuota),
    homeSymlink: getFromAttr('home-symlink', group.attributes, null, parseBoolean),
    launchGroupOnly: getFromAttr('launch-group-only', group.attributes, null, parseBoolean),
    enabledDeployment: getFromAttr('enabled-deployment', group.attributes, null, parseBoolean),
    displayName: getFromAttr('displayName', group.attributes, null),
    jobDefaultActiveDeadlineSeconds: getFromAttr('job-default-active-deadline-seconds',
                                                  group.attributes, null, parseInt),
    admins: getMultivaluedFromAttr('admins', group.attributes, []).join(','),
  };
};
