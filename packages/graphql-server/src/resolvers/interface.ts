import KcAdminClient from 'keycloak-admin';
import CrdClient, { InstanceTypeSpec, ImageSpec, DatasetSpec } from '../crdClient/crdClientImpl';
import K8sSecret from '../k8sResource/k8sSecret';
import { Item } from '../crdClient/customResource';
import WorkspaceApi from '../workspace/api';
import K8sDatasetPvc from '../k8sResource/k8sDatasetPvc';
import K8sUploadServerSecret from '../k8sResource/k8sUploadServerSecret';
import { JobLogCtrl } from '../controllers/jobLogCtrl';

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
  workspaceApi: WorkspaceApi;
  crdNamespace: string;
  k8sDatasetPvc: K8sDatasetPvc;
  k8sUploadServerSecret: K8sUploadServerSecret;
  namespace: string;
  graphqlHost: string;
  jobLogCtrl: JobLogCtrl;
}
