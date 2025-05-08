import * as k8s from '@kubernetes/client-node';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import CustomResourceNG from './customResourceNG';

const inCluster = (process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_SERVICE_PORT);

// kubernetes-client/javascript
export let watch: k8s.Watch;
const kc = new k8s.KubeConfig();

if (inCluster) {
  kc.loadFromCluster();
} else {
  kc.loadFromFile(`${process.env.HOME}/.kube/config`);
}
watch = new k8s.Watch(kc);
export const client = kc.makeApiClient(k8s.CustomObjectsApi);
export const corev1KubeClient = kc.makeApiClient(k8s.CoreV1Api);

export const kubeConfig = kc;

/**
 * Spec interface
 */

export interface InstanceTypeSpec {
  displayName?: string;
  description?: string;
  'limits.cpu'?: number;
  'limits.memory'?: string;
  'requests.cpu'?: number;
  'requests.memory'?: string;
  'limits.nvidia.com/gpu'?: number;
  'limits.gpu'?: number;
  'gpuResourceName'?: string;
  tolerations?: Array<{operator: string, effect?: string, key?: string, value?: string}>;
  nodeSelector?: Record<string, any>;
}

export enum ImageType {
  cpu = 'cpu',
  gpu = 'gpu',
  both = 'both'
}

export interface ImageSpec {
  displayName?: string;
  description?: string;
  url?: string;
  pullSecret?: string;
  type?: ImageType;
  urlForGpu?: string;
  groupName?: string;
  imageSpec?: ImageCrdImageSpec;
  logEndpoint?: string;
}

export interface DatasetSpec {
  displayName?: string;
  description?: string;
  access?: string;
  type?: string;
  url?: string;
  variables?: Record<string, any>;
  volumeName?: string;
}

export interface AnnouncementSpec {
  content: string;
  expiryDate: number;
  sendEmail: boolean;
  status: string; // published, draft
}

export interface ImageCrdImageSpec {
  baseImage?: string;
  pullSecret?: string;
  packages?: ImageCrdImageSpecPackages;
  // iso8601
  updateTime?: string;
  cancel?: boolean;
}

export interface ImageCrdImageSpecPackages {
  apt?: string[];
  pip?: string[];
  conda?: string[];
}

export interface ImageSpecSpec {
  baseImage?: string;
  pullSecret?: string;
  packages?: {
    apt?: string[];
    pip?: string[];
    conda?: string[];
  };
  // iso8601
  updateTime?: string;
}

export interface ImageSpecStatus {
  phase: string;
  image: string;
  jobName: string;
}

export interface ImageSpecJobSpec {
  baseImage?: string;
  pullSecret?: string;
  packages?: {
    apt?: string[];
    pip?: string[];
    conda?: string[];
  };
  targetImage?: string;
  repoPrefix?: string;
  // iso8601
  updateTime?: string;
}

export interface ImageSpecJobStatus {
  startTime: string;
  finishTime: string;
  phase: string;
  podName: string;
}

export interface PhJobSpec {
  cancel: boolean;
  command: string;
  displayName: string;
  groupId: string;
  groupName: string;
  image: string;
  instanceType: string;
  userId: string;
  userName: string;
  activeDeadlineSeconds?: number;
}

export interface PhScheduleSpec {
  updateTime: string;

  recurrence: {
    type: string;
    cron?: string;
  };

  jobTemplate: {
    metadata: {
      labels: {
        'phjob.primehub.io/scheduledBy': string;
      }
    }

    spec: Omit<PhJobSpec, 'cancel'>;
  };
}

export enum PhJobPhase {
  Pending = 'Pending',
  Preparing = 'Preparing',
  Running = 'Running',
  Succeeded = 'Succeeded',
  Failed = 'Failed',
  Cancelled = 'Cancelled',
  Unknown = 'Unknown'
}

export interface PhJobStatus {
  phase: PhJobPhase;
  podName: string;
  reason?: string;
  message?: string;
  startTime: string;
  finishTime?: string;
}

export interface PhScheduleStatus {
  invalid: boolean;
  message: string;
  nextRunTime: string;
}

// PhDeployment
export enum PhDeploymentPhase {
  Deploying = 'Deploying',
  Deployed = 'Deployed',
  Stopped = 'Stopped',
  Stopping = 'Stopping',
  Failed = 'Failed',
}

export interface PhDeploymentSpec {
  displayName: string;
  userId: string;
  userName: string;
  groupId: string;
  groupName: string;
  stop: boolean;
  description: string;
  updateMessage: string;
  updateTime: string;
  env: any;
  predictors: Array<{
    name: string;
    replicas: number;
    modelImage: string;
    modelURI: string;
    instanceType: string;
    imagePullSecret: string;
    metadata: Record<string, any>;
  }>;
  endpoint: PhDeploymentEndPoint;
}

