import {TraitMiddleware} from './telemetry';
import CrdClient from '../crdClient/crdClientImpl';
import KcAdminClient from 'keycloak-admin';
import { Config } from '../config';
import { pickBy } from 'lodash';

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

const appCount = async (crdClient: CrdClient): Promise<number> => {
  const apps = await crdClient.phApplications.list();
  return apps.length;
};

const appTemplateCount = async (crdClient: CrdClient): Promise<number> => {
  const appTemplates = await crdClient.phAppTemplates.list();
  return appTemplates.length;
};

interface CreateDefaultTraitMiddlewareParams {
  config: Config;
  createKcAdminClient: () => KcAdminClient;
  getAccessToken: () => Promise<string>;
  crdClient: CrdClient;
}

export const createDefaultTraitMiddleware = (params: CreateDefaultTraitMiddlewareParams): TraitMiddleware => {
  const {createKcAdminClient, getAccessToken, config, crdClient} = params;

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
    const apps = await appCount(crdClient);
    const appTemplates = await appTemplateCount(crdClient);
    Object.assign(traits, {
      ...dimensions,
      users,
      groups,
      apps,
      appTemplates,
    });
    next();
  };
};
