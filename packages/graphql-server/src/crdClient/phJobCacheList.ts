import * as k8s from '@kubernetes/client-node';
import { watch, kubeConfig, phJobCrd, PhJobSpec, PhJobStatus } from './crdClientImpl';
import { Item } from './customResource';
const k8sClient = kubeConfig.makeApiClient(k8s.CustomObjectsApi);

export class PhJobCacheList {
  private cache: k8s.ListWatch<k8s.KubernetesObject>;

  constructor(namespace: string) {
    const group = phJobCrd.spec.group;
    const version = phJobCrd.spec.version;
    const plural = phJobCrd.spec.names.plural;
    const listFn = () => k8sClient.listNamespacedCustomObject(
      group,
      version,
      namespace,
      phJobCrd.spec.names.plural
    ) as any;

    const path = `/apis/${group}/${version}/namespaces/${namespace}/${plural}`;

    this.cache = new k8s.ListWatch(path, watch, listFn);
  }

  public list = async (): Promise<Array<Item<PhJobSpec, PhJobStatus>>> => {
    return this.cache.list() as any;
  }
}
