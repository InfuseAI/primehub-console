import {TraitMiddleware} from './telemetry';
import KcAdminClient from 'keycloak-admin';
import { Config } from '../config';
import { pickBy } from 'lodash';
import CrdClient from '../crdClient/crdClientImpl';

const userCount = async (kcAdminClient: KcAdminClient): Promise<number> => {
  return kcAdminClient.users.makeRequest({
    method: 'GET',
    path: '/count',
  })();
};

const groupCount = async (kcAdminClient: KcAdminClient): Promise<number> => {
  return kcAdminClient.groups.makeRequest({
    method: 'GET',
    path: '/count',
  })().then(result => {
    // minus 1 because of the everyone group
    return result.count - 1;
  });
};

const licenseStatusString = async (config: Config): Promise<string> => {
  const status = config.licenseStatus.toLowerCase();
  return status;
};

const modelDploymentCount = async (crdClient: CrdClient): Promise<number> => {
  return (await crdClient.phDeployments.list()).length;
};

const scheduleCount = async (crdClient: CrdClient): Promise<number> => {
  return (await crdClient.phSchedules.list()).length;
};

interface CreateDefaultTraitMiddlewareParams {
  config: Config;
  createKcAdminClient: () => KcAdminClient;
  getAccessToken: () => Promise<string>;
}

interface CreateEETraitMiddlewareParams {
  config: Config;
  crdClient: CrdClient;
}

export const createDefaultTraitMiddleware = (params: CreateDefaultTraitMiddlewareParams): TraitMiddleware => {
  const {createKcAdminClient, getAccessToken, config} = params;

  return async (traits, next) => {
    const accessToken = await getAccessToken();
    const kcAdminClient: KcAdminClient = createKcAdminClient();
    kcAdminClient.setAccessToken(accessToken);
    const users = await userCount(kcAdminClient);
    const groups = await groupCount(kcAdminClient);
    const dimensions = pickBy({
      primehubVersion: config.version,
      primehubMode: config.primehubMode,
    });
    Object.assign(traits, {
      ...dimensions,
      users,
      groups,
    });
    next();
  };
};

export const createEETraitMiddleware = (params: CreateEETraitMiddlewareParams): TraitMiddleware => {
  const {config, crdClient} = params;

  return async (traits, next) => {
    const licenseStatus = await licenseStatusString(config);
    const deployments = await modelDploymentCount(crdClient);
    const schedules = await scheduleCount(crdClient);
    Object.assign(traits, {
      licenseStatus,
      deployments,
      schedules,
    });
    next();
  };
};
