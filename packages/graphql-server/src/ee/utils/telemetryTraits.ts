import {TraitMiddleware} from '../../utils/telemetry';
import CrdClient from '../../crdClient/crdClientImpl';
import { Config } from '../../config';
import { getModelsTelemetry } from '../resolvers/model';
import KcAdminClient from 'keycloak-admin';

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

interface CreateEETraitMiddlewareParams {
  config: Config;
  createKcAdminClient: () => KcAdminClient;
  getAccessToken: () => Promise<string>;
  crdClient: CrdClient;
}

export const createEETraitMiddleware = (params: CreateEETraitMiddlewareParams): TraitMiddleware => {
  const {createKcAdminClient, getAccessToken, config, crdClient} = params;

  return async (traits, next) => {
    const accessToken = await getAccessToken();
    const kcAdminClient: KcAdminClient = createKcAdminClient();
    kcAdminClient.setAccessToken(accessToken);

    const licenseStatus = await licenseStatusString(config);
    const deployments = await modelDploymentCount(crdClient);
    const schedules = await scheduleCount(crdClient);
    const modelsTelemetry = await getModelsTelemetry(config, kcAdminClient);
    Object.assign(traits, {
      licenseStatus,
      deployments,
      schedules,
      ...modelsTelemetry,
    });
    next();
  };
};
