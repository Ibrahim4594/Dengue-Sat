import googleTrends from 'google-trends-api';
import { withCache } from '../../lib/cache';

export const config = { runtime: 'nodejs' };

export default async function handler(req: any, res: any) {
  let keyword = 'dengue Karachi';
  try {
    if (req.query?.q) keyword = String(req.query.q);
    else if (req.url) {
      const u = new URL(req.url, `http://${req.headers?.host ?? 'localhost'}`);
      keyword = u.searchParams.get('q') ?? keyword;
    }
  } catch {
    // fall back to default
  }

  const cacheKey = `trends:${keyword}`;
  try {
    const result = await withCache(cacheKey, 3600, async () => {
      const raw = await googleTrends.interestOverTime({ keyword, geo: 'PK' });
      return JSON.parse(raw);
    });
    res.status(200).json({ ...result.value, _cache: { fromCache: result.fromCache, ageSeconds: result.ageSeconds } });
  } catch (e: any) {
    res.status(500).json({ error: String(e) });
  }
}
