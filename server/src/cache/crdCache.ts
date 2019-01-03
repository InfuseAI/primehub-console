import { Item } from '../crdClient/customResource';
import * as logger from '../logger';
import { isNil } from 'lodash';
const createEmptySpec = () => ({spec: {}, metadata: {name: 'empty'}});

export class CrdCache<SpecType> {
  private fetching: boolean = false;
  private fetchingPromise: Promise<Array<Item<SpecType>>>;
  private originList: () => Promise<Array<Item<SpecType>>>;
  private lastTimeFetch: number;
  private maxAge: number;
  private cached: Map<string, Item<SpecType>> = new Map();
  private items: Array<Item<SpecType>> = [];
  private resource: string;
  private returnNullIfNotFound: boolean;

  constructor({
    resource,
    originList,
    returnNullIfNotFound
  }: {
    resource: string,
    originList: () => Promise<Array<Item<SpecType>>>,
    returnNullIfNotFound?: boolean
  }) {
    this.resource = resource;
    this.originList = originList;
    this.maxAge = 60000;
    this.returnNullIfNotFound = isNil(returnNullIfNotFound) ? false : returnNullIfNotFound;
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

  public list = async (): Promise<Array<Item<SpecType>>> => {
    // if it's fetching, wait for it
    if (this.fetching) {
      logger.info({
        component: logger.components.crdCache,
        type: 'WAIT_FOR_FETCH_LIST',
        resource: this.resource
      });
      return this.fetchingPromise.then(() => this.items);
    }

    // check if it's still fresh, or is cache empty
    const duration = Date.now() - this.lastTimeFetch;
    if (this.cached.size === 0 || duration >= this.maxAge) {
      logger.info({
        component: logger.components.crdCache,
        type: 'CACHE_NOT_FRESH',
        resource: this.resource
      });
      return this.refetch().then(() => this.items);
    }

    // return cached
    return this.items;
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
      this.items = items;
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
    if (this.cached.get(name)) {
      return this.cached.get(name);
    }
    return this.returnNullIfNotFound ? null : createEmptySpec() as any;
  }
}
