import KcAdminClient from 'keycloak-admin';
import CrdClient from '../crdClient/crdClientImpl';
import GitSyncSecret from '../k8sResource/gitSyncSecret';

export interface Context {
  realm: string;
  everyoneGroupId: string;
  kcAdminClient: KcAdminClient;
  crdClient: CrdClient;
  gitSyncSecret: GitSyncSecret;
  readOnly?: boolean;
}
