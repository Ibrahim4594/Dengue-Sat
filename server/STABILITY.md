# Local Server Stability

## Why vercel dev crashes on Windows

The edge runtime in `vercel dev` triggers a libuv assertion (`UV_HANDLE_CLOSING`, `src/win/async.c:76`) during long SSE streams on Windows. This is a known issue with how Node + libuv handle stream close events on Windows pipes. The function still works but the process exits, breaking subsequent requests.

## Layered defenses (now in place)

1. **`server/supervise-vercel.js`** — supervisor that relaunches `vercel dev` within 2s on crash. Use instead of running `vercel dev` directly:

   ```bash
   cd server
   node supervise-vercel.js
   ```

   Caps at 10 restarts per minute then bails (prevents tight crash loop).

2. **Keepalive ping in `orchestrate.ts`** — emits `: ping <ts>` SSE comment every 10s. Keeps the libuv socket flushing, reduces idle-close crashes.

3. **Client stall guard in `claude-client.ts`** — `orchestrateStream` aborts if no chunk arrives for 45s and throws a clear error. UI surfaces "stream stalled" instead of infinite spinner.

4. **Pipeline hard cap in `antigravity.ts`** — `runFullPipeline` wrapped in 240s `Promise.race`. Any still-`processing` agents flip to `error` in `finally`. State always recovers.

## Production deploy (permanent fix)

Deploy to Vercel prod. Edge runtime is stable there because it runs on V8 isolates without Windows libuv path:

```bash
cd server
vercel deploy --prod
```

Take the returned URL and set in repo root `.env`:

```
EXPO_PUBLIC_AGENT_PROXY_URL=https://your-deployment.vercel.app
```

Then rebuild the app (`npx expo run:android`). All proxy traffic now hits cloud edge — zero local crash risk.

## When to use which

| Scenario | Use |
|----------|-----|
| Active local dev / debugging | `node supervise-vercel.js` |
| Demo recording, hackathon submission, judging | `vercel deploy --prod` + update `.env` |
| Quick smoke test | `vercel dev` directly (will crash on long runs) |
