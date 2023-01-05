import * as k8s from '@kubernetes/client-node';
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

export default class CustomResourceNG<SpecType = any, StatusType = any> {
  private kubeClient: k8s.CustomObjectsApi;
  private watchApi: k8s.Watch;
  private crd: any;
  private namespace: string;
  private group: string;
  private version: string;
  private plural: string;
  private kind: string;

  constructor(kubeClient: any, watch: k8s.Watch, crd: any, namespace: string) {
    this.crd = crd;
    this.namespace = namespace;
    this.watchApi = watch;
    this.kubeClient = kubeClient;

    const {
      group,
      versions,
      names: { plural, kind },
    } = this.crd.spec;
    this.group = group;
    this.version = versions[0].name;
    this.plural = plural;
    this.kind = kind;
  }

  public getResourcePlural() {
    return this.crd.spec && this.crd.spec.names && this.crd.spec.names.plural;
  }

  public get = async (
    name: string,
    namespace?: string
  ): Promise<Item<SpecType, StatusType>> => {
    try {
      const res = await this.kubeClient.getNamespacedCustomObject(
        this.group,
        this.version,
        namespace || this.namespace,
        this.plural,
        name
      );
      return pick(res.body, ['metadata', 'spec', 'status']) as Item<
        SpecType,
        StatusType
      >;
    } catch (error) {
      logger.error({
        component: logger.components.internal,
        type: 'K8S_API_FAILED',
        resource: this.getResourcePlural(),
        operation: 'GET',
        name,
        error,
      });
      if (error.response?.statusCode === 404) {
        throw resourceNotFound(error);
      }
      throw apiUnavailable();
    }
  }

  public list = async (
    namespace?: string,
    qs?: Record<string, any>
  ): Promise<Array<Item<SpecType, StatusType>>> => {
    try {
      const {
        group,
        versions,
        names: { plural },
      } = this.crd.spec;
      const version = versions[0].name;
      const res = await this.kubeClient.listNamespacedCustomObject(
        group,
        version,
        namespace || this.namespace,
        plural
      );
      return (res.body as any).items.map(item =>
        pick(item, ['metadata', 'spec', 'status'])
      );
    } catch (error) {
      logger.error({
        component: logger.components.internal,
        type: 'K8S_API_FAILED',
        resource: this.getResourcePlural(),
        operation: 'LIST',
        error,
      });
      throw apiUnavailable();
    }
  }

  // tslint:disable-next-line:max-line-length
  public create = async (
    metadata: Metadata,
    spec: SpecType,
    namespace?: string
  ): Promise<Item<SpecType, StatusType>> => {
    const body = this.prepareCustomObject({ metadata, spec });
    const res = await this.kubeClient.createNamespacedCustomObject(
      this.group,
      this.version,
      namespace || this.namespace,
      this.plural,
      body
    );
    return pick(res.body, ['metadata', 'spec', 'status']) as Item<SpecType>;
  }

  public patch = async (
    name: string,
    { metadata, spec }: { metadata?: Metadata; spec: SpecType },
    namespace?: string
  ): Promise<Item<SpecType, StatusType>> => {
    const body = this.prepareCustomObject({ metadata, spec });
    // body.metadata = { name: name };
    const options = {
      headers: { 'Content-type': k8s.PatchUtils.PATCH_FORMAT_JSON_MERGE_PATCH },
    };
    const res = await this.kubeClient.patchNamespacedCustomObject(
      this.group,
      this.version,
      namespace || this.namespace,
      this.plural,
      name,
      body,
      undefined,
      undefined,
      undefined,
      options
    );
    return pick(res.body, ['metadata', 'spec', 'status']) as Item<SpecType>;
  }

  public del = async (name: string, namespace?: string): Promise<void> => {
    await this.kubeClient.deleteNamespacedCustomObject(
      this.group,
      this.version,
      namespace || this.namespace,
      this.plural,
      name
    );
  }

  public watch = (
    handler: (type: string, object: any) => void,
    done: (err?: Error) => void
  ) => {
    const {
      group,
      versions,
      names: { plural },
    } = this.crd.spec;
    const version = versions[0].name;
    return this.watchApi.watch(
      `/apis/${group}/${version}/namespaces/${this.namespace}/${plural}`,
      {
        timeoutSeconds: WATCH_TIMEOUT_SECONDS,
      },
      handler,
      done
    );
  }

  private prepareCustomObject = ({
    metadata,
    spec,
  }: {
    metadata?: Metadata;
    spec: SpecType;
  }) => {
    return {
      apiVersion: `${this.group}/${this.version}`,
      kind: this.kind,
      metadata,
      spec,
    };
  }
}
