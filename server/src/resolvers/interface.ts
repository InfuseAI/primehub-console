import KcAdminClient from 'keycloak-admin';
import CrdClient from '../crdClient/crdClientImpl';

export interface Context {
  realm: string;
  everyoneGroupId: string;
  kcAdminClient: KcAdminClient;
  crdClient: CrdClient;
  readOnly?: boolean;
}
