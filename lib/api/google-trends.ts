const PROXY = (process.env.EXPO_PUBLIC_AGENT_PROXY_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export async function fetchTrends(keyword: string) {
  const r = await fetch(`${PROXY}/api/data/trends?q=${encodeURIComponent(keyword)}`);
  if (!r.ok) throw new Error(`trends ${r.status}`);
  return r.json();
}
