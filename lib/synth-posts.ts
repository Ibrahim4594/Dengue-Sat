const PROXY = (process.env.EXPO_PUBLIC_AGENT_PROXY_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export async function fetchSynthPosts(district: string, city: string, count = 10) {
  const r = await fetch(`${PROXY}/api/synth/posts?district=${encodeURIComponent(district)}&city=${encodeURIComponent(city)}&n=${count}`);
  if (!r.ok) throw new Error(`synth ${r.status}`);
  return r.json();
}
