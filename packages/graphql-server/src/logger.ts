// tslint:disable:no-console
const devEnv = (!process.env.NODE_ENV || process.env.NODE_ENV === 'development');

enum level {
  info = 'INFO',
  debug = 'DEBUG',
  warn = 'WARN',
  error = 'ERROR',
  fatal = 'FATAL',
}

export enum components {
  system = 'System',
  authentication = 'Authentication',
  tokenSyncer = 'TokenSyncer',
  watcher = 'Watcher',
  crdCache = 'CrdCache',
  group = 'Group',
  user = 'User',
  dataset = 'Dataset',
  image = 'Image',
  instanceType = 'InstanceType',
  secret = 'Secret',
  buildImage = 'BuildImage',
  phJob = 'PhJob',
  phSchedule = 'PhSchedule',
  phDeployment = 'PhDeployment',
  phApplication = 'PhApplication',
  internal = 'Internal',
  usageReport = 'UsageReport',
  resourceStatus = 'ResourceStatus',
  telemetry = 'Telemetry',
  store = 'Store',
  model = 'Model',
  datasetV2 = 'DatasetV2',
}

export const log = (levelType: level = level.info, payload?: any) => {
  if (!process.env.CI || levelType !== level.info) {
    console.log(JSON.stringify({
      time: new Date().toISOString(),
      level: levelType,
      ...payload
    }));
  }
};

export const info = (payload: any) => {
  log(level.info, payload);
};

export const debug = (payload: any) => {
  log(level.debug, payload);
};

export const warn = (payload: any) => {
  log(level.warn, payload);
};

export const fatal = (payload: any) => {
  log(level.fatal, payload);
};

export const error = (payload: any) => {
  console.error(JSON.stringify({
    time: new Date().toISOString(),
    level: level.error,
    ...payload
  }));
};
