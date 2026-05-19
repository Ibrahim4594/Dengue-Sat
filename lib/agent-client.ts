const PROXY_URL = (process.env.EXPO_PUBLIC_AGENT_PROXY_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export async function callAgentTool(name: string, input: any) {
  const r = await fetch(`${PROXY_URL}/api/agent/tool/${name}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ input }),
  });
  if (!r.ok) throw new Error(`tool ${name} failed: ${r.status}`);
  return r.json();
}

export async function callVision(imageBase64: string, text: string, location: any) {
  const r = await fetch(`${PROXY_URL}/api/vision`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ imageBase64, text, location }),
  });
  if (!r.ok) throw new Error(`vision failed: ${r.status}`);
  return r.json();
}

const STALL_TIMEOUT_MS = 90_000;

export async function* orchestrateStream(payload: { runId: string; location: any; prefetchedData: any }) {
  const ac = new AbortController();
  const r = await fetch(`${PROXY_URL}/api/agent/orchestrate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal: ac.signal,
  });
  if (!r.ok) {
    const errText = await r.text().catch(() => '');
    throw new Error(`orchestrate ${r.status}: ${errText.slice(0, 200)}`);
  }
  // Some platforms (RN polyfill, some CDNs) return ok=true but body=null for non-streaming responses.
  // Or server emitted full JSON instead of SSE (final summary as single doc). Fallback gracefully.
  const ct = r.headers.get('content-type') ?? '';
  if (!r.body || !ct.includes('event-stream')) {
    const txt = await r.text().catch(() => '');
    if (txt.trim().startsWith('data:')) {
      // Server returned SSE as single buffered text. Parse offline.
      for (const line of txt.split('\n\n')) {
        if (line.startsWith(':') || !line.startsWith('data: ')) continue;
        try { yield JSON.parse(line.slice(6)); } catch (e) { console.warn('[SSE] offline parse', e); }
      }
      return;
    }
    try {
      const parsed = JSON.parse(txt);
      yield { type: 'master.done', finalText: parsed?.finalText ?? parsed?.text ?? txt, timestamp: Date.now() };
    } catch {
      yield { type: 'master.done', finalText: txt.slice(0, 500) || 'Empty response body', timestamp: Date.now() };
    }
    return;
  }
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const readWithStallGuard = async (): Promise<ReadableStreamReadResult<Uint8Array>> => {
    let stallTimer: any;
    const stall = new Promise<never>((_, reject) => {
      stallTimer = setTimeout(() => {
        try { ac.abort(); } catch {}
        reject(new Error('SSE stalled — no data for 90s. Proxy likely crashed. Restart vercel dev.'));
      }, STALL_TIMEOUT_MS);
    });
    try {
      return await Promise.race([reader.read(), stall]);
    } finally {
      clearTimeout(stallTimer);
    }
  };

  while (true) {
    const { value, done } = await readWithStallGuard();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith(':')) continue; // keepalive ping
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6);
      try {
        yield JSON.parse(json);
      } catch (e) {
        console.warn('[SSE] parse error', json.slice(0, 80), e);
      }
    }
  }
}
