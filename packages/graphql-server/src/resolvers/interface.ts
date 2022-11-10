import KcAdminClient from 'keycloak-admin';
import CrdClient, { InstanceTypeSpec, ImageSpec, DatasetSpec } from '../crdClient/crdClientImpl';
import {Client as MinioClient} from 'minio';
import K8sSecret from '../k8sResource/k8sSecret';
import { Item } from '../crdClient/customResourceNG';
import K8sDatasetPvc from '../k8sResource/k8sDatasetPvc';
import K8sUploadServerSecret from '../k8sResource/k8sUploadServerSecret';
import { JobLogCtrl } from '../ee/controllers/jobLogCtrl';
import { PodLogs } from '../controllers/logCtrl';
import K8sGroupPvc from '../k8sResource/k8sGroupPvc';
import { PhJobCacheList } from '../ee/crdClient/phJobCacheList';
import { Telemetry } from '../utils/telemetry';

export enum Role {
  CLIENT = 'CLIENT',
  USER = 'USER',
  ADMIN = 'ADMIN',
  NOT_AUTH = 'NOT_AUTH'
}

export interface Context {
  realm: string;
  everyoneGroupId: string;
  kcAdminClient: KcAdminClient;
  keycloakClientId: string;
  crdClient: CrdClient;
  minioClient: MinioClient;
  storeBucket: string;
  getInstanceType: (name: string) => Promise<Item<InstanceTypeSpec>>;
  getImage: (name: string) => Promise<Item<ImageSpec>>;
  getDataset: (name: string) => Promise<Item<DatasetSpec>>;
  k8sSecret: K8sSecret;
  readOnly?: boolean;
  userId: string;
  username: string;
  role: Role;
  defaultUserVolumeCapacity: string;
  crdNamespace: string;
  k8sDatasetPvc: K8sDatasetPvc;
  k8sUploadServerSecret: K8sUploadServerSecret;
  k8sGroupPvc: K8sGroupPvc;
  namespace: string;
  appPrefix: string;
  graphqlHost: string;
  jobLogCtrl: JobLogCtrl;
  podLogs: PodLogs;
  phJobCacheList: PhJobCacheList;
  usageReportAPIHost: string;
  telemetry: Telemetry;
}
