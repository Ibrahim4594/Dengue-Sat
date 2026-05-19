import { withCache } from '../../lib/cache';
import { withRetry } from '../../lib/retry';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');
  const op = url.searchParams.get('op') ?? 'nearby';
  const key = process.env.GOOGLE_MAPS_API_KEY!;

  if (!lat || !lng) return new Response(JSON.stringify({ error: 'missing lat/lng' }), { status: 400 });

  if (op === 'nearby') {
    const cacheKey = `maps:nearby:${lat}:${lng}`;
    const result = await withCache(cacheKey, 300, async () =>
      withRetry(async () => {
        const r = await fetch(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=hospital&key=${key}`,
        );
        if (!r.ok) throw new Error(`Maps ${r.status}`);
        return r.json();
      }),
    );
    return new Response(JSON.stringify({ ...result.value, _cache: { fromCache: result.fromCache, ageSeconds: result.ageSeconds } }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: `unknown op ${op}` }), { status: 400 });
}
