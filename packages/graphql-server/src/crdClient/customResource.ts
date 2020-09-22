import { Watch } from '@kubernetes/client-node';
import { pick } from 'lodash';
import * as logger from '../logger';
import { apiUnavailable, resourceNotFound } from '../k8sResource/k8sError';

export interface Metadata {
  clusterName?: string;
  creationTimestamp?: string;
  description?: string;
  generation?: number;
  name?: string;
  namespace?: string;
  resourceVersion?: string;
  selfLink?: string;
  uid?: string;
  annotations?: any;
  labels?: any;
}

export interface Item<SpecType, StatusType = any> {
  metadata: Metadata;
  spec: SpecType;
  status: StatusType;
}

// constants
// WATCH_TIMEOUT_SECONDS: 10 minutes
const WATCH_TIMEOUT_SECONDS = 60 * 10;

export default class CustomResource<SpecType = any, StatusType = any> {
  private kubeClient: any;
  private watchApi: Watch;
  private crd: any;
  private namespace: string;

  constructor(kubeClient: any, watch: Watch, crd: any, namespace: string) {
    kubeClient.addCustomResourceDefinition(crd);
    this.crd = crd;
    this.namespace = namespace;
    this.watchApi = watch;
    this.kubeClient = kubeClient;
  }

  public getResourcePlural() {
    return this.crd.spec && this.crd.spec.names && this.crd.spec.names.plural;
  }

  public get = async (name: string, namespace?: string): Promise<Item<SpecType, StatusType>> => {
    try {
      const resource = this.getResource(namespace);
      const {body} = await resource(name).get();
      return pick(body, ['metadata', 'spec', 'status']) as Item<SpecType, StatusType>;
    } catch (error) {
      logger.error({
        component: logger.components.internal,
        type: 'K8S_API_FAILED',
        resource: this.getResourcePlural(),
        operation: 'GET',
        name,
        error
      });
      const CODE = 'code';
      if (error[CODE] && error[CODE] === 404) {
        throw resourceNotFound(error);
      }
      throw apiUnavailable();
    }
  }

  public list = async (namespace?: string, qs?: Record<string, any>): Promise<Array<Item<SpecType, StatusType>>> => {
    try {
      const resource = this.getResource(namespace);
      const {body} = await resource.get({qs});
      return body.items.map(item => pick(item, ['metadata', 'spec', 'status']));
    } catch (error) {
      logger.error({
        component: logger.components.internal,
        type: 'K8S_API_FAILED',
        resource: this.getResourcePlural(),
        operation: 'LIST',
        error
      });
      throw apiUnavailable();
    }
  }

  // tslint:disable-next-line:max-line-length
  public create = async (metadata: Metadata, spec: SpecType, namespace?: string): Promise<Item<SpecType, StatusType>> => {
    const resource = this.getResource(namespace);
    const object = this.prepareCustomObject({metadata, spec});
    const {body} = await resource.post({body: object});
    return pick(body, ['metadata', 'spec', 'status']) as Item<SpecType>;
  }

  public patch = async (
    name: string, {metadata, spec}: {metadata?: Metadata, spec: SpecType},
    namespace?: string
  ): Promise<Item<SpecType, StatusType>> => {
    const resource = this.getResource(namespace);
    const object = this.prepareCustomObject({metadata, spec});
    const {body} = await resource(name).patch({
      body: object,
      headers: { 'content-type': 'application/merge-patch+json' }
    });
    return pick(body, ['metadata', 'spec', 'status']) as Item<SpecType>;
  }

  public del = async (name: string, namespace?: string): Promise<void> => {
    const resource = this.getResource(namespace);
    await resource(name).delete();
  }

  public watch = (handler: (type: string, object: any) => void, done: (err?: Error) => void) => {
    const {group, version, names: {plural}} = this.crd.spec;
    return this.watchApi.watch(`/apis/${group}/${version}/namespaces/${this.namespace}/${plural}`,
      {
        timeoutSeconds: WATCH_TIMEOUT_SECONDS
      },
      handler,
      done);
  }

  private prepareCustomObject = (
    {metadata, spec}: {metadata?: Metadata, spec: SpecType}) => {
    const {group, version, names: {kind}} = this.crd.spec;
    return {
      apiVersion: `${group}/${version}`,
      kind,
      metadata,
      spec
    };
  }

  private getResource = (namespace?: string) => {
    const {group, version, names: {plural}} = this.crd.spec;
    return this.kubeClient.apis[group][version].namespaces(namespace || this.namespace)[plural];
  }
}
