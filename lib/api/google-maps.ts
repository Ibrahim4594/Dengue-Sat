const PROXY = (process.env.EXPO_PUBLIC_AGENT_PROXY_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export async function fetchNearbyHospitals(lat: number, lng: number) {
  const r = await fetch(`${PROXY}/api/data/maps?lat=${lat}&lng=${lng}&op=nearby`);
  if (!r.ok) throw new Error(`maps ${r.status}`);
  return r.json();
}
