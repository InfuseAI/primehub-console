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
export const client = new Client({
  config: inCluster ? config.getInCluster() : config.fromKubeconfig(),
  version: '1.10'
});

// kubernetes-client/javascript for watch
let watch: k8s.Watch;
const kc = new k8s.KubeConfig();
if (inCluster) {
  kc.loadFromCluster();
} else {
  kc.loadFromFile(`${process.env.HOME}/.kube/config`);
}
watch = new k8s.Watch(kc);

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
  group: string;
  image: string;
  instanceType: string;
  userId: string;
  userName: string;
}

export enum PhJobPhase {
  Pending = 'Pending',
  Ready = 'Ready',
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
  startTime: string;
  finishTime?: string;
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

export default class CrdClientImpl {
  public instanceTypes: CustomResource<InstanceTypeSpec>;
  public datasets: CustomResource<DatasetSpec>;
  public images: CustomResource<ImageSpec>;
  public imageSpecs: CustomResource<ImageSpecSpec, ImageSpecStatus>;
  public announcements: CustomResource<AnnouncementSpec>;
  public imageSpecJobs: CustomResource<ImageSpecJobSpec, ImageSpecJobStatus>;
  public phJobs: CustomResource<PhJobSpec, PhJobStatus>;
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
      loadCrd('instance-type'),
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
