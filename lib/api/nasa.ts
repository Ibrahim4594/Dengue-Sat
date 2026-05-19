const PROXY = (process.env.EXPO_PUBLIC_AGENT_PROXY_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export async function fetchNasaClimate(lat: number, lng: number) {
  const r = await fetch(`${PROXY}/api/data/nasa?lat=${lat}&lng=${lng}`);
  if (!r.ok) throw new Error(`nasa ${r.status}`);
  return r.json();
}
