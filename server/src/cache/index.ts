import KeycloakAdminClient from 'keycloak-admin';
import {memoize} from './memoize';
import CrdClientImpl from '../crdClient/crdClientImpl';

export const addCacheLayerToKc = (kcAdminClient: KeycloakAdminClient) => {
  // listRealmRoleMappings
  kcAdminClient.groups.listRealmRoleMappings =
    memoize(kcAdminClient.groups.listRealmRoleMappings, {cacheKey: args => args.id});

  return kcAdminClient;
};

export const getInstanceType = (crdClient: CrdClientImpl) => memoize(crdClient.instanceTypes.get);
export const getImage = (crdClient: CrdClientImpl) => memoize(crdClient.images.get);
export const getDataset = (crdClient: CrdClientImpl) => memoize(crdClient.datasets.get);
