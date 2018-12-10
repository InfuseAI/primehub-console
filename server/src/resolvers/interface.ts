import KcAdminClient from 'keycloak-admin';
import CrdClient, { InstanceTypeSpec, ImageSpec, DatasetSpec } from '../crdClient/crdClientImpl';
import GitSyncSecret from '../k8sResource/gitSyncSecret';
import { Item } from '../crdClient/customResource';

export interface Context {
  realm: string;
  everyoneGroupId: string;
  kcAdminClient: KcAdminClient;
  crdClient: CrdClient;
  getInstanceType: (name: string) => Promise<Item<InstanceTypeSpec>>;
  getImage: (name: string) => Promise<Item<ImageSpec>>;
  getDataset: (name: string) => Promise<Item<DatasetSpec>>;
  gitSyncSecret: GitSyncSecret;
  readOnly?: boolean;
  userId: string;
}
