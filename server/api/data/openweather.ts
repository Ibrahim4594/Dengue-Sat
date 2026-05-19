import { withCache } from '../../lib/cache';
import { withRetry } from '../../lib/retry';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');
  const key = process.env.OPENWEATHER_API_KEY;

  if (!lat || !lng) return new Response(JSON.stringify({ error: 'missing lat/lng' }), { status: 400 });
  if (!key) return new Response(JSON.stringify({ error: 'no key' }), { status: 500 });

  const cacheKey = `ow:${lat}:${lng}`;
  const result = await withCache(cacheKey, 600, async () => {
    return withRetry(async () => {
      const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${key}&units=metric`);
      if (!r.ok) throw new Error(`OW ${r.status}`);
      return r.json();
    });
  });

  return new Response(
    JSON.stringify({ ...result.value, _cache: { fromCache: result.fromCache, ageSeconds: result.ageSeconds } }),
    { headers: { 'content-type': 'application/json' } },
  );
}
