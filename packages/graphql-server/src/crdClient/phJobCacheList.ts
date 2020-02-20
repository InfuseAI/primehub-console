import * as k8s from '@kubernetes/client-node';
import { ERROR } from '@kubernetes/client-node/dist/informer';
import { watch, kubeConfig, phJobCrd, PhJobSpec, PhJobStatus } from './crdClientImpl';
import { Item } from './customResource';
import * as logger from '../logger';
import BPromise from 'bluebird';
const k8sClient = kubeConfig.makeApiClient(k8s.CustomObjectsApi);

const RETRY_LIMIT = 10;

export class PhJobCacheList {
  private cache: k8s.ListWatch<k8s.KubernetesObject>;
  private retryCount: number = 0;

  constructor(namespace: string) {
    const group = phJobCrd.spec.group;
    const version = phJobCrd.spec.version;
    const plural = phJobCrd.spec.names.plural;
    const listFn = () => k8sClient.listNamespacedCustomObject(
      group,
      version,
      namespace,
      phJobCrd.spec.names.plural
    )
    .then(list => {
      this.retryCount = 0;
      return list;
    })
    .catch(error => {
      logger.error({
        component: logger.components.phJob,
        type: 'PHJOB_LIST_FAILED',
        error
      });

      return {body: {items: [], metadata: {resourceVersion: '1'}}};
    }) as any;

    const path = `/apis/${group}/${version}/namespaces/${namespace}/${plural}`;

    this.cache = new k8s.ListWatch(path, watch, listFn);
    // this.cache.start().catch(this.handleWatchError);
    this.cache.on(ERROR, this.handleWatchError);
  }

  public list = async (): Promise<Array<Item<PhJobSpec, PhJobStatus>>> => {
    return this.cache.list() as any;
  }

  private handleWatchError = error => {
    logger.error({
      component: logger.components.phJob,
      type: 'PHJOB_WATCH_FAILED',
      error
    });

    this.retryWatch();
  }

  private retryWatch = () => {
    if (this.retryCount > RETRY_LIMIT) {
      logger.error({
        component: logger.components.phJob,
        type: 'PHJOB_WATCH_RETRY_STOP',
        message: `Retry phjob watch over ${RETRY_LIMIT} times. stop trying.`
      });
      return;
    }

    logger.error({
      component: logger.components.phJob,
      type: 'PHJOB_WATCH_RETRY'
    });

    this.retryCount += 1;
    return BPromise.delay(this.retryCount * 1000)
      .then(() => this.cache.start());
  }
}
