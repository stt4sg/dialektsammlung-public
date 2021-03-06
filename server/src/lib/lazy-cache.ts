type Fn<T, S> = (...args: S[]) => Promise<T>;
const isExpired = (at: number, timeMs: number) => Date.now() - at > timeMs;
function memoryCache<T, S>(f: Fn<T, S>, timeMs: number): Fn<T, S> {
  const caches: { [key: string]: { at?: number; promise?: Promise<T>; value?: T } } = {};
  return async (...args) => {
    const key = JSON.stringify(args);
    let cached = caches[key];
    if (cached) {
      const { at, promise, value } = cached;
      if (!isExpired(at, timeMs)) {
        return value;
      }
      if (promise) return value || promise;
    } else {
      caches[key] = cached = {};
    }
    return (cached.promise = new Promise(async resolve => {
      const hasOldCache = cached && cached.value;
      if (hasOldCache) resolve(cached.value);
      Object.assign(cached, {
        at: Date.now(),
        value: await f(...args),
        promise: null,
      });
      if (!hasOldCache) resolve(cached.value);
    }));
  };
}

/**
 * @todo investigate where this is used and if it is actually used and makes sense.
 */
export default function lazyCache<T, S>(cacheKey: string, f: Fn<T, S>, timeMs: number): Fn<T, S> {
  const m = memoryCache(f, timeMs);
  return async (...args: S[]) => m(...args);
}
