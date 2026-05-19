const PROXY = (process.env.EXPO_PUBLIC_AGENT_PROXY_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export async function fetchOpenWeather(lat: number, lng: number) {
  const r = await fetch(`${PROXY}/api/data/openweather?lat=${lat}&lng=${lng}`);
  if (!r.ok) throw new Error(`ow ${r.status}`);
  return r.json();
}
