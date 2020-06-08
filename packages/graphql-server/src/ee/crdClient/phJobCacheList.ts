'use strict';
import * as k8s from '@kubernetes/client-node';
import * as informer from '@kubernetes/client-node/dist/informer';
import { watch, kubeConfig, phJobCrd, PhJobSpec, PhJobStatus } from '../../crdClient/crdClientImpl';
import { Item } from '../../crdClient/customResource';
import * as logger from '../../logger';
const k8sClient = kubeConfig.makeApiClient(k8s.CustomObjectsApi);

const CHECK_DURATION = 5 * 60 * 1000; // 5 minutes to check if the cache is in-sync

export class PhJobCacheList {
  private cache: k8s.ListWatch<k8s.KubernetesObject>;
  private namespace;

  constructor(namespace: string) {
    this.cache = createCache(namespace);
    this.namespace = namespace;

    setInterval(() => {
      this.checkCacheConsistent();
    }, CHECK_DURATION);
  }

  public list = async (): Promise<Array<Item<PhJobSpec, PhJobStatus>>> => {
    return this.cache.list() as any;
  }

  // For issue: [ch10219] job list is out of sync
  private checkCacheConsistent = async () => {
    const group = phJobCrd.spec.group;
    const version = phJobCrd.spec.version;
    const plural = phJobCrd.spec.names.plural;

    try {
      const result = await k8sClient.listNamespacedCustomObject(
        group,
        version,
        this.namespace,
        phJobCrd.spec.names.plural
      );
      const items = (result.body as any).items as any[];
      const itemsCache = (await this.list());

      if (items.length !== itemsCache.length) {
        logger.error({
          component: logger.components.phJob,
          type: 'PHJOB_CACHE_INCONSISTENT',
          cacheCount: itemsCache.length,
          actualCount: items.length
        });
        // replace cache.
        this.cache = createCache(this.namespace);
      }
    } catch (error) {
      logger.error({
        component: logger.components.phJob,
        type: 'PHJOB_CACHE_CHECK',
        error
      });
    }
  }
}

function createCache(namespace: string): k8s.ListWatch<k8s.KubernetesObject> {
  const group = phJobCrd.spec.group;
  const version = phJobCrd.spec.version;
  const plural = phJobCrd.spec.names.plural;
  const listFn = () => k8sClient.listNamespacedCustomObject(
    group,
    version,
    namespace,
    phJobCrd.spec.names.plural
  )
  .catch(error => {
    logger.error({
      component: logger.components.phJob,
      type: 'PHJOB_LIST_FAILED',
      error
    });
    return {body: {items: [], metadata: {resourceVersion: '1'}}};
  }) as any;

  const path = `/apis/${group}/${version}/namespaces/${namespace}/${plural}`;

  const cache = new k8s.ListWatch(path, watch, listFn);
  cache.on(informer.ERROR, error => {
    logger.error({
      component: logger.components.phJob,
      type: 'PHJOB_WATCH_FAILED',
      error
    });
  });

  return cache;
}
