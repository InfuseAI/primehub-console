import {
  getFromAttr,
  getMultivaluedFromAttr,
  parseDiskQuota,
  parseMemory,
  parseBoolean
} from './utils';

const transformEnvs = (val: string): {name: string, value: string} => {
  const tmp = val.split('=');
  return {name: tmp[0], value: tmp[1]};
};

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
    mlflow: {
      trackingUri: getFromAttr('mlflow-tracking-uri', group.attributes, null),
      uiUrl: getFromAttr('mlflow-ui-url', group.attributes, null),
      trackingEnvs: getMultivaluedFromAttr('mlflow-tracking-envs', group.attributes, [], transformEnvs),
      artifactEnvs: getMultivaluedFromAttr('mlflow-artifact-envs', group.attributes, [], transformEnvs),
    }
  };
};
