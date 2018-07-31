import kubeClient from 'kubernetes-client';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import CustomResource from './customResource';

// initialize k8s client
const Client = (kubeClient as any).Client;
const config = (kubeClient as any).config;
const client = new Client({ config: config.fromKubeconfig(), version: '1.10' });

/**
 * Spec interface
 */

export interface InstanceTypeSpec {
  'limits.cpu'?: number;
  'limits.memory'?: string;
  'requests.cpu'?: number;
  'requests.memory'?: string;
  'limits.nvidia.com/gpu'?: number;
}

export interface ImageSpec {
  url?: string;
}

export interface DatasetSpec {
  type?: string;
  url?: string;
}

/**
 * CRD
 */
const loadCrd = (filename: string) =>
  yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, `../../crd/${filename}.yaml`), 'utf8'));

export default class CrdClientImpl {
  public instanceTypes = new CustomResource<InstanceTypeSpec>(
    client,
    loadCrd('instance-type')
  );

  public datasets = new CustomResource<DatasetSpec>(
    client,
    loadCrd('dataset')
  );

  public images = new CustomResource<ImageSpec>(
    client,
    loadCrd('image')
  );
}
