import KcAdminClient from 'keycloak-admin';
import CrdClient, { InstanceTypeSpec, ImageSpec, DatasetSpec } from '../crdClient/crdClientImpl';
import K8sSecret from '../k8sResource/k8sSecret';
import { Item } from '../crdClient/customResource';

export interface Context {
  realm: string;
  everyoneGroupId: string;
  kcAdminClient: KcAdminClient;
  crdClient: CrdClient;
  getInstanceType: (name: string) => Promise<Item<InstanceTypeSpec>>;
  getImage: (name: string) => Promise<Item<ImageSpec>>;
  getDataset: (name: string) => Promise<Item<DatasetSpec>>;
  k8sSecret: K8sSecret;
  readOnly?: boolean;
  userId: string;
  username: string;
  defaultUserVolumeCapacity: string;
}
