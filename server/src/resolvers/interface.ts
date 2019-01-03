import KcAdminClient from 'keycloak-admin';
import CrdClient, { InstanceTypeSpec, ImageSpec, DatasetSpec, AnnouncementSpec } from '../crdClient/crdClientImpl';
import GitSyncSecret from '../k8sResource/gitSyncSecret';
import { Item } from '../crdClient/customResource';
import { CrdCache } from '../cache/crdCache';

export interface Context {
  realm: string;
  everyoneGroupId: string;
  kcAdminClient: KcAdminClient;
  crdClient: CrdClient;
  getInstanceType: (name: string) => Promise<Item<InstanceTypeSpec>>;
  getImage: (name: string) => Promise<Item<ImageSpec>>;
  getDataset: (name: string) => Promise<Item<DatasetSpec>>;
  gitSyncSecret: GitSyncSecret;
  annCache: CrdCache<AnnouncementSpec>;
  readOnly?: boolean;
  userId: string;
  username: string;
}
