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
  private resource: Resource;
  private namespace: string;

  constructor(kubeClient: any, watch: Watch, crd: any, namespace: string) {
    kubeClient.addCustomResourceDefinition(crd);
    const {group, version, names: {plural}} = crd.spec;
    this.crd = crd;
    this.namespace = namespace;
    this.watchApi = watch;
    this.kubeClient = kubeClient;
    this.resource = kubeClient.apis[group][version].namespaces(namespace)[plural];
  }

  public getResourcePlural() {
    return this.crd.spec && this.crd.spec.names && this.crd.spec.names.plural;
  }

  public get = async (name: string): Promise<Item<SpecType, StatusType>> => {
    const {body} = await this.resource(name).get();
    return pick(body, ['metadata', 'spec', 'status']) as Item<SpecType, StatusType>;
  }

  public list = async (qs?: any): Promise<Array<Item<SpecType, StatusType>>> => {
    const {body} = await this.resource.get({qs});
    return body.items.map(item => pick(item, ['metadata', 'spec', 'status']));
  }

  public async create(metadata: Metadata, spec: SpecType): Promise<Item<SpecType, StatusType>> {
    const object = this.prepareCustomObject({metadata, spec});
    const {body} = await this.resource.post({body: object});
    return pick(body, ['metadata', 'spec', 'status']) as Item<SpecType>;
  }

  public async patch(
    name: string, {metadata, spec}: {metadata?: Metadata, spec: SpecType}): Promise<Item<SpecType, StatusType>> {
    const object = this.prepareCustomObject({metadata, spec});
    const {body} = await this.resource(name).patch({
      body: object,
      headers: { 'content-type': 'application/merge-patch+json' }
    });
    return pick(body, ['metadata', 'spec', 'status']) as Item<SpecType>;
  }

  public async del(name: string): Promise<void> {
    await this.resource(name).delete();
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
}
