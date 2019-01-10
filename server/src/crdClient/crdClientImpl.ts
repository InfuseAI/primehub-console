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
}

export interface ImageSpec {
  displayName?: string;
  description?: string;
  url?: string;
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
  title?: string;
  content?: string;
  expiryDate?: number;
  sendEmail?: boolean;
  emailSent?: number;
  status?: string; // published, draft
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
  public announcements: CustomResource<AnnouncementSpec>;
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
    this.announcements = new CustomResource<AnnouncementSpec>(
      client,
      watch,
      loadCrd('announcement'),
      this.namespace
    );
  }
}
