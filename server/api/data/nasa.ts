import { withCache } from '../../lib/cache';
import { withRetry } from '../../lib/retry';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');

  if (!lat || !lng) return new Response(JSON.stringify({ error: 'missing lat/lng' }), { status: 400 });

  const end = new Date();
  const start = new Date(end.getTime() - 7 * 86400000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');

  const cacheKey = `nasa:${lat}:${lng}:${fmt(end)}`;
  const result = await withCache(cacheKey, 86400, async () => {
    const apiUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,RH2M,PRECTOTCORR,WS2M&community=AG&longitude=${lng}&latitude=${lat}&start=${fmt(start)}&end=${fmt(end)}&format=JSON`;
    return withRetry(async () => {
      const r = await fetch(apiUrl);
      if (!r.ok) throw new Error(`NASA ${r.status}`);
      return r.json();
    });
  });

  return new Response(
    JSON.stringify({ ...result.value, _cache: { fromCache: result.fromCache, ageSeconds: result.ageSeconds } }),
    { headers: { 'content-type': 'application/json' } },
  );
}
