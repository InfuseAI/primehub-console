import KcAdminClient from 'keycloak-admin';
import CrdClient from '../crdClient/crdClientImpl';

export interface Context {
  realm: string;
  kcAdminClient: KcAdminClient;
  crdClient: CrdClient;
}
