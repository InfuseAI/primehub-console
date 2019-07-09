import isPromise from 'p-is-promise';

/**
 * Types
 */
interface MemOptions {
  /**
   * Determines the cache key for storing the result based on the
   * function arguments. By default, if there's only one argument and
   * it's a primitive, it's used directly as a key, otherwise it's all
   * the function arguments JSON stringified as an array.
   *
   * You could for example change it to only cache on the first argument
   * `x => JSON.stringify(x)`.
   */
  cacheKey?: (...args: any[]) => string;
}

export type Memoize = <T extends (...args: any[]) => any>(
  f: T,
  memoizeOptions?: MemOptions
) => T;

/**
 * Implement
 */
const defaultCacheKey = (...args) => {
  if (args.length === 0) {
    return '__defaultKey';
  }

  if (args.length === 1) {
    const [firstArgument] = args;
    if (
      firstArgument === null ||
      firstArgument === undefined ||
      (typeof firstArgument !== 'function' && typeof firstArgument !== 'object')
    ) {
      return firstArgument;
    }
  }

  return JSON.stringify(args);
};

export const memoize: Memoize = (fn, options) => {
  options = {
    cacheKey: defaultCacheKey,
    ...options,
  };

  const cache = new Map();
  const setData = (key, data) => {
    cache.set(key, {
      data,
      maxAge: Date.now()
    });
  };

  const memoized = function(...args) {
    const key = options.cacheKey(...args);

    if (cache.has(key)) {
      const c = cache.get(key);

      return c.data;
    }

    const ret = fn.call(this, ...args);

    setData(key, ret);

    if (isPromise(ret)) {
      ret.catch(() => cache.delete(key));
    }

    return ret;
  };

  return memoized as any;
};
