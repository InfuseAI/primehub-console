import kubeClient from 'kubernetes-client';
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

/**
 * Spec interface
 */

export interface InstanceTypeSpec {
  displayName?: string;
  'limits.cpu'?: number;
  'limits.memory'?: string;
  'requests.cpu'?: number;
  'requests.memory'?: string;
  'limits.nvidia.com/gpu'?: number;
}

export interface ImageSpec {
  displayName?: string;
  url?: string;
}

export interface DatasetSpec {
  displayName?: string;
  access?: string;
  type?: string;
  url?: string;
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
  private namespace: string;

  constructor(args?: CrdArgs) {
    this.namespace = args && args.namespace || 'default';
    this.instanceTypes = new CustomResource<InstanceTypeSpec>(
      client,
      loadCrd('instance-type'),
      this.namespace
    );
    this.datasets = new CustomResource<DatasetSpec>(
      client,
      loadCrd('dataset'),
      this.namespace
    );
    this.images = new CustomResource<ImageSpec>(
      client,
      loadCrd('image'),
      this.namespace
    );
  }
}
