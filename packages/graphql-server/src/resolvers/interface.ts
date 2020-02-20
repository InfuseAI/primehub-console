import KcAdminClient from 'keycloak-admin';
import CrdClient, { InstanceTypeSpec, ImageSpec, DatasetSpec } from '../crdClient/crdClientImpl';
import K8sSecret from '../k8sResource/k8sSecret';
import { Item } from '../crdClient/customResource';
import WorkspaceApi from '../workspace/api';
import K8sDatasetPvc from '../k8sResource/k8sDatasetPvc';
import K8sUploadServerSecret from '../k8sResource/k8sUploadServerSecret';
import { JobLogCtrl } from '../controllers/jobLogCtrl';
import K8sGroupPvc from '../k8sResource/k8sGroupPvc';
import { PhJobCacheList } from '../crdClient/phJobCacheList';

export enum Role {
  CLIENT = 'CLIENT',
  JOB_USER = 'JOB_USER',
  ADMIN = 'ADMIN',
  NOT_AUTH = 'NOT_AUTH'
}

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
  role: Role;
  defaultUserVolumeCapacity: string;
  workspaceApi: WorkspaceApi;
  crdNamespace: string;
  k8sDatasetPvc: K8sDatasetPvc;
  k8sUploadServerSecret: K8sUploadServerSecret;
  k8sGroupPvc: K8sGroupPvc;
  namespace: string;
  graphqlHost: string;
  jobLogCtrl: JobLogCtrl;
  phJobCacheList: PhJobCacheList;
}
