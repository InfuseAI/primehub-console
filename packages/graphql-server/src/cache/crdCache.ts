import { Item } from '../crdClient/customResourceNG';
import * as logger from '../logger';
const createEmptySpec = () => ({spec: {}, metadata: {name: 'empty'}});

const MAX_RETRY = 10;
const MAX_STALE_DURATION = 5 * 60 * 1000;

export class CrdCache<SpecType> {
  private fetching: boolean = false;
  private fetchingPromise: Promise<Array<Item<SpecType>>>;
  private originList: () => Promise<Array<Item<SpecType>>>;
  private lastTimeFetch: number;
  private maxAge: number;
  private cached: Map<string, Item<SpecType>> = new Map();
  private resource: string;
  private retryCount: number = 0;

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

    // check if it's still fresh, or is cache empty
    const duration = Date.now() - this.lastTimeFetch;
    if (this.cached.size === 0 || duration >= this.maxAge) {
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
    this.fetchingPromise = this.originList();
    return this.fetchingPromise.then(items => {
      this.retryCount = 0;
      this.cached = new Map();
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
    }).catch(error => {
      logger.info({
        component: logger.components.crdCache,
        type: 'ERR_REFETCH',
        resource: this.resource,
        error
      });

      // try too many times and data stay stale for too long
      if (this.retryCount > MAX_RETRY && Date.now() - this.lastTimeFetch >= MAX_STALE_DURATION) {
        logger.info({
          component: logger.components.crdCache,
          type: 'FAIL_REFETCH_TOO_MANY_TIMES',
          resource: this.resource,
          error
        });

        process.exit(1);
      }

      this.fetching = false;
      this.retryCount += 1;
      setTimeout(() => this.refetch(), this.retryCount * 1000);
    });
  }

  public clear = () => {
    this.cached.clear();
  }

  private waitForFetch = async (name: string): Promise<Item<SpecType>> => {
    if (this.fetchingPromise) {
      return this.fetchingPromise.then(() => this.fetched(name));
    }
    return this.fetched(name);
  }

  private fetched = (name: string) => {
    return this.cached.get(name) || createEmptySpec() as any;
  }
}