export interface PhDeploymentStatus {
  phase: PhDeploymentPhase;
  message: string;
  replicas: number;
  availableReplicas: number;
  endpoint: string;
  history: Array<{
    time: string;
    spec: PhDeploymentSpec;
  }>;
}

export interface PhDeploymentEndPoint {
  accessType: string;
  clients: Array<{
    name: string;
    token: string;
  }>;
}

// PhApplication
export enum PhApplicationScope {
  Public = 'public',
  PrimeHub = 'primehub',
  Group = 'group',
}

export enum PhApplicationPhase {
  Starting = 'Starting',
  Ready = 'Ready',
  Updating = 'Updating',
  Stopping = 'Stopping',
  Stopped = 'Stopped',
  Error = 'Error',
}

export interface PhApplicationSpec {
  displayName: string;
  groupName: string;
  instanceType: string;
  scope: PhApplicationScope;
  stop: boolean;
  podTemplate: any;
  svcTemplate: any;
  httpPort: number;
  rewrite?: boolean;
  appRoot?: string;
}

export interface PhApplicationStatus {
  phase: PhApplicationPhase;
  message: string;
  serviceName: string;
}

export interface PhAppTemplateSpec {
  name: string;
  description: string;
  version: string;
  docLink: string;
  icon: string;
  defaultEnvs: Array<{
    name: string;
    description: string;
    defaultValue: string;
    optional: boolean;
  }>;
  template: {
    spec: {
      podTemplate: any;
      svcTemplate: any;
      httpPort: number;
      rewrite?: boolean;
      appRoot?: string;
    }
  };
}

/**
 * CRD
 */
const inTest = process.env.TEST;
const loadCrd = (filename: string): any =>
  yaml.load(fs.readFileSync(path.resolve(__dirname, `../../crd/${filename}.yaml`), 'utf8'));

export interface CrdArgs {
  namespace?: string;
}

// share with phJobCacheList
// todo: remove godaddy k8s client
export const phJobCrd = loadCrd('phJob');

export default class CrdClientImpl {
  public instanceTypes: CustomResourceNG<InstanceTypeSpec>;
  public datasets: CustomResourceNG<DatasetSpec>;
  public images: CustomResourceNG<ImageSpec>;
  public imageSpecs: CustomResourceNG<ImageSpecSpec, ImageSpecStatus>;
  public announcements: CustomResourceNG<AnnouncementSpec>;
  public imageSpecJobs: CustomResourceNG<ImageSpecJobSpec, ImageSpecJobStatus>;
  public phJobs: CustomResourceNG<PhJobSpec, PhJobStatus>;
  public phSchedules: CustomResourceNG<PhScheduleSpec, PhScheduleStatus>;
  public phDeployments: CustomResourceNG<PhDeploymentSpec, PhDeploymentStatus>;
  public phApplications: CustomResourceNG<PhApplicationSpec, PhApplicationStatus>;
  public phAppTemplates: CustomResourceNG<PhAppTemplateSpec>;
  private namespace: string;

  constructor(args?: CrdArgs) {
    this.namespace = args && args.namespace || 'default';
    this.instanceTypes = new CustomResourceNG<InstanceTypeSpec>(
      client,
      watch,
      loadCrd('instance-type'),
      this.namespace
    );
    this.datasets = new CustomResourceNG<DatasetSpec>(
      client,
      watch,
      loadCrd('dataset'),
      this.namespace
    );
    this.images = new CustomResourceNG<ImageSpec>(
      client,
      watch,
      loadCrd('image'),
      this.namespace
    );
    this.imageSpecs = new CustomResourceNG<ImageSpecSpec, ImageSpecStatus>(
      client,
      watch,
      loadCrd('imageSpec'),
      this.namespace
    );
    this.imageSpecJobs = new CustomResourceNG<ImageSpecJobSpec, ImageSpecJobStatus>(
      client,
      watch,
      loadCrd('imageSpecJob'),
      this.namespace
    );
    this.phJobs = new CustomResourceNG<PhJobSpec, PhJobStatus>(
      client,
      watch,
      phJobCrd,
      this.namespace
    );
    this.phSchedules = new CustomResourceNG<PhScheduleSpec, PhScheduleStatus>(
      client,
      watch,
      loadCrd('phSchedule'),
      this.namespace
    );
    this.phDeployments = new CustomResourceNG<PhDeploymentSpec, PhDeploymentStatus>(
      client,
      watch,
      loadCrd('phDeployment'),
      this.namespace
    );
    this.phApplications = new CustomResourceNG<PhApplicationSpec, PhApplicationStatus>(
      client,
      watch,
      loadCrd('phApplication'),
      this.namespace
    );
    this.phAppTemplates = new CustomResourceNG<PhAppTemplateSpec>(
      client,
      watch,
      loadCrd('phAppTemplate'),
      this.namespace
    );
    this.announcements = new CustomResourceNG<AnnouncementSpec>(
      client,
      watch,
      loadCrd('announcement'),
      this.namespace
    );
  }
}
