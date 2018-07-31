import { Resource } from 'kubernetes-client';
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
}

export interface Item<T> {
  metadata: Metadata;
  spec: T;
}

export default class CustomResource<SpecType = any> {
  private kubeClient: any;
  private crd: any;
  private resource: Resource;

  constructor(kubeClient: any, crd: any) {
    kubeClient.addCustomResourceDefinition(crd);
    const {group, version, names: {plural}} = crd.spec;
    this.crd = crd;
    this.kubeClient = kubeClient;
    this.resource = kubeClient.apis[group][version].namespaces('default')[plural];
  }

  public async get(name: string): Promise<Item<SpecType>> {
    const {body} = await this.resource(name).get();
    return pick(body, ['metadata', 'spec']);
  }

  public async list(): Promise<Array<Item<SpecType>>> {
    const {body} = await this.resource.get();
    return body.items.map(item => pick(item, ['metadata', 'spec']));
  }

  public async create(metadata: Metadata, spec: SpecType): Promise<Item<SpecType>> {
    const object = this.prepareCustomObject({metadata, spec});
    const {body} = await this.resource.post({body: object});
    return pick(body, ['metadata', 'spec']);
  }

  public async patch(
    name: string, {metadata, spec}: {metadata?: Metadata, spec: SpecType}): Promise<Item<SpecType>> {
    const object = this.prepareCustomObject({metadata, spec});
    const {body} = await this.resource(name).patch({
      body: object,
      headers: { 'content-type': 'application/merge-patch+json' }
    });
    return pick(body, ['metadata', 'spec']);
  }

  public async del(name: string): Promise<void> {
    await this.resource(name).delete();
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
