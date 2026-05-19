const PROXY = (process.env.EXPO_PUBLIC_AGENT_PROXY_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export async function fetchHospitals(cityId: string) {
  const r = await fetch(`${PROXY}/api/data/firebase?path=hospitals/${cityId}`);
  if (!r.ok) throw new Error(`fb ${r.status}`);
  const body = await r.json().catch(() => ({}));
  const data = (body && body.data) ?? null;
  if (!data) {
    console.warn('[firebase-rtdb] missing data key for', cityId, body);
    return [];
  }
  return Array.isArray(data) ? data : Object.values(data);
}
