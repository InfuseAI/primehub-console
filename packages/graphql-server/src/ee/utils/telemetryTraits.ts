import {TraitMiddleware} from '../../utils/telemetry';
import CrdClient from '../../crdClient/crdClientImpl';
import { Config } from '../../config';

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
  crdClient: CrdClient;
}

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
