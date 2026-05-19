import { withCache } from '../../lib/cache';
import { withRetry } from '../../lib/retry';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const path = url.searchParams.get('path');
  const base = (process.env.FIREBASE_DATABASE_URL ?? 'https://denguesa-e0371-default-rtdb.firebaseio.com').replace(/\/$/, '') + '/';

  if (!path) return new Response(JSON.stringify({ error: 'missing path' }), { status: 400 });

  const cacheKey = `fb:${path}`;
  const result = await withCache(cacheKey, 30, async () =>
    withRetry(async () => {
      const r = await fetch(`${base}${path}.json`);
      if (!r.ok) throw new Error(`Firebase ${r.status}`);
      return r.json();
    }),
  );

  return new Response(JSON.stringify({ data: result.value, _cache: { fromCache: result.fromCache, ageSeconds: result.ageSeconds } }), {
    headers: { 'content-type': 'application/json' },
  });
}
