type CacheEntry<T> = { value: T; expiresAt: number };
const store = new Map<string, CacheEntry<any>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlSeconds: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export function cacheStaleGet<T>(key: string): T | null {
  return store.get(key)?.value ?? null;
}

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<{ value: T; fromCache: boolean; ageSeconds: number }> {
  const hit = cacheGet<T>(key);
  if (hit !== null) {
    const entry = store.get(key)!;
    const ageSeconds = Math.floor((Date.now() - (entry.expiresAt - ttlSeconds * 1000)) / 1000);
    return { value: hit, fromCache: true, ageSeconds };
  }
  try {
    const value = await loader();
    cacheSet(key, value, ttlSeconds);
    return { value, fromCache: false, ageSeconds: 0 };
  } catch (err) {
    const stale = cacheStaleGet<T>(key);
    if (stale !== null) {
      const entry = store.get(key)!;
      const ageSeconds = Math.floor((Date.now() - (entry.expiresAt - ttlSeconds * 1000)) / 1000);
      return { value: stale, fromCache: true, ageSeconds };
    }
    throw err;
  }
}
