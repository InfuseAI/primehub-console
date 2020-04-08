import kubeClient from 'kubernetes-client';
import * as k8s from '@kubernetes/client-node';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import CustomResource from './customResource';

const inCluster = (process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_SERVICE_PORT);

// initialize k8s client
const Client = (kubeClient as any).Client;
const config = (kubeClient as any).config;
const clusterConfig = inCluster ? config.getInCluster() : config.fromKubeconfig();
export const client = new Client({
  config: {
    ...clusterConfig,
    // k8s api timeout, related: https://github.com/godaddy/kubernetes-client/issues/367
    // it got stuck for no reason
    timeout: 2000
  },
  version: '1.10'
});

// kubernetes-client/javascript for watch
export let watch: k8s.Watch;
const kc = new k8s.KubeConfig();
if (inCluster) {
  kc.loadFromCluster();
} else {
  kc.loadFromFile(`${process.env.HOME}/.kube/config`);
}
watch = new k8s.Watch(kc);

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
  Deploying = 'deploying',
  Deployed = 'deployed',
  Stopped = 'stopped',
  Failed = 'failed',
}

export interface PhDeploymentSpec {
  displayName: string;
  userId: string;
  userName: string;
  groupId: string;
  groupName: string;
  stop: boolean;
  description: string;
  updateTime: string;
  predictors: Array<{
    name: string;
    replicas: number;
    modelImage: string;
    instanceType: string;
    imagePullSecret: string;
    metadata: Record<string, any>;
  }>;
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

/**
 * CRD
 */
const inTest = process.env.TEST;
const loadCrd = (filename: string) =>
  yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, `../../crd/${filename}${inTest ? '.spec' : ''}.yaml`), 'utf8'));

export interface CrdArgs {
  namespace?: string;
}

// share with phJobCacheList
// todo: remove godaddy k8s client
export const phJobCrd = loadCrd('phJob');

export default class CrdClientImpl {
  public instanceTypes: CustomResource<InstanceTypeSpec>;
  public datasets: CustomResource<DatasetSpec>;
  public images: CustomResource<ImageSpec>;
  public imageSpecs: CustomResource<ImageSpecSpec, ImageSpecStatus>;
  public announcements: CustomResource<AnnouncementSpec>;
  public imageSpecJobs: CustomResource<ImageSpecJobSpec, ImageSpecJobStatus>;
  public phJobs: CustomResource<PhJobSpec, PhJobStatus>;
  public phSchedules: CustomResource<PhScheduleSpec, PhScheduleStatus>;
  public phDeployments: CustomResource<PhDeploymentSpec, PhDeploymentStatus>;
  private namespace: string;

  constructor(args?: CrdArgs) {
    this.namespace = args && args.namespace || 'default';
    this.instanceTypes = new CustomResource<InstanceTypeSpec>(
      client,
      watch,
      loadCrd('instance-type'),
      this.namespace
    );
    this.datasets = new CustomResource<DatasetSpec>(
      client,
      watch,
      loadCrd('dataset'),
      this.namespace
    );
    this.images = new CustomResource<ImageSpec>(
      client,
      watch,
      loadCrd('image'),
      this.namespace
    );
    this.imageSpecs = new CustomResource<ImageSpecSpec, ImageSpecStatus>(
      client,
      watch,
      loadCrd('imageSpec'),
      this.namespace
    );
    this.imageSpecJobs = new CustomResource<ImageSpecJobSpec, ImageSpecJobStatus>(
      client,
      watch,
      loadCrd('imageSpecJob'),
      this.namespace
    );
    this.phJobs = new CustomResource<PhJobSpec, PhJobStatus>(
      client,
      watch,
      phJobCrd,
      this.namespace
    );
    this.phSchedules = new CustomResource<PhScheduleSpec, PhScheduleStatus>(
      client,
      watch,
      loadCrd('phSchedule'),
      this.namespace
    );
    this.phDeployments = new CustomResource<PhDeploymentSpec, PhDeploymentStatus>(
      client,
      watch,
      loadCrd('phDeployment'),
      this.namespace
    );
    this.announcements = new CustomResource<AnnouncementSpec>(
      client,
      watch,
      loadCrd('announcement'),
      this.namespace
    );
  }
}
