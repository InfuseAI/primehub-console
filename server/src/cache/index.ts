import KeycloakAdminClient from 'keycloak-admin';
import {memoize} from './memoize';
import CrdClientImpl from '../crdClient/crdClientImpl';

export const addCacheLayerToKc = (kcAdminClient: KeycloakAdminClient) => {
  // listRealmRoleMappings
  kcAdminClient.groups.listRealmRoleMappings =
    memoize(kcAdminClient.groups.listRealmRoleMappings, {cacheKey: args => args.id});

  return kcAdminClient;
};

export const memGetInstanceType = (crdClient: CrdClientImpl) => memoize(crdClient.instanceTypes.get);
export const memGetImage = (crdClient: CrdClientImpl) => memoize(crdClient.images.get);
export const memGetDataset = (crdClient: CrdClientImpl) => memoize(crdClient.datasets.get);
