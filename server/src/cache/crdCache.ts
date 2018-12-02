import { Item } from '../crdClient/customResource';
import * as logger from '../logger';

export class CrdCache<SpecType> {
  private fetching: boolean = false;
  private fetchingPromise: Promise<Array<Item<SpecType>>>;
  private originList: () => Promise<Array<Item<SpecType>>>;
  private lastTimeFetch: number;
  private maxAge: number;
  private cached: Map<string, Item<SpecType>> = new Map();
  private resource: string;

  constructor({
    resource,
    originList
  }: {
    resource: string,
    originList: () => Promise<Array<Item<SpecType>>>
  }) {
    this.resource = resource;
    this.originList = originList;
    this.maxAge = 60000;
  }

  public get = async (name: string): Promise<Item<SpecType>> => {
    // if it's fetching, wait for it
    if (this.fetching) {
      logger.info({
        component: logger.components.crdCache,
        type: 'WAIT_FOR_FETCH',
        resource: this.resource
      });
      return this.waitForFetch(name);
    }

    // check if it's still fresh
    const duration = Date.now() - this.lastTimeFetch;
    if (duration >= this.maxAge) {
      logger.info({
        component: logger.components.crdCache,
        type: 'CACHE_NOT_FRESH',
        resource: this.resource
      });
      return this.refetch().then(() => this.fetched(name));
    }

    // return cached
    return this.fetched(name);
  }

  public refetch = async () => {
    logger.info({
      component: logger.components.crdCache,
      type: 'START_REFETCH',
      resource: this.resource
    });
    this.fetching = true;
    this.cached = new Map();
    this.fetchingPromise = this.originList();
    return this.fetchingPromise.then(items => {
      items.forEach(item => {
        this.cached.set(item.metadata.name, item);
      });
      this.lastTimeFetch = Date.now();
      this.fetching = false;
      logger.info({
        component: logger.components.crdCache,
        type: 'FIN_REFETCH',
        resource: this.resource
      });
    });
  }

  private waitForFetch = async (name: string): Promise<Item<SpecType>> => {
    if (this.fetchingPromise) {
      return this.fetchingPromise.then(() => this.fetched(name));
    }
    return this.fetched(name);
  }

  private fetched = (name: string) => {
    return this.cached.get(name);
  }
}
