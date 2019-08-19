import { Resource } from 'kubernetes-client';
import { Watch } from '@kubernetes/client-node';
import { pick } from 'lodash';

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
}

export interface Item<T> {
  metadata: Metadata;
  spec: T;
}

// constants
// WATCH_TIMEOUT_SECONDS: 10 minutes
const WATCH_TIMEOUT_SECONDS = 60 * 10;

export default class CustomResource<SpecType = any> {
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

  public get = async (name: string, namespace?: string): Promise<Item<SpecType>> => {
    const resource = this.getResource(namespace);
    const {body} = await resource(name).get();
    return pick(body, ['metadata', 'spec']) as Item<SpecType>;
  }

  public list = async (namespace?: string): Promise<Array<Item<SpecType>>> => {
    const resource = this.getResource(namespace);
    const {body} = await resource.get();
    return body.items.map(item => pick(item, ['metadata', 'spec']));
  }

  public async create(metadata: Metadata, spec: SpecType, namespace?: string): Promise<Item<SpecType>> {
    const resource = this.getResource(namespace);
    const object = this.prepareCustomObject({metadata, spec});
    const {body} = await resource.post({body: object});
    return pick(body, ['metadata', 'spec']) as Item<SpecType>;
  }

  public async patch(
    name: string, {metadata, spec}: {metadata?: Metadata, spec: SpecType},
    namespace?: string
  ): Promise<Item<SpecType>> {
    const resource = this.getResource(namespace);
    const object = this.prepareCustomObject({metadata, spec});
    const {body} = await resource(name).patch({
      body: object,
      headers: { 'content-type': 'application/merge-patch+json' }
    });
    return pick(body, ['metadata', 'spec']) as Item<SpecType>;
  }

  public async del(name: string, namespace?: string): Promise<void> {
    const resource = this.getResource(namespace);
    await resource(name).delete();
  }

  public watch(handler: (type: string, object: any) => void, done: (err?: Error) => void) {
    const {group, version, names: {plural}} = this.crd.spec;
    return this.watchApi.watch(`/apis/${group}/${version}/namespaces/${this.namespace}/${plural}`,
      {
        timeoutSeconds: WATCH_TIMEOUT_SECONDS
      },
      handler,
      done);
  }

  private prepareCustomObject({metadata, spec}: {metadata?: Metadata, spec: SpecType}) {
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
