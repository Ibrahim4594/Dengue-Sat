# DengueSat MAX-POWER Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor DengueSat from fake-agentic state machine into real Claude-powered multi-agent CIRO system orchestrated via Antigravity pattern, deployed as Android Expo app with Vercel Edge proxy backend.

**Architecture:** Mobile app (RN/Expo Android) calls Vercel Edge Function proxy (holds `ANTHROPIC_API_KEY`). Proxy runs Master Coordinator Claude agent (Sonnet 4.6 + extended thinking) that calls 8 sub-agents as tools (signal_fuse, outbreak_eye, severity_mind, resource_forge, crisis_sim, recovery_guard, trend_spy, citizen_signal). Trace events stream back via SSE to RN Zustand store. External APIs (NASA POWER, OpenWeather, Google Maps, Firebase RTDB, Google Trends, Claude Vision) all proxied for caching + rate limiting.

**Tech Stack:** React Native 0.81, Expo 54, Expo Router 6, TypeScript 5.9, Zustand 5, Anthropic SDK 0.27+, Vercel Edge Runtime, Firebase 12 (RTDB + Firestore), expo-camera, expo-speech, expo-image-picker, Zod, Vitest.

---

## Phase 0 — Security & Project Init

### Task 0.1: Rotate compromised Claude API key

**Files:**
- Modify: `denguesat-ciro/.env`

- [ ] **Step 1: User manual action**

Open browser → https://console.anthropic.com/settings/keys → revoke key starting with `sk-ant-api03-<REDACTED>`. Generate new key.

- [ ] **Step 2: Create `.env.local` in project root**

Create file `denguesat-ciro/.env.local` (gitignored) with:

```
# NEW Claude key (from console after rotation)
ANTHROPIC_API_KEY=sk-ant-api03-<NEW-KEY-PASTED-HERE>
```

- [ ] **Step 3: Update `.gitignore`**

Modify `denguesat-ciro/.gitignore` — append at end:

```
# Local secrets
.env.local
server/.env.local

# Brainstorm artifacts
.superpowers/

# Submission build artifacts
submission/
*.apk
```

- [ ] **Step 4: Manual verify**

Run: `cat denguesat-ciro/.gitignore | grep ".env.local"`
Expected: `.env.local` line present.

---

### Task 0.2: Initialize git repository

**Files:**
- Create: `denguesat-ciro/.git/`

- [ ] **Step 1: Init git**

Run: `cd denguesat-ciro && git init && git add . && git commit -m "chore: initial scaffold checkpoint"`
Expected: Initial commit created (excludes .env.local, .superpowers/ via gitignore).

- [ ] **Step 2: Verify clean state**

Run: `git status`
Expected: `nothing to commit, working tree clean`.

---

### Task 0.3: Vercel project bootstrap

**Files:**
- Create: `denguesat-ciro/server/`

- [ ] **Step 1: Install Vercel CLI globally**

Run: `npm install -g vercel`

- [ ] **Step 2: Create server directory**

Run: `cd denguesat-ciro && mkdir server && cd server`

- [ ] **Step 3: Initialize npm package**

Run: `npm init -y`

- [ ] **Step 4: Install backend deps**

Run: `npm install @anthropic-ai/sdk@^0.27.0 zod@^3.23.0`

- [ ] **Step 5: Create `server/package.json` script**

Edit `denguesat-ciro/server/package.json` `scripts`:

```json
{
  "scripts": {
    "dev": "vercel dev",
    "deploy": "vercel deploy",
    "deploy:prod": "vercel deploy --prod"
  }
}
```

- [ ] **Step 6: Login to Vercel**

Run: `vercel login` (user clicks email link).

- [ ] **Step 7: Link project**

Run: `cd denguesat-ciro/server && vercel link`
Choose: create new project named `denguesat-ciro-proxy`.

- [ ] **Step 8: Set env var on Vercel**

Run: `vercel env add ANTHROPIC_API_KEY` → paste NEW key → select all environments.

- [ ] **Step 9: Commit**

```bash
git add denguesat-ciro/server/package.json denguesat-ciro/server/.vercel
git commit -m "chore: bootstrap Vercel proxy project"
```

---

### Task 0.4: Vercel config + env template

**Files:**
- Create: `denguesat-ciro/server/vercel.json`
- Create: `denguesat-ciro/server/.env.example`

- [ ] **Step 1: Write `vercel.json`**

```json
{
  "version": 2,
  "regions": ["sfo1"],
  "functions": {
    "api/**/*.ts": {
      "runtime": "edge",
      "maxDuration": 60
    }
  }
}
```

- [ ] **Step 2: Write `server/.env.example`**

```
ANTHROPIC_API_KEY=sk-ant-api03-xxx
OPENWEATHER_API_KEY=xxx
GOOGLE_MAPS_API_KEY=xxx
FIREBASE_DATABASE_URL=https://xxx.firebaseio.com/
```

- [ ] **Step 3: Commit**

```bash
git add denguesat-ciro/server/vercel.json denguesat-ciro/server/.env.example
git commit -m "chore: add Vercel config + env template"
```

---

## Phase 1 — Backend Claude client foundation

### Task 1.1: Shared Claude client (`server/lib/claude.ts`)

**Files:**
- Create: `denguesat-ciro/server/lib/claude.ts`

- [ ] **Step 1: Write Claude client wrapper**

```typescript
// server/lib/claude.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export type ModelId = 'claude-sonnet-4-6' | 'claude-haiku-4-5-20251001';

export interface CallOpts {
  system: string;
  messages: Anthropic.MessageParam[];
  model?: ModelId;
  maxTokens?: number;
  thinking?: { type: 'enabled'; budget_tokens: number };
  tools?: Anthropic.Tool[];
  cacheSystem?: boolean;
}

export interface CallResult {
  text: string;
  toolUses: Array<{ id: string; name: string; input: any }>;
  stopReason: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    costUSD: number;
  };
  raw: Anthropic.Message;
}

const PRICING: Record<ModelId, { in: number; out: number; cacheRead: number; cacheWrite: number }> = {
  'claude-sonnet-4-6': { in: 3, out: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-haiku-4-5-20251001': { in: 1, out: 5, cacheRead: 0.1, cacheWrite: 1.25 },
};

export async function callClaude(opts: CallOpts): Promise<CallResult> {
  const model = opts.model ?? 'claude-sonnet-4-6';
  const systemBlocks = opts.cacheSystem
    ? [{ type: 'text' as const, text: opts.system, cache_control: { type: 'ephemeral' as const } }]
    : opts.system;

  const msg = await client.messages.create({
    model,
    max_tokens: opts.maxTokens ?? 4096,
    system: systemBlocks as any,
    messages: opts.messages,
    ...(opts.thinking ? { thinking: opts.thinking } : {}),
    ...(opts.tools ? { tools: opts.tools } : {}),
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('\n');

  const toolUses = msg.content
    .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    .map(b => ({ id: b.id, name: b.name, input: b.input }));

  const pricing = PRICING[model];
  const u = msg.usage;
  const cacheRead = (u as any).cache_read_input_tokens ?? 0;
  const cacheWrite = (u as any).cache_creation_input_tokens ?? 0;
  const costUSD =
    (u.input_tokens * pricing.in +
      u.output_tokens * pricing.out +
      cacheRead * pricing.cacheRead +
      cacheWrite * pricing.cacheWrite) /
    1_000_000;

  return {
    text,
    toolUses,
    stopReason: msg.stop_reason ?? 'unknown',
    usage: {
      inputTokens: u.input_tokens,
      outputTokens: u.output_tokens,
      cacheReadTokens: cacheRead,
      cacheWriteTokens: cacheWrite,
      costUSD,
    },
    raw: msg,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/server/lib/claude.ts
git commit -m "feat(server): add Claude client wrapper with cost tracking"
```

---

### Task 1.2: Cache utility (`server/lib/cache.ts`)

**Files:**
- Create: `denguesat-ciro/server/lib/cache.ts`

- [ ] **Step 1: Write in-memory cache (Edge runtime, KV optional later)**

```typescript
// server/lib/cache.ts
type CacheEntry<T> = { value: T; expiresAt: number };
const store = new Map<string, CacheEntry<any>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlSeconds: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export function cacheStaleGet<T>(key: string): T | null {
  return store.get(key)?.value ?? null;
}

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<{ value: T; fromCache: boolean; ageSeconds: number }> {
  const hit = cacheGet<T>(key);
  if (hit !== null) {
    const entry = store.get(key)!;
    const ageSeconds = Math.floor((Date.now() - (entry.expiresAt - ttlSeconds * 1000)) / 1000);
    return { value: hit, fromCache: true, ageSeconds };
  }
  try {
    const value = await loader();
    cacheSet(key, value, ttlSeconds);
    return { value, fromCache: false, ageSeconds: 0 };
  } catch (err) {
    const stale = cacheStaleGet<T>(key);
    if (stale !== null) {
      const entry = store.get(key)!;
      const ageSeconds = Math.floor((Date.now() - (entry.expiresAt - ttlSeconds * 1000)) / 1000);
      return { value: stale, fromCache: true, ageSeconds };
    }
    throw err;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/server/lib/cache.ts
git commit -m "feat(server): add cache utility with stale-on-error fallback"
```

---

### Task 1.3: Retry utility (`server/lib/retry.ts`)

**Files:**
- Create: `denguesat-ciro/server/lib/retry.ts`

- [ ] **Step 1: Write retry helper**

```typescript
// server/lib/retry.ts
export interface RetryOpts {
  attempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOpts = {},
): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const initial = opts.initialDelayMs ?? 500;
  const max = opts.maxDelayMs ?? 5000;
  const timeoutMs = opts.timeoutMs ?? 10000;

  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
      ]);
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1) break;
      const delay = Math.min(initial * Math.pow(2, i), max);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/server/lib/retry.ts
git commit -m "feat(server): add retry utility with exp backoff + timeout"
```

---

## Phase 2 — External API proxies

### Task 2.1: NASA POWER proxy (`server/api/data/nasa.ts`)

**Files:**
- Create: `denguesat-ciro/server/api/data/nasa.ts`

- [ ] **Step 1: Write Edge function**

```typescript
// server/api/data/nasa.ts
import { withCache } from '../../lib/cache';
import { withRetry } from '../../lib/retry';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');

  if (!lat || !lng) {
    return new Response(JSON.stringify({ error: 'missing lat/lng' }), { status: 400 });
  }

  const end = new Date();
  const start = new Date(end.getTime() - 7 * 86400000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');

  const cacheKey = `nasa:${lat}:${lng}:${fmt(end)}`;
  const result = await withCache(cacheKey, 86400, async () => {
    const apiUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,RH2M,PRECTOTCORR,WS2M&community=AG&longitude=${lng}&latitude=${lat}&start=${fmt(start)}&end=${fmt(end)}&format=JSON`;
    return withRetry(async () => {
      const r = await fetch(apiUrl);
      if (!r.ok) throw new Error(`NASA ${r.status}`);
      return r.json();
    });
  });

  return new Response(
    JSON.stringify({ ...result.value, _cache: { fromCache: result.fromCache, ageSeconds: result.ageSeconds } }),
    { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=3600' } },
  );
}
```

- [ ] **Step 2: Local test**

Run: `cd denguesat-ciro/server && vercel dev`
In another shell: `curl "http://localhost:3000/api/data/nasa?lat=24.86&lng=67.01"`
Expected: JSON with `properties.parameter.T2M` values.

- [ ] **Step 3: Commit**

```bash
git add denguesat-ciro/server/api/data/nasa.ts
git commit -m "feat(server): NASA POWER proxy with 24h cache"
```

---

### Task 2.2: OpenWeather proxy (`server/api/data/openweather.ts`)

**Files:**
- Create: `denguesat-ciro/server/api/data/openweather.ts`

- [ ] **Step 1: Add env var to Vercel**

Run: `vercel env add OPENWEATHER_API_KEY` → paste `<OPENWEATHER_API_KEY>` → all environments.

- [ ] **Step 2: Write Edge function**

```typescript
// server/api/data/openweather.ts
import { withCache } from '../../lib/cache';
import { withRetry } from '../../lib/retry';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');
  const key = process.env.OPENWEATHER_API_KEY;

  if (!lat || !lng) return new Response(JSON.stringify({ error: 'missing lat/lng' }), { status: 400 });
  if (!key) return new Response(JSON.stringify({ error: 'no key' }), { status: 500 });

  const cacheKey = `ow:${lat}:${lng}`;
  const result = await withCache(cacheKey, 600, async () => {
    return withRetry(async () => {
      const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${key}&units=metric`);
      if (!r.ok) throw new Error(`OW ${r.status}`);
      return r.json();
    });
  });

  return new Response(
    JSON.stringify({ ...result.value, _cache: { fromCache: result.fromCache, ageSeconds: result.ageSeconds } }),
    { headers: { 'content-type': 'application/json' } },
  );
}
```

- [ ] **Step 3: Local test**

Run: `curl "http://localhost:3000/api/data/openweather?lat=24.86&lng=67.01"`
Expected: JSON with `main.temp`, `main.humidity`.

- [ ] **Step 4: Commit**

```bash
git add denguesat-ciro/server/api/data/openweather.ts
git commit -m "feat(server): OpenWeather proxy with 10min cache"
```

---

### Task 2.3: Google Maps proxy (`server/api/data/maps.ts`)

**Files:**
- Create: `denguesat-ciro/server/api/data/maps.ts`

- [ ] **Step 1: Add env var**

Run: `vercel env add GOOGLE_MAPS_API_KEY` → paste `<GOOGLE_MAPS_API_KEY>` → all environments.

- [ ] **Step 2: Write proxy**

```typescript
// server/api/data/maps.ts
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
```

- [ ] **Step 3: Local test**

Run: `curl "http://localhost:3000/api/data/maps?lat=24.86&lng=67.01&op=nearby"`
Expected: JSON with `results` array of hospitals.

- [ ] **Step 4: Commit**

```bash
git add denguesat-ciro/server/api/data/maps.ts
git commit -m "feat(server): Google Maps nearby hospitals proxy"
```

---

### Task 2.4: Firebase RTDB read proxy (`server/api/data/firebase.ts`)

**Files:**
- Create: `denguesat-ciro/server/api/data/firebase.ts`

- [ ] **Step 1: Add env var**

Run: `vercel env add FIREBASE_DATABASE_URL` → paste `https://denguesa-e0371-default-rtdb.firebaseio.com/` → all environments.

- [ ] **Step 2: Write proxy**

```typescript
// server/api/data/firebase.ts
import { withCache } from '../../lib/cache';
import { withRetry } from '../../lib/retry';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const path = url.searchParams.get('path');
  const base = process.env.FIREBASE_DATABASE_URL!;

  if (!path) return new Response(JSON.stringify({ error: 'missing path' }), { status: 400 });

  const cacheKey = `fb:${path}`;
  const result = await withCache(cacheKey, 30, async () =>
    withRetry(async () => {
      const r = await fetch(`${base}${path}.json`);
      if (!r.ok) throw new Error(`Firebase ${r.status}`);
      return r.json();
    }),
  );

  return new Response(JSON.stringify({ data: result.value, _cache: { fromCache: result.fromCache, ageSeconds: result.ageSeconds } }), {
    headers: { 'content-type': 'application/json' },
  });
}
```

- [ ] **Step 3: Seed mock hospital data**

User manual action: open Firebase Console → Realtime Database → import JSON:

```json
{
  "hospitals": {
    "karachi": {
      "jinnah": { "name": "Jinnah Hospital", "lat": 24.8924, "lng": 67.0731, "totalBeds": 1200, "occupiedBeds": 1068, "platelets": 320, "dengueAdmissions24h": 47 },
      "civil": { "name": "Civil Hospital", "lat": 24.8607, "lng": 67.0011, "totalBeds": 900, "occupiedBeds": 801, "platelets": 240, "dengueAdmissions24h": 35 }
    },
    "lahore": {
      "mayo": { "name": "Mayo Hospital", "lat": 31.5832, "lng": 74.3245, "totalBeds": 1500, "occupiedBeds": 1290, "platelets": 410, "dengueAdmissions24h": 28 }
    }
  }
}
```

- [ ] **Step 4: Local test**

Run: `curl "http://localhost:3000/api/data/firebase?path=hospitals/karachi"`
Expected: JSON with hospital data.

- [ ] **Step 5: Commit**

```bash
git add denguesat-ciro/server/api/data/firebase.ts
git commit -m "feat(server): Firebase RTDB read proxy"
```

---

### Task 2.5: Google Trends proxy (`server/api/data/trends.ts`)

**Files:**
- Create: `denguesat-ciro/server/api/data/trends.ts`

- [ ] **Step 1: Install google-trends-api in server**

Run: `cd denguesat-ciro/server && npm install google-trends-api@^4.9.2`

- [ ] **Step 2: Write proxy (NOTE: Edge runtime doesn't support node-only modules; use Node.js runtime here)**

```typescript
// server/api/data/trends.ts
import googleTrends from 'google-trends-api';
import { withCache } from '../../lib/cache';

export const config = { runtime: 'nodejs' };

export default async function handler(req: any, res: any) {
  const keyword = req.query.q ?? 'dengue Karachi';
  const cacheKey = `trends:${keyword}`;
  const result = await withCache(cacheKey, 3600, async () => {
    const raw = await googleTrends.interestOverTime({ keyword, geo: 'PK' });
    return JSON.parse(raw);
  });
  res.status(200).json({ ...result.value, _cache: { fromCache: result.fromCache, ageSeconds: result.ageSeconds } });
}
```

- [ ] **Step 3: Local test**

Run: `curl "http://localhost:3000/api/data/trends?q=dengue%20Karachi"`
Expected: JSON with `default.timelineData`.

- [ ] **Step 4: Commit**

```bash
git add denguesat-ciro/server/api/data/trends.ts denguesat-ciro/server/package.json
git commit -m "feat(server): Google Trends proxy"
```

---

### Task 2.6: Synth posts via Haiku (`server/api/synth/posts.ts`)

**Files:**
- Create: `denguesat-ciro/server/api/synth/posts.ts`

- [ ] **Step 1: Write Edge function**

```typescript
// server/api/synth/posts.ts
import { callClaude } from '../../lib/claude';
import { z } from 'zod';

export const config = { runtime: 'edge' };

const PostSchema = z.object({
  posts: z.array(
    z.object({
      author: z.string(),
      text: z.string(),
      language: z.enum(['urdu', 'english', 'roman-urdu']),
      timestamp: z.string(),
      credibilityScore: z.number().min(0).max(100),
      keywords: z.array(z.string()),
    }),
  ),
});

const SYSTEM = `You are a synthetic social media simulator for dengue crisis monitoring in Pakistan.
Generate REALISTIC citizen social media posts about dengue symptoms, sightings, complaints, or fears
in the specified district. Mix Urdu, Roman Urdu, and English naturally. Vary credibility (some verified
accounts, some anonymous panic posts). Include real local terms: bukhar, machhar, platelet, ڈینگی, بخار.
Output VALID JSON matching the schema exactly. Do not include any prose outside JSON.`;

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const district = url.searchParams.get('district') ?? 'Korangi';
  const city = url.searchParams.get('city') ?? 'Karachi';
  const count = parseInt(url.searchParams.get('n') ?? '10', 10);

  const result = await callClaude({
    model: 'claude-haiku-4-5-20251001',
    system: SYSTEM,
    cacheSystem: true,
    maxTokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Generate exactly ${count} synthetic posts for ${district}, ${city}. Return JSON: { "posts": [...] }`,
      },
    ],
  });

  let parsed;
  try {
    parsed = PostSchema.parse(JSON.parse(result.text));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'parse failed', raw: result.text }), { status: 500 });
  }

  return new Response(JSON.stringify({ ...parsed, _cost: result.usage }), {
    headers: { 'content-type': 'application/json' },
  });
}
```

- [ ] **Step 2: Local test**

Run: `curl "http://localhost:3000/api/synth/posts?district=Korangi&city=Karachi&n=8"`
Expected: JSON with 8 posts mixing Urdu/Eng.

- [ ] **Step 3: Commit**

```bash
git add denguesat-ciro/server/api/synth/posts.ts
git commit -m "feat(server): Haiku-powered synthetic post generator"
```

---

## Phase 3 — Backend agent tool dispatcher

### Task 3.1: Zod schemas for agent outputs (`server/lib/schemas.ts`)

**Files:**
- Create: `denguesat-ciro/server/lib/schemas.ts`

- [ ] **Step 1: Write schemas**

```typescript
// server/lib/schemas.ts
import { z } from 'zod';

export const SignalFuseOutput = z.object({
  fusedSignal: z.object({
    location: z.object({ province: z.string(), city: z.string(), district: z.string(), lat: z.number(), lng: z.number() }),
    climate: z.object({ temp: z.number(), humidity: z.number(), rainfall: z.number(), wind: z.number() }),
    vegetation: z.object({ ndvi: z.number(), ndwi: z.number() }),
    hospitalLoad: z.object({ occupancyPct: z.number(), dengueAdmissions24h: z.number() }),
    trafficAnomaly: z.boolean(),
    socialVolume: z.number(),
    trendsAnomaly: z.number(),
  }),
  sourceCredibility: z.record(z.string(), z.number()),
  evidence_quotes: z.array(z.string()),
  confidence: z.number().min(0).max(100),
});

export const OutbreakEyeOutput = z.object({
  crises: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['DENGUE_OUTBREAK', 'HEATWAVE', 'INFRASTRUCTURE_FAILURE', 'OTHER']),
      district: z.string(),
      severityIndicator: z.number(),
      populationAtRisk: z.number(),
      confidence: z.number().min(0).max(100),
      contradictions: z.array(z.string()),
      evidence_quotes: z.array(z.string()),
    }),
  ),
});

export const SeverityMindOutput = z.object({
  assessments: z.array(
    z.object({
      crisisId: z.string(),
      dri: z.object({
        score: z.number().min(0).max(100),
        factors: z.object({ Tw: z.number(), Rw: z.number(), Vw: z.number(), Hw: z.number(), Ww: z.number() }),
        severity: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
        protocol: z.enum(['ROUTINE', 'MONITORING', 'SURVEILLANCE', 'EMERGENCY']),
        reasoning: z.string(),
      }),
      affectedRadiusKm: z.number(),
      populationAtRisk: z.number(),
      expectedDurationDays: z.number(),
      peakImpactDaysFromNow: z.number(),
      uncertaintyPct: z.number(),
      evidence_quotes: z.array(z.string()),
    }),
  ),
});

export const ResourceForgeOutput = z.object({
  allocation: z.object({
    perCrisis: z.array(
      z.object({
        crisisId: z.string(),
        ambulances: z.number(),
        fumigationTrucks: z.number(),
        hospitalBeds: z.number(),
        medicalTeams: z.number(),
      }),
    ),
    reserve: z.object({ ambulances: z.number(), trucks: z.number(), beds: z.number(), teams: z.number() }),
  }),
  tradeoff: z.string(),
  sideEffects: z.array(z.string()),
  routing: z.array(z.object({ from: z.string(), to: z.string(), via: z.string() })),
});

export const CrisisSimOutput = z.object({
  beforeState: z.record(z.string(), z.any()),
  afterState: z.record(z.string(), z.any()),
  metrics: z.object({
    casesReduced: z.number(),
    livesSaved: z.number(),
    responseTimeMin: z.number(),
    hospitalOccupancyChange: z.number(),
  }),
  stakeholderMessages: z.object({
    publicUrdu: z.string(),
    publicEnglish: z.string(),
    emergency: z.string(),
    hospital: z.string(),
    government: z.string(),
    media: z.string(),
  }),
});

export const RecoveryGuardOutput = z.object({
  verdict: z.enum(['UPHOLD', 'RECLASSIFY', 'SPLIT', 'RETRACT']),
  reclassifications: z.array(z.object({ crisisId: z.string(), newType: z.string(), reason: z.string() })),
  retractionMessages: z.object({ publicUrdu: z.string(), publicEnglish: z.string() }).optional(),
  utilityNotifications: z.array(z.object({ provider: z.string(), payload: z.record(z.string(), z.any()) })),
  conflictResolution: z.string(),
});

export const TrendSpyOutput = z.object({
  keyword: z.string(),
  geo: z.string(),
  anomalyScore: z.number().min(0).max(100),
  trendDirection: z.enum(['rising', 'falling', 'stable', 'spike']),
  weeklyValues: z.array(z.number()),
});

export const CitizenSignalOutput = z.object({
  accepted: z.boolean(),
  riskScore: z.number().min(0).max(100),
  breedingLikelihood: z.enum(['low', 'medium', 'high']),
  recommendation: z.string(),
  evidence_quotes: z.array(z.string()),
});
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/server/lib/schemas.ts
git commit -m "feat(server): Zod schemas for all agent outputs"
```

---

### Task 3.2: Agent prompts catalog (`server/lib/prompts.ts`)

**Files:**
- Create: `denguesat-ciro/server/lib/prompts.ts`

- [ ] **Step 1: Write system prompts**

```typescript
// server/lib/prompts.ts
export const SIGNAL_FUSE_SYSTEM = `You are SignalFuse, the multi-source signal fusion agent for the DengueSat CIRO system.

Your role: ingest raw data from 6 sources (NASA POWER climate, OpenWeather current, Google Maps traffic + hospital locations, Firebase RTDB hospital admissions, Google Trends search anomaly, synthetic social posts) for a specified district in Pakistan, then produce a FUSED signal package.

Rules:
1. Score every source credibility 0-100 (NASA=99, hospital=95, OpenWeather=92, Maps=88, Trends=75, Social=variable).
2. Extract evidence_quotes verbatim from sources (no paraphrasing).
3. Compute overall confidence based on agreement across sources.
4. Flag any contradictions explicitly.
5. Output VALID JSON matching the SignalFuseOutput schema. Nothing else.`;

export const OUTBREAK_EYE_SYSTEM = `You are OutbreakEye, the crisis detector + classifier for DengueSat CIRO.

Input: fused signal from SignalFuse.
Job:
1. Detect anomalies (hospital admission spikes >2x baseline, social mention velocity surge, climate breeding conditions).
2. Classify each crisis: DENGUE_OUTBREAK, HEATWAVE, INFRASTRUCTURE_FAILURE, OTHER.
3. Identify geographic cluster (district level).
4. Estimate population at risk using PBS Census 2023 figures.
5. Flag contradictions (e.g., social claims flooding but sensor data shows pipe burst).
6. Output VALID JSON matching OutbreakEyeOutput schema.`;

export const SEVERITY_MIND_SYSTEM = `You are SeverityMind, the deep reasoning + severity analyzer for DengueSat CIRO.

For each detected crisis, compute the 5-factor Dengue Risk Index (DRI):
  DRI = (Tw × 0.25) + (Rw × 0.25) + (Vw × 0.15) + (Hw × 0.15) + (Ww × 0.20)

Where:
  Tw: 25-35°C optimal range, peak 28-32°C scores 100, outside scores lower
  Rw: min(totalPrecip / 1.5, 100)
  Vw: min(ndvi × 200, 100)
  Hw: if humidity > 60: ((humidity-60)/30) × 100 capped at 100; else 0
  Ww: min(ndwi × 250, 100)

Severity tiers:
  DRI > 75 → CRITICAL → EMERGENCY protocol
  DRI 51-75 → HIGH → SURVEILLANCE protocol
  DRI 26-50 → MODERATE → MONITORING protocol
  DRI < 26 → LOW → ROUTINE protocol

Rules:
1. Show full step-by-step computation in reasoning field.
2. Use extended thinking for transparency.
3. Estimate affected radius (km), population at risk, expected duration (days), peak impact (days from now), uncertainty (%).
4. Resolve conflicting signals using source weights from earlier agents.
5. Output VALID JSON matching SeverityMindOutput schema.`;

export const RESOURCE_FORGE_SYSTEM = `You are ResourceForge, the constrained resource allocator for DengueSat CIRO.

Available resources (Karachi base):
  - Ambulances: 15 total
  - Fumigation trucks: 8 total
  - Hospital beds: 200 available
  - Medical teams: 12

Job:
1. Allocate resources across all active crises proportional to severity, urgency, population.
2. Always reserve 10-15% capacity for emergencies.
3. Account for travel time using Google Maps routing data.
4. Identify side effects (e.g., fumigation disrupts traffic for 2h).
5. Generate routing recommendations.
6. Explicitly explain tradeoffs in the tradeoff field.
7. Output VALID JSON matching ResourceForgeOutput schema.`;

export const CRISIS_SIM_SYSTEM = `You are CrisisSim, the impact simulator + stakeholder communicator for DengueSat CIRO.

Job:
1. Simulate execution of ResourceForge plan.
2. Compute BEFORE state (no action) and projected AFTER state (with action).
3. Quantify metrics: cases reduced, lives saved, response time improvement, hospital occupancy change.
4. Generate stakeholder messages:
   - public Urdu (formal but accessible)
   - public English
   - emergency dispatch order
   - hospital preparation alert
   - government situation report
   - media press briefing summary
5. Output VALID JSON matching CrisisSimOutput schema.`;

export const RECOVERY_GUARD_SYSTEM = `You are RecoveryGuard, the false-positive handler + verification agent for DengueSat CIRO.

Job:
1. Re-examine crisis classifications using all available evidence.
2. Detect false positives (e.g., water-main burst misclassified as dengue breeding).
3. Apply source weights: hospital+lab=95, NASA=90, social=70 (×credibility), single field report=60.
4. Verdict options: UPHOLD (classification correct), RECLASSIFY (change crisis type), SPLIT (separate into 2+ incidents), RETRACT (no crisis, full retraction).
5. On RETRACT/RECLASSIFY: generate Urdu + English public correction messages.
6. On INFRASTRUCTURE_FAILURE: generate utility provider notification payload.
7. Output VALID JSON matching RecoveryGuardOutput schema.`;

export const TREND_SPY_SYSTEM = `You are TrendSpy, the Google Trends anomaly analyzer for DengueSat CIRO.

Input: Google Trends weekly values for a dengue-related keyword in Pakistan.
Job:
1. Compute anomaly score 0-100 based on deviation from rolling mean.
2. Classify trend direction: rising, falling, stable, spike.
3. Return weekly values for visualization.
4. Output VALID JSON matching TrendSpyOutput schema.`;

export const CITIZEN_SIGNAL_SYSTEM = `You are CitizenSignal, the citizen-report processor + Claude Vision integrator for DengueSat CIRO.

Input: citizen photo (base64) + text description + location.
Job:
1. Analyze photo via Claude Vision for mosquito breeding indicators (standing water, garbage, vegetation, urban density).
2. Score risk 0-100.
3. Classify breeding likelihood: low/medium/high.
4. Generate actionable recommendation in plain language.
5. Output VALID JSON matching CitizenSignalOutput schema.`;

export const MASTER_SYSTEM = `You are the Antigravity Master Coordinator for DengueSat CIRO.

You orchestrate 8 specialized sub-agents via tool calls to detect, classify, prioritize, and respond to dengue (and dengue-adjacent) crises in Pakistan.

Available tools (each is a sub-agent — call by name):
  - signal_fuse: fuse multi-source data into unified signal
  - outbreak_eye: classify crises from fused signal
  - severity_mind: compute DRI + reasoning per crisis (HEAVY REASONING — use when crisis detected)
  - resource_forge: allocate constrained resources across crises
  - crisis_sim: simulate impact + generate stakeholder messages
  - recovery_guard: verify, detect false positives, resolve conflicts
  - trend_spy: Google Trends anomaly score
  - citizen_signal: process user-submitted reports

Protocol:
1. Always start with signal_fuse to gather data.
2. Call outbreak_eye to classify.
3. If crises detected, call severity_mind for each.
4. If any CRITICAL/HIGH severity, call resource_forge.
5. After allocation, call crisis_sim.
6. ALWAYS call recovery_guard as final verification step.
7. If contradictions or low-confidence (<60), call additional verification before deciding.
8. You may refuse to decide and return "escalate_to_human" if evidence is insufficient.
9. After all tools complete, return a final structured summary with all crises, decisions, and stakeholder messages.

Use extended thinking for high-stakes reasoning. Show your planning in thinking blocks. Be explicit about tradeoffs.`;
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/server/lib/prompts.ts
git commit -m "feat(server): agent system prompts catalog"
```

---

### Task 3.3: Agent tool dispatcher (`server/api/agent/tool/[name].ts`)

**Files:**
- Create: `denguesat-ciro/server/api/agent/tool/[name].ts`

- [ ] **Step 1: Write Edge function**

```typescript
// server/api/agent/tool/[name].ts
import { callClaude } from '../../../lib/claude';
import * as schemas from '../../../lib/schemas';
import * as prompts from '../../../lib/prompts';

export const config = { runtime: 'edge' };

const AGENT_MAP: Record<string, { system: string; schema: any; model: 'claude-sonnet-4-6' | 'claude-haiku-4-5-20251001'; thinking?: boolean }> = {
  signal_fuse: { system: prompts.SIGNAL_FUSE_SYSTEM, schema: schemas.SignalFuseOutput, model: 'claude-sonnet-4-6' },
  outbreak_eye: { system: prompts.OUTBREAK_EYE_SYSTEM, schema: schemas.OutbreakEyeOutput, model: 'claude-sonnet-4-6' },
  severity_mind: { system: prompts.SEVERITY_MIND_SYSTEM, schema: schemas.SeverityMindOutput, model: 'claude-sonnet-4-6', thinking: true },
  resource_forge: { system: prompts.RESOURCE_FORGE_SYSTEM, schema: schemas.ResourceForgeOutput, model: 'claude-sonnet-4-6', thinking: true },
  crisis_sim: { system: prompts.CRISIS_SIM_SYSTEM, schema: schemas.CrisisSimOutput, model: 'claude-sonnet-4-6' },
  recovery_guard: { system: prompts.RECOVERY_GUARD_SYSTEM, schema: schemas.RecoveryGuardOutput, model: 'claude-sonnet-4-6' },
  trend_spy: { system: prompts.TREND_SPY_SYSTEM, schema: schemas.TrendSpyOutput, model: 'claude-haiku-4-5-20251001' },
  citizen_signal: { system: prompts.CITIZEN_SIGNAL_SYSTEM, schema: schemas.CitizenSignalOutput, model: 'claude-sonnet-4-6' },
};

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const name = url.pathname.split('/').pop()!;
  const config = AGENT_MAP[name];
  if (!config) {
    return new Response(JSON.stringify({ error: `unknown agent ${name}` }), { status: 404 });
  }

  const body = await req.json();
  const userPrompt = `Input data:\n\`\`\`json\n${JSON.stringify(body.input, null, 2)}\n\`\`\`\n\nReturn VALID JSON matching the required schema.`;

  const result = await callClaude({
    model: config.model,
    system: config.system,
    cacheSystem: true,
    maxTokens: 4096,
    thinking: config.thinking ? { type: 'enabled', budget_tokens: 4000 } : undefined,
    messages: [{ role: 'user', content: userPrompt }],
  });

  let parsed;
  try {
    const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/) ?? [null, result.text];
    parsed = config.schema.parse(JSON.parse(jsonMatch[1] ?? result.text));
  } catch (err) {
    return new Response(JSON.stringify({ error: 'schema_validation_failed', raw: result.text, parseError: String(err) }), { status: 500 });
  }

  const thinkingText = result.raw.content
    .filter((b: any) => b.type === 'thinking')
    .map((b: any) => b.thinking)
    .join('\n');

  return new Response(
    JSON.stringify({
      agent: name,
      output: parsed,
      reasoning: thinkingText,
      usage: result.usage,
    }),
    { headers: { 'content-type': 'application/json' } },
  );
}
```

- [ ] **Step 2: Local test severity_mind**

Run:
```bash
curl -X POST http://localhost:3000/api/agent/tool/severity_mind \
  -H "content-type: application/json" \
  -d '{"input": {"crises": [{"id":"c1","type":"DENGUE_OUTBREAK","district":"Korangi","climate":{"temp":33,"humidity":85,"rainfall":28,"wind":3},"vegetation":{"ndvi":0.51,"ndwi":0.38}}]}}'
```
Expected: JSON with `output.assessments[0].dri.score` near 80, `reasoning` populated.

- [ ] **Step 3: Commit**

```bash
git add denguesat-ciro/server/api/agent/tool/[name].ts
git commit -m "feat(server): dynamic agent tool dispatcher"
```

---

### Task 3.4: Master orchestrator (`server/api/agent/orchestrate.ts`)

**Files:**
- Create: `denguesat-ciro/server/api/agent/orchestrate.ts`

- [ ] **Step 1: Write orchestrator with SSE streaming**

```typescript
// server/api/agent/orchestrate.ts
import Anthropic from '@anthropic-ai/sdk';
import { MASTER_SYSTEM } from '../../lib/prompts';

export const config = { runtime: 'edge' };

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'signal_fuse',
    description: 'Fuse multi-source raw data into unified signal package. Call FIRST.',
    input_schema: { type: 'object', properties: { rawData: { type: 'object' } }, required: ['rawData'] },
  },
  {
    name: 'outbreak_eye',
    description: 'Classify crises from fused signal. Call after signal_fuse.',
    input_schema: { type: 'object', properties: { fusedSignal: { type: 'object' } }, required: ['fusedSignal'] },
  },
  {
    name: 'severity_mind',
    description: 'Compute DRI + heavy reasoning per crisis. Call for each detected crisis.',
    input_schema: { type: 'object', properties: { crises: { type: 'array' } }, required: ['crises'] },
  },
  {
    name: 'resource_forge',
    description: 'Allocate constrained resources across crises with tradeoff reasoning.',
    input_schema: { type: 'object', properties: { crises: { type: 'array' }, assessments: { type: 'array' } }, required: ['crises'] },
  },
  {
    name: 'crisis_sim',
    description: 'Simulate impact + generate stakeholder messages (Urdu+Eng).',
    input_schema: { type: 'object', properties: { allocation: { type: 'object' }, crises: { type: 'array' } }, required: ['allocation'] },
  },
  {
    name: 'recovery_guard',
    description: 'Verify classifications, detect false positives, resolve conflicts. Call as final verification.',
    input_schema: { type: 'object', properties: { crises: { type: 'array' }, newEvidence: { type: 'array' } }, required: ['crises'] },
  },
  {
    name: 'trend_spy',
    description: 'Get Google Trends anomaly score for a dengue keyword.',
    input_schema: { type: 'object', properties: { keyword: { type: 'string' } }, required: ['keyword'] },
  },
];

function sse(data: any): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export default async function handler(req: Request) {
  const body = await req.json();
  const { location, runId, prefetchedData } = body;

  const baseURL = new URL(req.url).origin;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const emit = (event: any) => controller.enqueue(encoder.encode(sse(event)));

      emit({ type: 'master.start', runId, location, timestamp: Date.now() });

      let messages: Anthropic.MessageParam[] = [
        {
          role: 'user',
          content: `Run full crisis analysis for ${location.district}, ${location.city}, ${location.province}.

Prefetched raw data:
\`\`\`json
${JSON.stringify(prefetchedData, null, 2)}
\`\`\`

Run your protocol. Use the tools. Return final summary when done.`,
        },
      ];

      const MAX_ITERS = 12;
      let totalCost = 0;

      for (let iter = 0; iter < MAX_ITERS; iter++) {
        const msg = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: MASTER_SYSTEM,
          thinking: { type: 'enabled', budget_tokens: 4000 },
          tools: TOOLS,
          messages,
        });

        const thinking = msg.content.filter((b: any) => b.type === 'thinking').map((b: any) => b.thinking).join('\n');
        const text = msg.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
        const toolUses = msg.content.filter((b: any) => b.type === 'tool_use');

        emit({
          type: 'master.iter',
          iter,
          thinking,
          text,
          toolCallsPlanned: toolUses.map((t: any) => t.name),
          usage: msg.usage,
          timestamp: Date.now(),
        });

        const inputCost = (msg.usage.input_tokens * 3 + msg.usage.output_tokens * 15) / 1_000_000;
        totalCost += inputCost;

        if (msg.stop_reason === 'end_turn' || toolUses.length === 0) {
          emit({ type: 'master.done', finalText: text, totalCostUSD: totalCost, timestamp: Date.now() });
          break;
        }

        messages.push({ role: 'assistant', content: msg.content });

        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const tu of toolUses as any[]) {
          emit({ type: 'tool.start', toolUseId: tu.id, name: tu.name, input: tu.input, timestamp: Date.now() });
          try {
            const r = await fetch(`${baseURL}/api/agent/tool/${tu.name}`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ input: tu.input }),
            });
            const data = await r.json();
            totalCost += data.usage?.costUSD ?? 0;

            emit({
              type: 'tool.done',
              toolUseId: tu.id,
              name: tu.name,
              output: data.output,
              reasoning: data.reasoning,
              usage: data.usage,
              timestamp: Date.now(),
            });
            toolResults.push({
              type: 'tool_result',
              tool_use_id: tu.id,
              content: JSON.stringify(data.output),
            });
          } catch (err) {
            emit({ type: 'tool.error', toolUseId: tu.id, name: tu.name, error: String(err), timestamp: Date.now() });
            toolResults.push({
              type: 'tool_result',
              tool_use_id: tu.id,
              content: JSON.stringify({ error: String(err) }),
              is_error: true,
            });
          }
        }

        messages.push({ role: 'user', content: toolResults });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      'connection': 'keep-alive',
    },
  });
}
```

- [ ] **Step 2: Local test (SSE will print raw events)**

Run:
```bash
curl -N -X POST http://localhost:3000/api/agent/orchestrate \
  -H "content-type: application/json" \
  -d '{
    "runId": "test-001",
    "location": {"province":"Sindh","city":"Karachi","district":"Korangi","lat":24.83,"lng":67.07},
    "prefetchedData": {"climate":{"temp":33,"humidity":85,"rainfall":28},"hospital":{"occupancyPct":89,"admissions24h":47},"social":{"postCount":47}}
  }'
```
Expected: stream of SSE events `master.start`, `master.iter`, `tool.start`, `tool.done`, ..., `master.done`.

- [ ] **Step 3: Commit**

```bash
git add denguesat-ciro/server/api/agent/orchestrate.ts
git commit -m "feat(server): Master Coordinator orchestrator with SSE streaming"
```

---

### Task 3.5: Vision endpoint for AR scanner (`server/api/vision.ts`)

**Files:**
- Create: `denguesat-ciro/server/api/vision.ts`

- [ ] **Step 1: Write Edge function**

```typescript
// server/api/vision.ts
import Anthropic from '@anthropic-ai/sdk';
import { CITIZEN_SIGNAL_SYSTEM } from '../lib/prompts';
import { CitizenSignalOutput } from '../lib/schemas';

export const config = { runtime: 'edge' };

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export default async function handler(req: Request) {
  const body = await req.json();
  const { imageBase64, text, location } = body;

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: [{ type: 'text', text: CITIZEN_SIGNAL_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: `Citizen description: "${text}"\nLocation: ${JSON.stringify(location)}\n\nAnalyze for mosquito breeding risk. Return VALID JSON matching CitizenSignalOutput schema.` },
        ],
      },
    ],
  });

  const rawText = msg.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
  const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```/) ?? [null, rawText];
  let parsed;
  try {
    parsed = CitizenSignalOutput.parse(JSON.parse(jsonMatch[1] ?? rawText));
  } catch (err) {
    return new Response(JSON.stringify({ error: 'parse_failed', raw: rawText }), { status: 500 });
  }

  const costUSD = (msg.usage.input_tokens * 3 + msg.usage.output_tokens * 15) / 1_000_000;

  return new Response(JSON.stringify({ ...parsed, usage: { ...msg.usage, costUSD } }), {
    headers: { 'content-type': 'application/json' },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/server/api/vision.ts
git commit -m "feat(server): Claude Vision endpoint for AR puddle scanner"
```

---

### Task 3.6: Deploy backend to Vercel

**Files:**
- Modify: (none, deploy action)

- [ ] **Step 1: Deploy to preview**

Run: `cd denguesat-ciro/server && vercel deploy`
Capture preview URL (e.g., `https://denguesat-ciro-proxy-xxx.vercel.app`).

- [ ] **Step 2: Test preview deployment**

Run: `curl "<PREVIEW-URL>/api/data/nasa?lat=24.86&lng=67.01"`
Expected: JSON with NASA data.

- [ ] **Step 3: Deploy to production**

Run: `vercel deploy --prod`
Capture production URL (e.g., `https://denguesat-ciro-proxy.vercel.app`).

- [ ] **Step 4: Save URL for mobile config**

Edit `denguesat-ciro/.env`:

```
# Existing keys preserved
EXPO_PUBLIC_AGENT_PROXY_URL=https://denguesat-ciro-proxy.vercel.app
```

- [ ] **Step 5: Commit**

```bash
git add denguesat-ciro/.env
git commit -m "chore: wire Vercel proxy URL into mobile env"
```

---

## Phase 4 — Mobile types, store, constants

### Task 4.1: Expanded types (`lib/types.ts`)

**Files:**
- Modify: `denguesat-ciro/lib/types.ts`

- [ ] **Step 1: Read current types file**

Run: `cat denguesat-ciro/lib/types.ts`
Capture existing exports.

- [ ] **Step 2: Append new types (do NOT remove existing)**

Add to `lib/types.ts`:

```typescript
// === MAX-POWER additions ===

export interface Province {
  id: string;
  name: string;
  nameUrdu: string;
  cities: City[];
}

export interface City {
  id: string;
  name: string;
  nameUrdu: string;
  lat: number;
  lng: number;
  population: number;
  districts: District[];
}

export interface District {
  id: string;
  name: string;
  nameUrdu: string;
  lat: number;
  lng: number;
  population: number;
}

export type SourceStatus = 'live' | 'cached' | 'degraded' | 'failed';

export interface SourceHealth {
  nasa: SourceStatus;
  openweather: SourceStatus;
  maps: SourceStatus;
  firebase: SourceStatus;
  trends: SourceStatus;
  social: SourceStatus;
  lastChecked: number;
}

export type AntigravityEventType =
  | 'master.start'
  | 'master.iter'
  | 'master.done'
  | 'tool.start'
  | 'tool.done'
  | 'tool.error'
  | 'system';

export interface AntigravityTrace {
  id: string;
  type: AntigravityEventType;
  runId: string;
  iter?: number;
  agent?: string;
  toolUseId?: string;
  input?: any;
  output?: any;
  reasoning?: string;
  thinking?: string;
  text?: string;
  toolCallsPlanned?: string[];
  usage?: { inputTokens: number; outputTokens: number; cacheReadTokens: number; costUSD: number };
  error?: string;
  timestamp: number;
}

export interface CitizenReport {
  id: string;
  timestamp: number;
  photoBase64?: string;
  text: string;
  location: { lat: number; lng: number; district: string };
  visionResult?: {
    riskScore: number;
    breedingLikelihood: 'low' | 'medium' | 'high';
    recommendation: string;
  };
  accepted: boolean;
}

export type ScenarioId = 'live' | 'dual-crisis' | 'false-alarm' | 'api-failure' | 'hospital-rush';

export interface CostState {
  totalTokens: number;
  totalUSD: number;
  perAgentTokens: Record<string, number>;
  perAgentUSD: Record<string, number>;
  callCount: number;
}
```

- [ ] **Step 3: Commit**

```bash
git add denguesat-ciro/lib/types.ts
git commit -m "feat(types): add Province/AntigravityTrace/CitizenReport types"
```

---

### Task 4.2: Provinces constant (`constants/provinces.ts`)

**Files:**
- Create: `denguesat-ciro/constants/provinces.ts`

- [ ] **Step 1: Write provinces data**

```typescript
// constants/provinces.ts
import { Province } from '../lib/types';

export const PROVINCES: Province[] = [
  {
    id: 'sindh',
    name: 'Sindh',
    nameUrdu: 'سندھ',
    cities: [
      {
        id: 'karachi',
        name: 'Karachi',
        nameUrdu: 'کراچی',
        lat: 24.8607,
        lng: 67.0011,
        population: 20382881,
        districts: [
          { id: 'east', name: 'East', nameUrdu: 'مشرق', lat: 24.9266, lng: 67.1141, population: 3957078 },
          { id: 'central', name: 'Central', nameUrdu: 'وسطی', lat: 24.9181, lng: 67.0635, population: 3823350 },
          { id: 'korangi', name: 'Korangi', nameUrdu: 'کورنگی', lat: 24.8253, lng: 67.1318, population: 3128971 },
          { id: 'west', name: 'West', nameUrdu: 'مغرب', lat: 24.9447, lng: 66.9924, population: 2683018 },
          { id: 'malir', name: 'Malir', nameUrdu: 'ملیر', lat: 24.9100, lng: 67.2065, population: 2400000 },
          { id: 'south', name: 'South', nameUrdu: 'جنوب', lat: 24.8418, lng: 67.0123, population: 2333411 },
          { id: 'keamari', name: 'Keamari', nameUrdu: 'کیماڑی', lat: 24.8350, lng: 66.9821, population: 2071000 },
        ],
      },
      {
        id: 'hyderabad',
        name: 'Hyderabad',
        nameUrdu: 'حیدرآباد',
        lat: 25.3960,
        lng: 68.3578,
        population: 2432540,
        districts: [
          { id: 'qasimabad', name: 'Qasimabad', nameUrdu: 'قاسم آباد', lat: 25.3849, lng: 68.3262, population: 410000 },
          { id: 'latifabad', name: 'Latifabad', nameUrdu: 'لطیف آباد', lat: 25.3613, lng: 68.3690, population: 580000 },
        ],
      },
    ],
  },
  {
    id: 'punjab',
    name: 'Punjab',
    nameUrdu: 'پنجاب',
    cities: [
      {
        id: 'lahore',
        name: 'Lahore',
        nameUrdu: 'لاہور',
        lat: 31.5204,
        lng: 74.3587,
        population: 13004135,
        districts: [
          { id: 'gulberg', name: 'Gulberg', nameUrdu: 'گلبرگ', lat: 31.5096, lng: 74.3460, population: 850000 },
          { id: 'model-town', name: 'Model Town', nameUrdu: 'ماڈل ٹاؤن', lat: 31.4810, lng: 74.3290, population: 920000 },
        ],
      },
      {
        id: 'rawalpindi',
        name: 'Rawalpindi',
        nameUrdu: 'راولپنڈی',
        lat: 33.5651,
        lng: 73.0169,
        population: 2098231,
        districts: [
          { id: 'saddar', name: 'Saddar', nameUrdu: 'صدر', lat: 33.5973, lng: 73.0479, population: 410000 },
        ],
      },
      {
        id: 'multan',
        name: 'Multan',
        nameUrdu: 'ملتان',
        lat: 30.1575,
        lng: 71.5249,
        population: 1871843,
        districts: [
          { id: 'cantt', name: 'Cantt', nameUrdu: 'چھاؤنی', lat: 30.1986, lng: 71.4687, population: 380000 },
        ],
      },
    ],
  },
  {
    id: 'kp',
    name: 'Khyber Pakhtunkhwa',
    nameUrdu: 'خیبر پختونخوا',
    cities: [
      {
        id: 'peshawar',
        name: 'Peshawar',
        nameUrdu: 'پشاور',
        lat: 34.0151,
        lng: 71.5249,
        population: 1970042,
        districts: [
          { id: 'cantt', name: 'Cantt', nameUrdu: 'چھاؤنی', lat: 34.0096, lng: 71.5466, population: 410000 },
        ],
      },
      {
        id: 'charsadda',
        name: 'Charsadda',
        nameUrdu: 'چارسدہ',
        lat: 34.1453,
        lng: 71.7308,
        population: 105414,
        districts: [
          { id: 'urban', name: 'Urban', nameUrdu: 'شہری', lat: 34.1453, lng: 71.7308, population: 105414 },
        ],
      },
    ],
  },
  {
    id: 'balochistan',
    name: 'Balochistan',
    nameUrdu: 'بلوچستان',
    cities: [
      {
        id: 'quetta',
        name: 'Quetta',
        nameUrdu: 'کوئٹہ',
        lat: 30.1798,
        lng: 66.9750,
        population: 1001205,
        districts: [
          { id: 'cantt', name: 'Cantt', nameUrdu: 'چھاؤنی', lat: 30.1865, lng: 66.9956, population: 240000 },
        ],
      },
    ],
  },
  {
    id: 'ict',
    name: 'Islamabad Capital Territory',
    nameUrdu: 'وفاقی دارالحکومت اسلام آباد',
    cities: [
      {
        id: 'islamabad',
        name: 'Islamabad',
        nameUrdu: 'اسلام آباد',
        lat: 33.6844,
        lng: 73.0479,
        population: 2363000,
        districts: [
          { id: 'g10', name: 'G-10', nameUrdu: 'جی-۱۰', lat: 33.6803, lng: 73.0223, population: 65000 },
          { id: 'f7', name: 'F-7', nameUrdu: 'ایف-۷', lat: 33.7227, lng: 73.0593, population: 28000 },
        ],
      },
    ],
  },
];

export function findDistrict(provinceId: string, cityId: string, districtId: string) {
  const province = PROVINCES.find(p => p.id === provinceId);
  if (!province) return null;
  const city = province.cities.find(c => c.id === cityId);
  if (!city) return null;
  const district = city.districts.find(d => d.id === districtId);
  if (!district) return null;
  return { province, city, district };
}
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/constants/provinces.ts
git commit -m "feat(constants): province/city/district tree with PBS Census 2023 populations"
```

---

### Task 4.3: Zustand store expansion (`hooks/useCrisisStore.ts`)

**Files:**
- Modify: `denguesat-ciro/hooks/useCrisisStore.ts`

- [ ] **Step 1: Read current store**

Run: `cat denguesat-ciro/hooks/useCrisisStore.ts`
Note existing state shape and actions.

- [ ] **Step 2: Add new slices preserving existing ones**

Add to `hooks/useCrisisStore.ts` (merge with existing `create((set, get) => ({...}))`):

```typescript
import { AntigravityTrace, CitizenReport, CostState, ScenarioId, SourceHealth, District, City, Province } from '../lib/types';

// Add inside store creation:
selectedProvince: null as Province | null,
selectedCity: null as City | null,
selectedDistrict: null as District | null,
scenarioId: 'live' as ScenarioId,
antigravityTraces: [] as AntigravityTrace[],
citizenReports: [] as CitizenReport[],
sourceHealth: {
  nasa: 'live',
  openweather: 'live',
  maps: 'live',
  firebase: 'live',
  trends: 'live',
  social: 'live',
  lastChecked: Date.now(),
} as SourceHealth,
cost: {
  totalTokens: 0,
  totalUSD: 0,
  perAgentTokens: {},
  perAgentUSD: {},
  callCount: 0,
} as CostState,

setLocation: (p: Province, c: City, d: District) =>
  set({ selectedProvince: p, selectedCity: c, selectedDistrict: d }),

setScenario: (id: ScenarioId) => set({ scenarioId: id }),

addAntigravityTrace: (t: AntigravityTrace) =>
  set(state => ({ antigravityTraces: [...state.antigravityTraces, t] })),

clearAntigravityTraces: () => set({ antigravityTraces: [] }),

addCitizenReport: (r: CitizenReport) =>
  set(state => ({ citizenReports: [...state.citizenReports, r] })),

setSourceStatus: (source: keyof Omit<SourceHealth, 'lastChecked'>, status: any) =>
  set(state => ({
    sourceHealth: { ...state.sourceHealth, [source]: status, lastChecked: Date.now() },
  })),

addCost: (agent: string, tokens: number, usd: number) =>
  set(state => ({
    cost: {
      totalTokens: state.cost.totalTokens + tokens,
      totalUSD: state.cost.totalUSD + usd,
      perAgentTokens: { ...state.cost.perAgentTokens, [agent]: (state.cost.perAgentTokens[agent] ?? 0) + tokens },
      perAgentUSD: { ...state.cost.perAgentUSD, [agent]: (state.cost.perAgentUSD[agent] ?? 0) + usd },
      callCount: state.cost.callCount + 1,
    },
  })),

resetCost: () =>
  set({ cost: { totalTokens: 0, totalUSD: 0, perAgentTokens: {}, perAgentUSD: {}, callCount: 0 } }),
```

- [ ] **Step 3: Commit**

```bash
git add denguesat-ciro/hooks/useCrisisStore.ts
git commit -m "feat(store): expand Zustand store with antigravity traces, cost, source health"
```

---

## Phase 5 — Mobile claude client + orchestrator

### Task 5.1: Install mobile deps

**Files:**
- Modify: `denguesat-ciro/package.json`

- [ ] **Step 1: Install deps**

Run:
```bash
cd denguesat-ciro
npx expo install expo-camera expo-speech expo-image-picker expo-file-system
npm install zod uuid eventsource-parser
npm install --save-dev @types/uuid
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/package.json denguesat-ciro/package-lock.json
git commit -m "chore(deps): add camera, speech, image-picker, zod, uuid"
```

---

### Task 5.2: Claude proxy client (`lib/claude-client.ts`)

**Files:**
- Create: `denguesat-ciro/lib/claude-client.ts`

- [ ] **Step 1: Write client**

```typescript
// lib/claude-client.ts
const PROXY_URL = process.env.EXPO_PUBLIC_AGENT_PROXY_URL ?? 'http://localhost:3000';

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

export async function* orchestrateStream(payload: { runId: string; location: any; prefetchedData: any }) {
  const r = await fetch(`${PROXY_URL}/api/agent/orchestrate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.body) throw new Error('no body');
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6);
      try {
        yield JSON.parse(json);
      } catch {
        // skip malformed
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/lib/claude-client.ts
git commit -m "feat(lib): Claude proxy client with SSE orchestrate stream"
```

---

### Task 5.3: External API clients (`lib/api/*.ts`)

**Files:**
- Create: `denguesat-ciro/lib/api/nasa.ts`
- Create: `denguesat-ciro/lib/api/openweather.ts`
- Create: `denguesat-ciro/lib/api/google-maps.ts`
- Create: `denguesat-ciro/lib/api/firebase-rtdb.ts`
- Create: `denguesat-ciro/lib/api/google-trends.ts`
- Create: `denguesat-ciro/lib/synth-posts.ts`

- [ ] **Step 1: Write NASA client**

```typescript
// lib/api/nasa.ts
const PROXY = process.env.EXPO_PUBLIC_AGENT_PROXY_URL ?? 'http://localhost:3000';

export async function fetchNasaClimate(lat: number, lng: number) {
  const r = await fetch(`${PROXY}/api/data/nasa?lat=${lat}&lng=${lng}`);
  if (!r.ok) throw new Error(`nasa ${r.status}`);
  return r.json();
}
```

- [ ] **Step 2: Write OpenWeather client**

```typescript
// lib/api/openweather.ts
const PROXY = process.env.EXPO_PUBLIC_AGENT_PROXY_URL ?? 'http://localhost:3000';

export async function fetchOpenWeather(lat: number, lng: number) {
  const r = await fetch(`${PROXY}/api/data/openweather?lat=${lat}&lng=${lng}`);
  if (!r.ok) throw new Error(`ow ${r.status}`);
  return r.json();
}
```

- [ ] **Step 3: Write Google Maps client**

```typescript
// lib/api/google-maps.ts
const PROXY = process.env.EXPO_PUBLIC_AGENT_PROXY_URL ?? 'http://localhost:3000';

export async function fetchNearbyHospitals(lat: number, lng: number) {
  const r = await fetch(`${PROXY}/api/data/maps?lat=${lat}&lng=${lng}&op=nearby`);
  if (!r.ok) throw new Error(`maps ${r.status}`);
  return r.json();
}
```

- [ ] **Step 4: Write Firebase RTDB client**

```typescript
// lib/api/firebase-rtdb.ts
const PROXY = process.env.EXPO_PUBLIC_AGENT_PROXY_URL ?? 'http://localhost:3000';

export async function fetchHospitals(cityId: string) {
  const r = await fetch(`${PROXY}/api/data/firebase?path=hospitals/${cityId}`);
  if (!r.ok) throw new Error(`fb ${r.status}`);
  const { data } = await r.json();
  return data;
}
```

- [ ] **Step 5: Write Trends client**

```typescript
// lib/api/google-trends.ts
const PROXY = process.env.EXPO_PUBLIC_AGENT_PROXY_URL ?? 'http://localhost:3000';

export async function fetchTrends(keyword: string) {
  const r = await fetch(`${PROXY}/api/data/trends?q=${encodeURIComponent(keyword)}`);
  if (!r.ok) throw new Error(`trends ${r.status}`);
  return r.json();
}
```

- [ ] **Step 6: Write synth posts client**

```typescript
// lib/synth-posts.ts
const PROXY = process.env.EXPO_PUBLIC_AGENT_PROXY_URL ?? 'http://localhost:3000';

export async function fetchSynthPosts(district: string, city: string, count = 10) {
  const r = await fetch(`${PROXY}/api/synth/posts?district=${encodeURIComponent(district)}&city=${encodeURIComponent(city)}&n=${count}`);
  if (!r.ok) throw new Error(`synth ${r.status}`);
  return r.json();
}
```

- [ ] **Step 7: Commit**

```bash
git add denguesat-ciro/lib/api denguesat-ciro/lib/synth-posts.ts
git commit -m "feat(lib): external API clients (NASA/OW/Maps/Firebase/Trends/synth)"
```

---

### Task 5.4: Antigravity runtime (`lib/antigravity.ts`)

**Files:**
- Create: `denguesat-ciro/lib/antigravity.ts`

- [ ] **Step 1: Write orchestrator**

```typescript
// lib/antigravity.ts
import { v4 as uuid } from 'uuid';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { orchestrateStream } from './claude-client';
import { fetchNasaClimate } from './api/nasa';
import { fetchOpenWeather } from './api/openweather';
import { fetchNearbyHospitals } from './api/google-maps';
import { fetchHospitals } from './api/firebase-rtdb';
import { fetchTrends } from './api/google-trends';
import { fetchSynthPosts } from './synth-posts';
import { AntigravityTrace } from './types';

export class AntigravityOrchestrator {
  async runFullPipeline(): Promise<void> {
    const store = useCrisisStore.getState();
    const { selectedProvince, selectedCity, selectedDistrict } = store;

    if (!selectedProvince || !selectedCity || !selectedDistrict) {
      throw new Error('Location not set');
    }

    const runId = uuid();
    store.clearAntigravityTraces();
    store.resetCost();
    store.setAnalyzing?.(true);

    try {
      // Prefetch all 6 sources in parallel
      const lat = selectedDistrict.lat;
      const lng = selectedDistrict.lng;
      const [nasa, ow, maps, hospital, trends, posts] = await Promise.allSettled([
        fetchNasaClimate(lat, lng),
        fetchOpenWeather(lat, lng),
        fetchNearbyHospitals(lat, lng),
        fetchHospitals(selectedCity.id),
        fetchTrends(`dengue ${selectedCity.name}`),
        fetchSynthPosts(selectedDistrict.name, selectedCity.name, 10),
      ]);

      const prefetchedData = {
        location: {
          province: selectedProvince.name,
          city: selectedCity.name,
          district: selectedDistrict.name,
          lat,
          lng,
          population: selectedDistrict.population,
        },
        nasa: nasa.status === 'fulfilled' ? nasa.value : { error: 'failed' },
        openweather: ow.status === 'fulfilled' ? ow.value : { error: 'failed' },
        maps: maps.status === 'fulfilled' ? maps.value : { error: 'failed' },
        hospital: hospital.status === 'fulfilled' ? hospital.value : { error: 'failed' },
        trends: trends.status === 'fulfilled' ? trends.value : { error: 'failed' },
        social: posts.status === 'fulfilled' ? posts.value : { error: 'failed' },
      };

      // Update source health based on prefetch results
      store.setSourceStatus('nasa', nasa.status === 'fulfilled' ? (nasa.value._cache?.fromCache ? 'cached' : 'live') : 'failed');
      store.setSourceStatus('openweather', ow.status === 'fulfilled' ? (ow.value._cache?.fromCache ? 'cached' : 'live') : 'failed');
      store.setSourceStatus('maps', maps.status === 'fulfilled' ? 'live' : 'failed');
      store.setSourceStatus('firebase', hospital.status === 'fulfilled' ? 'live' : 'failed');
      store.setSourceStatus('trends', trends.status === 'fulfilled' ? 'live' : 'failed');
      store.setSourceStatus('social', posts.status === 'fulfilled' ? 'live' : 'failed');

      // Stream master orchestration
      const stream = orchestrateStream({ runId, location: prefetchedData.location, prefetchedData });

      for await (const event of stream) {
        const trace: AntigravityTrace = {
          id: uuid(),
          type: event.type,
          runId,
          iter: event.iter,
          agent: event.name,
          toolUseId: event.toolUseId,
          input: event.input,
          output: event.output,
          reasoning: event.reasoning,
          thinking: event.thinking,
          text: event.text ?? event.finalText,
          toolCallsPlanned: event.toolCallsPlanned,
          usage: event.usage,
          error: event.error,
          timestamp: event.timestamp ?? Date.now(),
        };
        store.addAntigravityTrace(trace);

        if (event.usage) {
          store.addCost(event.name ?? 'master', event.usage.inputTokens + event.usage.outputTokens, event.usage.costUSD ?? 0);
        }
      }
    } finally {
      store.setAnalyzing?.(false);
    }
  }
}

export const antigravity = new AntigravityOrchestrator();
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/lib/antigravity.ts
git commit -m "feat(lib): Antigravity runtime orchestrator with SSE stream consumer"
```

---

## Phase 6 — Mobile UI: Province picker, Cost dashboard

### Task 6.1: Province picker component (`components/ProvincePicker.tsx`)

**Files:**
- Create: `denguesat-ciro/components/ProvincePicker.tsx`

- [ ] **Step 1: Write picker**

```typescript
// components/ProvincePicker.tsx
import React, { useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { PROVINCES } from '../constants/provinces';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { Province, City, District } from '../lib/types';

type Step = 'province' | 'city' | 'district';

export function ProvincePicker() {
  const theme = useTheme();
  const { selectedProvince, selectedCity, selectedDistrict, setLocation } = useCrisisStore() as any;
  const [step, setStep] = useState<Step>(selectedDistrict ? 'district' : 'province');
  const [pendingProvince, setPendingProvince] = useState<Province | null>(selectedProvince);
  const [pendingCity, setPendingCity] = useState<City | null>(selectedCity);

  const styles = makeStyles(theme);

  if (selectedDistrict && step === 'district') {
    return (
      <Surface style={styles.surface}>
        <Text style={styles.label}>LOCATION</Text>
        <Text style={styles.value}>
          {selectedProvince?.name} → {selectedCity?.name} → {selectedDistrict.name}
        </Text>
        <Pressable onPress={() => setStep('province')}>
          <Text style={styles.link}>Change</Text>
        </Pressable>
      </Surface>
    );
  }

  if (step === 'province') {
    return (
      <Surface style={styles.surface}>
        <Text style={styles.title}>Select Province</Text>
        <ScrollView>
          {PROVINCES.map(p => (
            <Pressable
              key={p.id}
              onPress={() => { setPendingProvince(p); setStep('city'); }}
              style={styles.row}
            >
              <Text style={styles.rowEng}>{p.name}</Text>
              <Text style={styles.rowUrdu}>{p.nameUrdu}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Surface>
    );
  }

  if (step === 'city' && pendingProvince) {
    return (
      <Surface style={styles.surface}>
        <Text style={styles.title}>{pendingProvince.name} → Select City</Text>
        <ScrollView>
          {pendingProvince.cities.map(c => (
            <Pressable
              key={c.id}
              onPress={() => { setPendingCity(c); setStep('district'); }}
              style={styles.row}
            >
              <Text style={styles.rowEng}>{c.name}</Text>
              <Text style={styles.rowUrdu}>{c.nameUrdu}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Surface>
    );
  }

  if (step === 'district' && pendingProvince && pendingCity) {
    return (
      <Surface style={styles.surface}>
        <Text style={styles.title}>{pendingCity.name} → Select District</Text>
        <ScrollView>
          {pendingCity.districts.map(d => (
            <Pressable
              key={d.id}
              onPress={() => { setLocation(pendingProvince, pendingCity, d); setStep('district'); }}
              style={styles.row}
            >
              <Text style={styles.rowEng}>{d.name}</Text>
              <Text style={styles.rowUrdu}>{d.nameUrdu}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Surface>
    );
  }

  return null;
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    surface: { padding: 16, margin: 12, borderRadius: 12, backgroundColor: theme.colors.surface, elevation: 2, maxHeight: 320 },
    title: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: theme.colors.onSurface },
    label: { fontSize: 12, color: theme.colors.onSurfaceVariant, marginBottom: 4 },
    value: { fontSize: 16, fontWeight: '600', color: theme.colors.onSurface, marginBottom: 8 },
    link: { color: theme.colors.primary, fontSize: 14 },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.outline },
    rowEng: { fontSize: 16, color: theme.colors.onSurface },
    rowUrdu: { fontSize: 16, color: theme.colors.onSurfaceVariant },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/components/ProvincePicker.tsx
git commit -m "feat(ui): cascading province/city/district picker"
```

---

### Task 6.2: Cost dashboard component (`components/CostDashboard.tsx`)

**Files:**
- Create: `denguesat-ciro/components/CostDashboard.tsx`

- [ ] **Step 1: Write component**

```typescript
// components/CostDashboard.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { useCrisisStore } from '../hooks/useCrisisStore';

export function CostDashboard() {
  const theme = useTheme();
  const cost = useCrisisStore((s: any) => s.cost);
  const styles = makeStyles(theme);

  return (
    <Surface style={styles.surface}>
      <Text style={styles.label}>LIVE COST</Text>
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.bigNum}>${cost.totalUSD.toFixed(4)}</Text>
          <Text style={styles.cellLabel}>spent</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.bigNum}>{cost.totalTokens.toLocaleString()}</Text>
          <Text style={styles.cellLabel}>tokens</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.bigNum}>{cost.callCount}</Text>
          <Text style={styles.cellLabel}>calls</Text>
        </View>
      </View>
    </Surface>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    surface: { padding: 14, margin: 12, borderRadius: 12, backgroundColor: theme.colors.surface, elevation: 1 },
    label: { fontSize: 11, fontWeight: '600', color: theme.colors.onSurfaceVariant, letterSpacing: 1, marginBottom: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    cell: { flex: 1, alignItems: 'center' },
    bigNum: { fontSize: 22, fontWeight: '800', color: theme.colors.primary },
    cellLabel: { fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/components/CostDashboard.tsx
git commit -m "feat(ui): live cost dashboard component"
```

---

### Task 6.3: Source health badges (`components/SourceHealthBadge.tsx`, `components/DegradedModeBanner.tsx`)

**Files:**
- Create: `denguesat-ciro/components/SourceHealthBadge.tsx`
- Create: `denguesat-ciro/components/DegradedModeBanner.tsx`

- [ ] **Step 1: Write badge**

```typescript
// components/SourceHealthBadge.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SourceStatus } from '../lib/types';

const COLORS: Record<SourceStatus, string> = {
  live: '#10b981',
  cached: '#f59e0b',
  degraded: '#ef4444',
  failed: '#7f1d1d',
};

export function SourceHealthBadge({ name, status }: { name: string; status: SourceStatus }) {
  return (
    <View style={[styles.badge, { backgroundColor: COLORS[status] }]}>
      <Text style={styles.text}>{name}: {status.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 6, marginBottom: 6 },
  text: { color: '#fff', fontSize: 10, fontWeight: '600' },
});
```

- [ ] **Step 2: Write banner**

```typescript
// components/DegradedModeBanner.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useCrisisStore } from '../hooks/useCrisisStore';

export function DegradedModeBanner() {
  const health = useCrisisStore((s: any) => s.sourceHealth);
  const counts = (Object.values(health) as any[]).reduce((acc, v) => {
    if (v === 'cached') acc.cached++;
    if (v === 'failed' || v === 'degraded') acc.degraded++;
    return acc;
  }, { cached: 0, degraded: 0 });

  if (counts.degraded >= 3) {
    return (
      <View style={[styles.banner, { backgroundColor: '#7f1d1d' }]}>
        <Text style={styles.text}>⚠️ SAFETY MODE — 3+ sources unavailable. Showing last-known intelligence only.</Text>
      </View>
    );
  }
  if (counts.degraded >= 1 || counts.cached >= 2) {
    return (
      <View style={[styles.banner, { backgroundColor: '#f59e0b' }]}>
        <Text style={styles.text}>API Degradation — Operating on partial / cached intelligence. Confidence reduced.</Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  banner: { padding: 12, marginHorizontal: 12, marginTop: 8, borderRadius: 8 },
  text: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
```

- [ ] **Step 3: Commit**

```bash
git add denguesat-ciro/components/SourceHealthBadge.tsx denguesat-ciro/components/DegradedModeBanner.tsx
git commit -m "feat(ui): source health badge + degraded mode banner"
```

---

## Phase 7 — Antigravity trace viewer + agent chat

### Task 7.1: Trace viewer (`components/AntigravityTraceViewer.tsx`)

**Files:**
- Create: `denguesat-ciro/components/AntigravityTraceViewer.tsx`

- [ ] **Step 1: Write component**

```typescript
// components/AntigravityTraceViewer.tsx
import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { AntigravityTrace } from '../lib/types';

const TYPE_COLOR: Record<string, string> = {
  'master.start': '#3b82f6',
  'master.iter': '#8b5cf6',
  'master.done': '#10b981',
  'tool.start': '#f59e0b',
  'tool.done': '#10b981',
  'tool.error': '#ef4444',
  'system': '#6b7280',
};

export function AntigravityTraceViewer() {
  const traces = useCrisisStore((s: any) => s.antigravityTraces) as AntigravityTrace[];
  const theme = useTheme();
  const styles = makeStyles(theme);

  if (traces.length === 0) {
    return <Text style={styles.empty}>No traces yet. Run analysis to see Antigravity reasoning.</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      {traces.map((t, i) => (
        <Surface key={t.id} style={[styles.card, { borderLeftColor: TYPE_COLOR[t.type] ?? '#999' }]}>
          <View style={styles.header}>
            <Text style={[styles.tag, { color: TYPE_COLOR[t.type] }]}>{t.type}</Text>
            {t.agent && <Text style={styles.agent}>{t.agent}</Text>}
            <Text style={styles.time}>{new Date(t.timestamp).toLocaleTimeString()}</Text>
          </View>
          {t.thinking && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>💭 THINKING</Text>
              <Text style={styles.thinking}>{t.thinking}</Text>
            </View>
          )}
          {t.text && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>📝 MESSAGE</Text>
              <Text style={styles.text}>{t.text}</Text>
            </View>
          )}
          {t.toolCallsPlanned && t.toolCallsPlanned.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>🔧 CALLING</Text>
              <Text style={styles.text}>{t.toolCallsPlanned.join(', ')}</Text>
            </View>
          )}
          {t.reasoning && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>🧠 SUB-AGENT REASONING</Text>
              <Text style={styles.thinking}>{t.reasoning}</Text>
            </View>
          )}
          {t.output && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>📤 OUTPUT</Text>
              <Text style={styles.code}>{JSON.stringify(t.output, null, 2).slice(0, 500)}</Text>
            </View>
          )}
          {t.usage && (
            <Text style={styles.cost}>
              ${t.usage.costUSD.toFixed(5)} · {(t.usage.inputTokens + t.usage.outputTokens).toLocaleString()} tok
            </Text>
          )}
        </Surface>
      ))}
    </ScrollView>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1, padding: 12 },
    empty: { padding: 24, textAlign: 'center', color: theme.colors.onSurfaceVariant },
    card: { padding: 12, marginBottom: 10, borderRadius: 10, borderLeftWidth: 4, backgroundColor: theme.colors.surface, elevation: 1 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    tag: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
    agent: { marginLeft: 8, fontSize: 12, color: theme.colors.onSurface, fontWeight: '600' },
    time: { marginLeft: 'auto', fontSize: 11, color: theme.colors.onSurfaceVariant },
    section: { marginBottom: 6 },
    sectionLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.onSurfaceVariant, letterSpacing: 0.5, marginBottom: 2 },
    text: { fontSize: 13, color: theme.colors.onSurface, lineHeight: 18 },
    thinking: { fontSize: 12, color: theme.colors.onSurfaceVariant, lineHeight: 17, fontStyle: 'italic' },
    code: { fontFamily: 'monospace', fontSize: 11, color: theme.colors.onSurfaceVariant, backgroundColor: theme.colors.surfaceVariant, padding: 6, borderRadius: 4 },
    cost: { fontSize: 11, color: theme.colors.primary, marginTop: 6, fontWeight: '600' },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/components/AntigravityTraceViewer.tsx
git commit -m "feat(ui): Antigravity trace viewer with thinking + reasoning + cost"
```

---

### Task 7.2: Agent chat stream (`components/AgentChatStream.tsx`)

**Files:**
- Create: `denguesat-ciro/components/AgentChatStream.tsx`

- [ ] **Step 1: Write component**

```typescript
// components/AgentChatStream.tsx
import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { AntigravityTrace } from '../lib/types';

const AGENT_EMOJI: Record<string, string> = {
  master: '🧭',
  signal_fuse: '📡',
  outbreak_eye: '🔍',
  severity_mind: '🧠',
  resource_forge: '📋',
  crisis_sim: '⚡',
  recovery_guard: '🛡️',
  trend_spy: '📈',
  citizen_signal: '👤',
};

export function AgentChatStream() {
  const theme = useTheme();
  const traces = useCrisisStore((s: any) => s.antigravityTraces) as AntigravityTrace[];
  const styles = makeStyles(theme);

  const messages = traces
    .filter(t => t.text || t.reasoning || t.thinking || t.error)
    .map(t => ({
      id: t.id,
      agent: t.agent ?? (t.type.startsWith('master') ? 'master' : 'system'),
      content: t.text ?? t.reasoning ?? t.thinking ?? t.error ?? '',
      isMaster: t.type.startsWith('master'),
      timestamp: t.timestamp,
    }));

  return (
    <ScrollView style={styles.container}>
      {messages.map(m => (
        <View key={m.id} style={[styles.bubble, m.isMaster ? styles.bubbleMaster : styles.bubbleAgent]}>
          <Text style={styles.header}>
            {AGENT_EMOJI[m.agent] ?? '🤖'} {m.agent.toUpperCase()}
          </Text>
          <Text style={styles.content}>{m.content.slice(0, 600)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1, padding: 12 },
    bubble: { padding: 10, marginBottom: 8, borderRadius: 12, maxWidth: '92%' },
    bubbleMaster: { backgroundColor: theme.colors.primaryContainer, alignSelf: 'flex-end' },
    bubbleAgent: { backgroundColor: theme.colors.surfaceVariant, alignSelf: 'flex-start' },
    header: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4, color: theme.colors.onSurface },
    content: { fontSize: 13, color: theme.colors.onSurface, lineHeight: 18 },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/components/AgentChatStream.tsx
git commit -m "feat(ui): live agent chat stream view"
```

---

## Phase 8 — Urdu voice + PITB compare

### Task 8.1: Urdu voice alert (`components/UrduVoiceAlert.tsx`)

**Files:**
- Create: `denguesat-ciro/components/UrduVoiceAlert.tsx`

- [ ] **Step 1: Write component**

```typescript
// components/UrduVoiceAlert.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

export function UrduVoiceAlert({ urdu, english }: { urdu: string; english: string }) {
  const theme = useTheme();
  const [playingUrdu, setPlayingUrdu] = useState(false);
  const [playingEng, setPlayingEng] = useState(false);
  const styles = makeStyles(theme);

  const play = (text: string, lang: string, setter: (b: boolean) => void) => {
    Speech.stop();
    setter(true);
    Speech.speak(text, {
      language: lang,
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setter(false),
      onStopped: () => setter(false),
      onError: () => setter(false),
    });
  };

  return (
    <View>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.label}>اردو الرٹ</Text>
          <Pressable onPress={() => play(urdu, 'ur-PK', setPlayingUrdu)} style={styles.btn}>
            <Ionicons name={playingUrdu ? 'stop-circle' : 'play-circle'} size={28} color={theme.colors.primary} />
          </Pressable>
        </View>
        <Text style={styles.urdu}>{urdu}</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.label}>ENGLISH ALERT</Text>
          <Pressable onPress={() => play(english, 'en-US', setPlayingEng)} style={styles.btn}>
            <Ionicons name={playingEng ? 'stop-circle' : 'play-circle'} size={28} color={theme.colors.primary} />
          </Pressable>
        </View>
        <Text style={styles.eng}>{english}</Text>
      </View>
    </View>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    card: { padding: 14, marginBottom: 12, borderRadius: 12, backgroundColor: theme.colors.surface, elevation: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    label: { fontSize: 12, fontWeight: '700', color: theme.colors.onSurfaceVariant, letterSpacing: 1 },
    btn: { padding: 4 },
    urdu: { fontSize: 16, color: theme.colors.onSurface, lineHeight: 28, textAlign: 'right', writingDirection: 'rtl' },
    eng: { fontSize: 15, color: theme.colors.onSurface, lineHeight: 22 },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/components/UrduVoiceAlert.tsx
git commit -m "feat(ui): Urdu voice alert via expo-speech"
```

---

### Task 8.2: PITB comparison table (`components/PITBCompare.tsx`)

**Files:**
- Create: `denguesat-ciro/components/PITBCompare.tsx`

- [ ] **Step 1: Write component**

```typescript
// components/PITBCompare.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';

const ROWS = [
  { metric: 'Response Time', pitb: '7 days', us: '7 minutes' },
  { metric: 'Detection Mode', pitb: 'Reactive (post-hospitalization)', us: 'Proactive (pre-symptom satellite signal)' },
  { metric: 'Data Sources', pitb: 'Field worker reports only', us: 'NASA, OpenWeather, Maps, Hospital, Social, Trends' },
  { metric: 'AI Reasoning', pitb: 'None', us: 'Claude Sonnet 4.6 + extended thinking' },
  { metric: 'Coverage', pitb: 'Punjab only', us: 'All 4 provinces + ICT' },
  { metric: 'Language', pitb: 'English UI', us: 'Bilingual Urdu + English w/ voice alerts' },
  { metric: 'Stakeholder Coord', pitb: 'Manual phone calls', us: 'Auto-generated multi-stakeholder messages' },
  { metric: 'False Positive Handling', pitb: 'Manual review', us: 'Automated re-classification + retraction' },
];

export function PITBCompare() {
  const theme = useTheme();
  const styles = makeStyles(theme);
  return (
    <Surface style={styles.surface}>
      <Text style={styles.title}>PITB Dengue System vs DengueSat CIRO</Text>
      <View style={styles.row}>
        <Text style={[styles.cell, styles.headerCell, { flex: 1.2 }]}>Metric</Text>
        <Text style={[styles.cell, styles.headerCell, { flex: 1.5 }]}>PITB (existing)</Text>
        <Text style={[styles.cell, styles.headerCell, styles.usCell, { flex: 2 }]}>DengueSat</Text>
      </View>
      {ROWS.map(r => (
        <View key={r.metric} style={styles.row}>
          <Text style={[styles.cell, { flex: 1.2, fontWeight: '600' }]}>{r.metric}</Text>
          <Text style={[styles.cell, { flex: 1.5 }]}>{r.pitb}</Text>
          <Text style={[styles.cell, styles.usCell, { flex: 2 }]}>{r.us}</Text>
        </View>
      ))}
    </Surface>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    surface: { padding: 12, margin: 12, borderRadius: 12, backgroundColor: theme.colors.surface, elevation: 1 },
    title: { fontSize: 16, fontWeight: '700', color: theme.colors.onSurface, marginBottom: 12 },
    row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.outline },
    cell: { fontSize: 12, color: theme.colors.onSurface, paddingHorizontal: 4 },
    headerCell: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: theme.colors.onSurfaceVariant },
    usCell: { color: theme.colors.primary, fontWeight: '500' },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/components/PITBCompare.tsx
git commit -m "feat(ui): PITB vs DengueSat comparison table"
```

---

## Phase 9 — AR Scanner + Citizen tab

### Task 9.1: AR Puddle Scanner (`components/ARPuddleScanner.tsx`)

**Files:**
- Create: `denguesat-ciro/components/ARPuddleScanner.tsx`

- [ ] **Step 1: Write component**

```typescript
// components/ARPuddleScanner.tsx
import React, { useState, useRef } from 'react';
import { View, StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { callVision } from '../lib/claude-client';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { v4 as uuid } from 'uuid';

export function ARPuddleScanner() {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { selectedDistrict, addCitizenReport } = useCrisisStore() as any;
  const styles = makeStyles(theme);

  if (!permission) return <Text>Loading…</Text>;
  if (!permission.granted) {
    return (
      <Surface style={styles.card}>
        <Text style={styles.title}>Camera Permission Required</Text>
        <Text style={styles.body}>Scanner needs camera access to analyze breeding sites.</Text>
        <Pressable style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </Pressable>
      </Surface>
    );
  }

  const capture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
    setPhotoUri(photo.uri);
    setAnalyzing(true);
    try {
      const r = await callVision(
        photo.base64,
        'Citizen-captured potential breeding site',
        selectedDistrict ? { lat: selectedDistrict.lat, lng: selectedDistrict.lng, district: selectedDistrict.name } : {},
      );
      setResult(r);
      addCitizenReport({
        id: uuid(),
        timestamp: Date.now(),
        photoBase64: photo.base64,
        text: 'AR scanner capture',
        location: selectedDistrict ?? { lat: 0, lng: 0, district: 'unknown' },
        visionResult: { riskScore: r.riskScore, breedingLikelihood: r.breedingLikelihood, recommendation: r.recommendation },
        accepted: r.accepted ?? true,
      });
    } catch (e) {
      setResult({ error: String(e) });
    }
    setAnalyzing(false);
  };

  if (photoUri) {
    return (
      <View style={styles.resultContainer}>
        <Image source={{ uri: photoUri }} style={styles.preview} />
        {analyzing && <ActivityIndicator size="large" color={theme.colors.primary} />}
        {result && !analyzing && (
          <Surface style={styles.resultCard}>
            <Text style={styles.resultLabel}>BREEDING RISK</Text>
            <Text style={[styles.resultScore, { color: result.riskScore > 70 ? '#ef4444' : result.riskScore > 40 ? '#f59e0b' : '#10b981' }]}>
              {result.riskScore}/100
            </Text>
            <Text style={styles.resultLikelihood}>{result.breedingLikelihood?.toUpperCase()}</Text>
            <Text style={styles.resultRec}>{result.recommendation}</Text>
            <Pressable onPress={() => { setPhotoUri(null); setResult(null); }} style={styles.btn}>
              <Text style={styles.btnText}>Scan Again</Text>
            </Pressable>
          </Surface>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.overlay}>
          <Text style={styles.hint}>Point at puddles, garbage, standing water</Text>
        </View>
        <Pressable onPress={capture} style={styles.shutter}>
          <Ionicons name="radio-button-on" size={72} color="#fff" />
        </Pressable>
      </CameraView>
    </View>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    camera: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
    overlay: { position: 'absolute', top: 40, left: 0, right: 0, alignItems: 'center' },
    hint: { color: '#fff', fontSize: 14, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    shutter: { marginBottom: 40 },
    resultContainer: { flex: 1, padding: 16 },
    preview: { width: '100%', height: 280, borderRadius: 12 },
    resultCard: { padding: 16, marginTop: 16, borderRadius: 12, backgroundColor: theme.colors.surface, alignItems: 'center' },
    resultLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: theme.colors.onSurfaceVariant },
    resultScore: { fontSize: 48, fontWeight: '900', marginVertical: 4 },
    resultLikelihood: { fontSize: 14, fontWeight: '700', color: theme.colors.onSurface, marginBottom: 8 },
    resultRec: { fontSize: 14, color: theme.colors.onSurface, textAlign: 'center', lineHeight: 20 },
    card: { padding: 16, margin: 16, borderRadius: 12, backgroundColor: theme.colors.surface },
    title: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: theme.colors.onSurface },
    body: { fontSize: 14, color: theme.colors.onSurfaceVariant, marginBottom: 12 },
    btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: theme.colors.primary, alignItems: 'center', marginTop: 10 },
    btnText: { color: '#fff', fontWeight: '600' },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/components/ARPuddleScanner.tsx
git commit -m "feat(ui): AR puddle scanner with Claude Vision"
```

---

### Task 9.2: Citizen reporter form (`components/CitizenReportForm.tsx`)

**Files:**
- Create: `denguesat-ciro/components/CitizenReportForm.tsx`

- [ ] **Step 1: Write component**

```typescript
// components/CitizenReportForm.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Image, ScrollView, TextInput } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { callVision } from '../lib/claude-client';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { v4 as uuid } from 'uuid';

export function CitizenReportForm() {
  const theme = useTheme();
  const [image, setImage] = useState<{ uri: string; base64: string } | null>(null);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<any>(null);
  const { selectedDistrict, addCitizenReport } = useCrisisStore() as any;
  const styles = makeStyles(theme);

  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5, base64: true });
    if (!r.canceled && r.assets[0]) setImage({ uri: r.assets[0].uri, base64: r.assets[0].base64! });
  };

  const submit = async () => {
    if (!image || !text.trim()) return;
    setSubmitting(true);
    try {
      const r = await callVision(image.base64, text, selectedDistrict ?? {});
      addCitizenReport({
        id: uuid(),
        timestamp: Date.now(),
        photoBase64: image.base64,
        text,
        location: selectedDistrict ?? { lat: 0, lng: 0, district: 'unknown' },
        visionResult: { riskScore: r.riskScore, breedingLikelihood: r.breedingLikelihood, recommendation: r.recommendation },
        accepted: r.accepted ?? true,
      });
      setSubmitted(r);
    } catch (e) {
      setSubmitted({ error: String(e) });
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <Surface style={styles.card}>
        <Text style={styles.title}>Report Submitted</Text>
        {submitted.error ? (
          <Text style={styles.body}>Error: {submitted.error}</Text>
        ) : (
          <>
            <Text style={styles.body}>Risk score: {submitted.riskScore}/100</Text>
            <Text style={styles.body}>Likelihood: {submitted.breedingLikelihood}</Text>
            <Text style={styles.body}>{submitted.recommendation}</Text>
          </>
        )}
        <Pressable onPress={() => { setImage(null); setText(''); setSubmitted(null); }} style={styles.btn}>
          <Text style={styles.btnText}>Submit Another</Text>
        </Pressable>
      </Surface>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.card}>
        <Text style={styles.title}>Report a Breeding Site</Text>
        <Pressable onPress={pickImage} style={styles.imagePicker}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.thumb} />
          ) : (
            <Text style={styles.imagePickerText}>📸 Tap to select photo</Text>
          )}
        </Pressable>
        <TextInput
          placeholder="Describe what you see (e.g., 'stagnant water in plot, mosquitoes everywhere')"
          value={text}
          onChangeText={setText}
          style={styles.input}
          multiline
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />
        <Pressable onPress={submit} disabled={!image || !text.trim() || submitting} style={[styles.btn, (!image || !text.trim() || submitting) && styles.btnDisabled]}>
          <Text style={styles.btnText}>{submitting ? 'Analyzing…' : 'Submit Report'}</Text>
        </Pressable>
      </Surface>
    </ScrollView>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1, padding: 12 },
    card: { padding: 16, borderRadius: 12, backgroundColor: theme.colors.surface, elevation: 1 },
    title: { fontSize: 18, fontWeight: '700', color: theme.colors.onSurface, marginBottom: 12 },
    body: { fontSize: 14, color: theme.colors.onSurface, marginBottom: 6 },
    imagePicker: { height: 180, borderRadius: 8, borderWidth: 2, borderColor: theme.colors.outline, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    imagePickerText: { color: theme.colors.onSurfaceVariant, fontSize: 14 },
    thumb: { width: '100%', height: '100%', borderRadius: 8 },
    input: { borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 8, padding: 10, minHeight: 80, color: theme.colors.onSurface, marginBottom: 12 },
    btn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: theme.colors.primary, alignItems: 'center' },
    btnDisabled: { opacity: 0.5 },
    btnText: { color: '#fff', fontWeight: '600' },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/components/CitizenReportForm.tsx
git commit -m "feat(ui): citizen report form with image upload + Vision analysis"
```

---

### Task 9.3: Citizen tab (`app/(tabs)/citizen.tsx`)

**Files:**
- Create: `denguesat-ciro/app/(tabs)/citizen.tsx`
- Modify: `denguesat-ciro/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Write tab screen**

```typescript
// app/(tabs)/citizen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { ARPuddleScanner } from '../../components/ARPuddleScanner';
import { CitizenReportForm } from '../../components/CitizenReportForm';

export default function CitizenScreen() {
  const [mode, setMode] = useState<'scanner' | 'report'>('scanner');
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.tabBar, { backgroundColor: theme.colors.surface }]}>
        <Pressable onPress={() => setMode('scanner')} style={[styles.tab, mode === 'scanner' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}>
          <Text style={[styles.tabText, { color: mode === 'scanner' ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>📷 AR Scanner</Text>
        </Pressable>
        <Pressable onPress={() => setMode('report')} style={[styles.tab, mode === 'report' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}>
          <Text style={[styles.tabText, { color: mode === 'report' ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>✍️ Report Form</Text>
        </Pressable>
      </View>
      <View style={styles.body}>
        {mode === 'scanner' ? <ARPuddleScanner /> : <CitizenReportForm />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { flexDirection: 'row' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  body: { flex: 1 },
});
```

- [ ] **Step 2: Add Citizen tab to `(tabs)/_layout.tsx`**

In `app/(tabs)/_layout.tsx`, append before closing `</Tabs>`:

```typescript
<Tabs.Screen
  name="citizen"
  options={{
    title: 'Citizen Hub',
    tabBarLabel: 'Citizen',
    tabBarIcon: ({ color, focused }) => (
      <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
    ),
  }}
/>
```

- [ ] **Step 3: Commit**

```bash
git add denguesat-ciro/app/\(tabs\)/citizen.tsx denguesat-ciro/app/\(tabs\)/_layout.tsx
git commit -m "feat(ui): Citizen tab combining AR scanner + report form"
```

---

## Phase 10 — Refactor existing agents (use proxy)

### Task 10.1: BaseAgent rewrite (`lib/agents/BaseAgent.ts`)

**Files:**
- Modify: `denguesat-ciro/lib/agents/BaseAgent.ts`

- [ ] **Step 1: Replace contents**

```typescript
// lib/agents/BaseAgent.ts
import { useCrisisStore } from '../../hooks/useCrisisStore';
import { callAgentTool } from '../claude-client';
import { v4 as uuid } from 'uuid';
import { AgentName, AgentStatus, TraceType } from '../types';

export abstract class BaseAgent {
  abstract name: AgentName;
  abstract toolName: string;

  protected log(message: string, type: TraceType = 'reasoning', data?: Record<string, unknown>) {
    useCrisisStore.getState().addAgentTrace?.({
      id: uuid(),
      agent: this.name,
      message,
      type,
      timestamp: new Date().toISOString(),
      data,
    });
  }

  protected setStatus(status: AgentStatus) {
    useCrisisStore.getState().updateAgentStatus?.(this.name, status);
  }

  protected async reason<T>(input: any): Promise<T> {
    this.setStatus('processing');
    this.log(`Calling ${this.toolName} via proxy…`, 'reasoning');
    try {
      const r = await callAgentTool(this.toolName, input);
      this.log(`Received output (cost $${r.usage?.costUSD?.toFixed(5) ?? 'n/a'})`, 'success');
      this.setStatus('done');
      return r.output as T;
    } catch (err) {
      this.log(`Error: ${String(err)}`, 'decision');
      this.setStatus('error' as any);
      throw err;
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/lib/agents/BaseAgent.ts
git commit -m "refactor(agents): BaseAgent now calls real Claude via proxy"
```

---

### Task 10.2: Refactor 6 agents to use new BaseAgent

**Files:**
- Modify: `denguesat-ciro/lib/agents/SignalFuse.ts`
- Modify: `denguesat-ciro/lib/agents/OutbreakEye.ts`
- Modify: `denguesat-ciro/lib/agents/SeverityMind.ts`
- Modify: `denguesat-ciro/lib/agents/ResourceForge.ts`
- Modify: `denguesat-ciro/lib/agents/CrisisSim.ts`
- Modify: `denguesat-ciro/lib/agents/RecoveryGuard.ts`
- Modify: `denguesat-ciro/lib/agents/TrendSpy.ts`
- Create: `denguesat-ciro/lib/agents/CitizenSignal.ts`

- [ ] **Step 1: Rewrite SignalFuse**

```typescript
// lib/agents/SignalFuse.ts
import { BaseAgent } from './BaseAgent';
import { AgentName } from '../types';

export class SignalFuse extends BaseAgent {
  name: AgentName = 'SignalFuse';
  toolName = 'signal_fuse';

  async run(rawData: any) {
    return this.reason({ rawData });
  }
}
```

- [ ] **Step 2: Rewrite OutbreakEye**

```typescript
// lib/agents/OutbreakEye.ts
import { BaseAgent } from './BaseAgent';
import { AgentName } from '../types';

export class OutbreakEye extends BaseAgent {
  name: AgentName = 'OutbreakEye';
  toolName = 'outbreak_eye';

  async run(fusedSignal: any) {
    return this.reason({ fusedSignal });
  }
}
```

- [ ] **Step 3: Rewrite SeverityMind**

```typescript
// lib/agents/SeverityMind.ts
import { BaseAgent } from './BaseAgent';
import { AgentName } from '../types';

export class SeverityMind extends BaseAgent {
  name: AgentName = 'SeverityMind';
  toolName = 'severity_mind';

  async run(crises: any[]) {
    return this.reason({ crises });
  }
}
```

- [ ] **Step 4: Rewrite ResourceForge**

```typescript
// lib/agents/ResourceForge.ts
import { BaseAgent } from './BaseAgent';
import { AgentName } from '../types';

export class ResourceForge extends BaseAgent {
  name: AgentName = 'ResourceForge';
  toolName = 'resource_forge';

  async run(payload: { crises: any[]; assessments: any[] }) {
    return this.reason(payload);
  }
}
```

- [ ] **Step 5: Rewrite CrisisSim**

```typescript
// lib/agents/CrisisSim.ts
import { BaseAgent } from './BaseAgent';
import { AgentName } from '../types';

export class CrisisSim extends BaseAgent {
  name: AgentName = 'CrisisSim';
  toolName = 'crisis_sim';

  async run(payload: { allocation: any; crises: any[] }) {
    return this.reason(payload);
  }
}
```

- [ ] **Step 6: Rewrite RecoveryGuard**

```typescript
// lib/agents/RecoveryGuard.ts
import { BaseAgent } from './BaseAgent';
import { AgentName } from '../types';

export class RecoveryGuard extends BaseAgent {
  name: AgentName = 'RecoveryGuard';
  toolName = 'recovery_guard';

  async run(payload: { crises: any[]; newEvidence?: any[] }) {
    return this.reason(payload);
  }
}
```

- [ ] **Step 7: Rewrite TrendSpy**

```typescript
// lib/agents/TrendSpy.ts
import { BaseAgent } from './BaseAgent';
import { AgentName } from '../types';

export class TrendSpy extends BaseAgent {
  name: AgentName = 'TrendSpy';
  toolName = 'trend_spy';

  async run(keyword: string) {
    return this.reason({ keyword });
  }
}
```

- [ ] **Step 8: Create CitizenSignal**

```typescript
// lib/agents/CitizenSignal.ts
import { BaseAgent } from './BaseAgent';
import { AgentName } from '../types';

export class CitizenSignal extends BaseAgent {
  name: AgentName = 'CitizenSignal' as AgentName;
  toolName = 'citizen_signal';

  async run(payload: { reports: any[] }) {
    return this.reason(payload);
  }
}
```

- [ ] **Step 9: Commit**

```bash
git add denguesat-ciro/lib/agents
git commit -m "refactor(agents): all 8 agents now call Claude via proxy"
```

---

### Task 10.3: Old orchestrator deprecation (`lib/orchestrator.ts`)

**Files:**
- Modify: `denguesat-ciro/lib/orchestrator.ts`

- [ ] **Step 1: Replace contents (delegate to Antigravity runtime)**

```typescript
// lib/orchestrator.ts
import { antigravity } from './antigravity';

/**
 * Legacy orchestrator interface preserved.
 * Delegates to the new Antigravity runtime.
 */
export class AntigravityOrchestrator {
  async runPipeline(): Promise<void> {
    await antigravity.runFullPipeline();
  }
}

export const orchestrator = new AntigravityOrchestrator();
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/lib/orchestrator.ts
git commit -m "refactor(orchestrator): delegate to new Antigravity runtime"
```

---

## Phase 11 — Wire Intel screen with new components

### Task 11.1: Update Intel home screen (`app/(tabs)/index.tsx`)

**Files:**
- Modify: `denguesat-ciro/app/(tabs)/index.tsx`

- [ ] **Step 1: Read current screen**

Run: `cat denguesat-ciro/app/\(tabs\)/index.tsx | head -50`
Capture existing layout.

- [ ] **Step 2: Insert ProvincePicker + CostDashboard + DegradedModeBanner at top, wire Run Analysis to antigravity.runFullPipeline()**

Edit `app/(tabs)/index.tsx`. Add imports at top:

```typescript
import { ProvincePicker } from '../../components/ProvincePicker';
import { CostDashboard } from '../../components/CostDashboard';
import { DegradedModeBanner } from '../../components/DegradedModeBanner';
import { antigravity } from '../../lib/antigravity';
```

In the screen body, render in order:
```typescript
<DegradedModeBanner />
<ProvincePicker />
<CostDashboard />
{/* existing DRI gauge / cards / etc preserved below */}
```

Wire Run Analysis button:
```typescript
onPress={() => antigravity.runFullPipeline()}
```

- [ ] **Step 3: Commit**

```bash
git add denguesat-ciro/app/\(tabs\)/index.tsx
git commit -m "feat(ui): wire Intel screen to Antigravity runtime + new components"
```

---

### Task 11.2: Update Logs/Traces screen (`app/(tabs)/traces.tsx`)

**Files:**
- Modify: `denguesat-ciro/app/(tabs)/traces.tsx`

- [ ] **Step 1: Replace with two-pane (Trace viewer + Agent chat)**

Edit `app/(tabs)/traces.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { AntigravityTraceViewer } from '../../components/AntigravityTraceViewer';
import { AgentChatStream } from '../../components/AgentChatStream';

export default function TracesScreen() {
  const theme = useTheme();
  const [mode, setMode] = useState<'trace' | 'chat'>('trace');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.tabBar, { backgroundColor: theme.colors.surface }]}>
        <Pressable onPress={() => setMode('trace')} style={[styles.tab, mode === 'trace' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}>
          <Text style={[styles.tabText, { color: mode === 'trace' ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>🧭 Antigravity Trace</Text>
        </Pressable>
        <Pressable onPress={() => setMode('chat')} style={[styles.tab, mode === 'chat' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}>
          <Text style={[styles.tabText, { color: mode === 'chat' ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>💬 Agent Chat</Text>
        </Pressable>
      </View>
      {mode === 'trace' ? <AntigravityTraceViewer /> : <AgentChatStream />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { flexDirection: 'row' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '600' },
});
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/app/\(tabs\)/traces.tsx
git commit -m "feat(ui): Logs tab shows AntigravityTraceViewer + AgentChatStream"
```

---

### Task 11.3: Update Alerts screen w/ Urdu voice (`app/(tabs)/alerts.tsx`)

**Files:**
- Modify: `denguesat-ciro/app/(tabs)/alerts.tsx`

- [ ] **Step 1: Read current alerts screen**

Run: `cat denguesat-ciro/app/\(tabs\)/alerts.tsx | head -80`

- [ ] **Step 2: Replace static alert renderer with UrduVoiceAlert**

In the alerts screen, import + use UrduVoiceAlert for each generated alert:

```typescript
import { UrduVoiceAlert } from '../../components/UrduVoiceAlert';

// In the render where alerts are listed:
<UrduVoiceAlert
  urdu={alert.urdu}
  english={alert.english}
/>
```

If current alerts screen uses pre-canned data, also pull from `useCrisisStore.currentAnalysis.stakeholderMessages.publicUrdu / publicEnglish`.

- [ ] **Step 3: Commit**

```bash
git add denguesat-ciro/app/\(tabs\)/alerts.tsx
git commit -m "feat(ui): Alerts screen plays Urdu+Eng via TTS"
```

---

### Task 11.4: Update Recovery screen w/ PITB compare (`app/(tabs)/recovery.tsx`)

**Files:**
- Modify: `denguesat-ciro/app/(tabs)/recovery.tsx`

- [ ] **Step 1: Add SourceHealth row + PITBCompare**

In Recovery screen, add imports:

```typescript
import { PITBCompare } from '../../components/PITBCompare';
import { SourceHealthBadge } from '../../components/SourceHealthBadge';
import { useCrisisStore } from '../../hooks/useCrisisStore';
```

Render at top of scroll:

```typescript
const health = useCrisisStore((s: any) => s.sourceHealth);
// ...
<View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 12 }}>
  <SourceHealthBadge name="NASA" status={health.nasa} />
  <SourceHealthBadge name="OpenWx" status={health.openweather} />
  <SourceHealthBadge name="Maps" status={health.maps} />
  <SourceHealthBadge name="Firebase" status={health.firebase} />
  <SourceHealthBadge name="Trends" status={health.trends} />
  <SourceHealthBadge name="Social" status={health.social} />
</View>
<PITBCompare />
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/app/\(tabs\)/recovery.tsx
git commit -m "feat(ui): Recovery shows source health + PITB comparison"
```

---

## Phase 12 — Scenarios (mandatory by challenge)

### Task 12.1: Scenario fixtures + injector (`lib/scenarios.ts`)

**Files:**
- Create: `denguesat-ciro/mock-data/scenarios/dual-crisis.json`
- Create: `denguesat-ciro/mock-data/scenarios/false-alarm.json`
- Create: `denguesat-ciro/mock-data/scenarios/api-failure.json`
- Create: `denguesat-ciro/mock-data/scenarios/hospital-rush.json`
- Create: `denguesat-ciro/lib/scenarios.ts`

- [ ] **Step 1: Write dual-crisis fixture**

```json
{
  "id": "dual-crisis",
  "label": "Dual Crisis (Korangi dengue + Clifton heatwave)",
  "description": "Two simultaneous crises competing for limited resources.",
  "injectInto": "prefetchedData",
  "data": {
    "location": { "province": "Sindh", "city": "Karachi", "district": "Korangi", "lat": 24.83, "lng": 67.07, "population": 3128971 },
    "secondary": { "province": "Sindh", "city": "Karachi", "district": "Clifton", "lat": 24.81, "lng": 67.02, "population": 850000 },
    "primary_climate": { "temp": 33, "humidity": 85, "rainfall": 28 },
    "secondary_climate": { "temp": 47, "humidity": 40, "rainfall": 0 },
    "hospital_load_pct": 89
  }
}
```

- [ ] **Step 2: Write false-alarm fixture**

```json
{
  "id": "false-alarm",
  "label": "False Alarm (Water-main burst misread as dengue)",
  "description": "Field verification reveals broken pipe in Block A, not dengue.",
  "injectInto": "newEvidence",
  "data": {
    "evidence": [{ "type": "field_report", "source": "utility-board", "location": "Korangi Block A", "claim": "broken water main confirmed", "timestamp": "2026-05-14T14:00:00Z" }]
  }
}
```

- [ ] **Step 3: Write api-failure fixture**

```json
{
  "id": "api-failure",
  "label": "API Failure (NASA POWER down)",
  "description": "Force NASA fetch to fail, system falls back to cached data.",
  "injectInto": "forceFailure",
  "data": { "source": "nasa" }
}
```

- [ ] **Step 4: Write hospital-rush fixture**

```json
{
  "id": "hospital-rush",
  "label": "Hospital Rush (Public alert cascades into ER congestion)",
  "description": "Public alert sent → mass ER visits → congestion side effect detected.",
  "injectInto": "sideEffect",
  "data": { "hospital_overflow_pct": 145, "wait_time_min": 180 }
}
```

- [ ] **Step 5: Write scenario injector**

```typescript
// lib/scenarios.ts
import dualCrisis from '../mock-data/scenarios/dual-crisis.json';
import falseAlarm from '../mock-data/scenarios/false-alarm.json';
import apiFailure from '../mock-data/scenarios/api-failure.json';
import hospitalRush from '../mock-data/scenarios/hospital-rush.json';
import { ScenarioId } from './types';

export const SCENARIOS = {
  'dual-crisis': dualCrisis,
  'false-alarm': falseAlarm,
  'api-failure': apiFailure,
  'hospital-rush': hospitalRush,
};

export function getScenario(id: ScenarioId) {
  if (id === 'live') return null;
  return SCENARIOS[id];
}
```

- [ ] **Step 6: Commit**

```bash
git add denguesat-ciro/mock-data/scenarios denguesat-ciro/lib/scenarios.ts
git commit -m "feat(scenarios): 4 mandatory stress-test scenario fixtures"
```

---

### Task 12.2: Wire scenarios into orchestrator

**Files:**
- Modify: `denguesat-ciro/lib/antigravity.ts`

- [ ] **Step 1: Import + apply scenario merge**

At top of `lib/antigravity.ts`:

```typescript
import { getScenario } from './scenarios';
```

In `runFullPipeline`, after building `prefetchedData`, insert:

```typescript
const scenarioId = store.scenarioId;
const scenario = getScenario(scenarioId);
if (scenario) {
  if (scenario.injectInto === 'prefetchedData') {
    Object.assign(prefetchedData, scenario.data);
  }
  if (scenario.injectInto === 'forceFailure') {
    const src = (scenario.data as any).source;
    if (src && prefetchedData[src]) prefetchedData[src] = { error: 'simulated_failure' };
    store.setSourceStatus(src, 'failed');
  }
  // newEvidence + sideEffect handled by RecoveryGuard / CrisisSim downstream
  store.addAntigravityTrace({
    id: 'scenario-' + scenarioId,
    type: 'system',
    runId: '',
    text: `Scenario injected: ${scenario.label}`,
    timestamp: Date.now(),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/lib/antigravity.ts
git commit -m "feat(scenarios): wire scenario injection into orchestrator"
```

---

### Task 12.3: Scenario selector in Recovery screen

**Files:**
- Modify: `denguesat-ciro/components/ScenarioSelector.tsx`

- [ ] **Step 1: Update existing ScenarioSelector to use new SCENARIOS list**

```typescript
// components/ScenarioSelector.tsx
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { SCENARIOS } from '../lib/scenarios';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { ScenarioId } from '../lib/types';

const SCENARIO_IDS: ScenarioId[] = ['live', 'dual-crisis', 'false-alarm', 'api-failure', 'hospital-rush'];

export function ScenarioSelector() {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const current = useCrisisStore((s: any) => s.scenarioId);
  const setScenario = useCrisisStore((s: any) => s.setScenario);

  return (
    <Surface style={styles.surface}>
      <Text style={styles.title}>Scenario</Text>
      {SCENARIO_IDS.map(id => {
        const sc = id === 'live' ? null : (SCENARIOS as any)[id];
        const label = sc?.label ?? 'Live (no injection)';
        return (
          <Pressable key={id} onPress={() => setScenario(id)} style={[styles.row, current === id && styles.rowActive]}>
            <Text style={styles.rowText}>{label}</Text>
          </Pressable>
        );
      })}
    </Surface>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    surface: { padding: 12, margin: 12, borderRadius: 12, backgroundColor: theme.colors.surface, elevation: 1 },
    title: { fontSize: 16, fontWeight: '700', color: theme.colors.onSurface, marginBottom: 10 },
    row: { padding: 12, marginVertical: 4, borderRadius: 8, backgroundColor: theme.colors.surfaceVariant },
    rowActive: { backgroundColor: theme.colors.primaryContainer },
    rowText: { fontSize: 14, color: theme.colors.onSurface },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/components/ScenarioSelector.tsx
git commit -m "refactor(scenarios): ScenarioSelector wired to new scenario fixtures"
```

---

## Phase 13 — Antigravity trace export

### Task 13.1: Export bundle utility (`lib/antigravity-export.ts`)

**Files:**
- Create: `denguesat-ciro/lib/antigravity-export.ts`

- [ ] **Step 1: Write export utility**

```typescript
// lib/antigravity-export.ts
import * as FileSystem from 'expo-file-system';
import { useCrisisStore } from '../hooks/useCrisisStore';

export async function exportAntigravityBundle(): Promise<string> {
  const state = useCrisisStore.getState() as any;
  const bundle = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    location: state.selectedDistrict,
    scenarioId: state.scenarioId,
    cost: state.cost,
    sourceHealth: state.sourceHealth,
    traces: state.antigravityTraces,
    citizenReports: state.citizenReports,
  };

  const path = `${FileSystem.documentDirectory}antigravity-bundle-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(path, JSON.stringify(bundle, null, 2));
  return path;
}
```

- [ ] **Step 2: Add export button to Logs tab**

Modify `app/(tabs)/traces.tsx`:

```typescript
import { exportAntigravityBundle } from '../../lib/antigravity-export';
import { Share } from 'react-native';

// Add to tabBar row:
<Pressable
  onPress={async () => {
    const path = await exportAntigravityBundle();
    await Share.share({ url: path, title: 'Antigravity Trace Bundle' });
  }}
  style={styles.tab}
>
  <Text style={[styles.tabText, { color: theme.colors.primary }]}>📦 Export</Text>
</Pressable>
```

- [ ] **Step 3: Commit**

```bash
git add denguesat-ciro/lib/antigravity-export.ts denguesat-ciro/app/\(tabs\)/traces.tsx
git commit -m "feat(export): Antigravity trace bundle export to JSON"
```

---

## Phase 14 — README, demo prep, APK build

### Task 14.1: Write comprehensive README

**Files:**
- Modify: `denguesat-ciro/README.md`

- [ ] **Step 1: Replace existing README with new structure**

Write `denguesat-ciro/README.md` (full new content; see Section 3 of design doc for required README content). Sections:
1. Pitch (Pakistan's first AI dengue intelligence)
2. Architecture diagram (ASCII same as design Section 2)
3. Agent table (8 agents w/ Urdu names)
4. Data sources table (NASA POWER, OpenWeather, Google Maps, Firebase RTDB, Google Trends, Synth posts)
5. DRI formula (5-factor with weights)
6. Multi-crisis handling
7. False-positive recovery flow
8. Degraded mode behavior
9. Pakistan dengue statistics (province-wise)
10. Privacy note (zero personal data)
11. Quick start (`expo install`, set `.env.local`, `npx expo start`)
12. Antigravity usage (IDE + runtime tool-use)
13. Cost/latency analysis (per-run $0.10-0.15, <30s)
14. Scalability discussion
15. Assumptions and limitations
16. Tech stack table
17. Submission deliverables

Write the full README content (not placeholder — copy from design doc Section 6.7 + expand each section to 2-4 paragraphs).

- [ ] **Step 2: Commit**

```bash
git add denguesat-ciro/README.md
git commit -m "docs: comprehensive README for submission"
```

---

### Task 14.2: APK build via EAS

**Files:**
- Create: `denguesat-ciro/eas.json`

- [ ] **Step 1: Install EAS CLI**

Run: `npm install -g eas-cli`

- [ ] **Step 2: Login + configure**

Run: `eas login` then `eas build:configure`. Choose Android.

- [ ] **Step 3: Write `eas.json`**

```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "preview": {
      "android": { "buildType": "apk" },
      "distribution": "internal"
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

- [ ] **Step 4: Build APK preview**

Run: `eas build -p android --profile preview`
Wait ~15min. Download APK from URL given by CLI.

- [ ] **Step 5: Test on physical Android device**

Install APK → launch → run E2E checklist from design Section 6.3.

- [ ] **Step 6: Commit**

```bash
git add denguesat-ciro/eas.json
git commit -m "build: EAS configuration for Android APK"
```

---

### Task 14.3: Demo video script + recording

**Files:**
- Create: `denguesat-ciro/submission/demo-script.md`

- [ ] **Step 1: Write demo script (3-5 min)**

Create `submission/demo-script.md`:

```markdown
# DengueSat Demo Script (4 min target)

## 0:00-0:20 — Hook
"Pakistan loses 33,000 people to dengue per year. PITB takes 7 days to detect outbreaks reactively from hospital reports. DengueSat detects in 7 minutes from satellite data, proactively, before symptoms appear."

[show splash → Intel tab w/ DRI gauge]

## 0:20-0:50 — Province pick + run analysis
- Select Sindh → Karachi → Korangi
- Tap "Run Analysis"
- Show 6 data sources prefetching live (NASA POWER, OpenWeather, Maps, Firebase hospital, Google Trends, synth posts)

## 0:50-1:40 — Antigravity orchestration
- Switch to Logs tab
- Master Coordinator emits thinking blocks
- Each of 8 sub-agents executes as a tool call (signal_fuse → outbreak_eye → severity_mind → resource_forge → crisis_sim → recovery_guard)
- SeverityMind shows full 5-factor DRI reasoning trace
- Final DRI = 86, CRITICAL, EMERGENCY protocol

## 1:40-2:20 — Multi-crisis trade-off
- Switch scenario to "Dual Crisis"
- Re-run analysis
- ResourceForge allocates 5/8 trucks + 8/15 ambulances to Korangi (CRITICAL) vs 3/8 + 4/15 to Clifton (HIGH heatwave)
- Tradeoff narrative shown

## 2:20-2:50 — Stakeholder alerts (Urdu+English voice)
- Alerts tab
- Tap Urdu play button → Urdu TTS plays
- Show WhatsApp-style alert card

## 2:50-3:20 — False positive recovery
- Switch scenario to "False Alarm"
- RecoveryGuard reclassifies Korangi Block A as INFRASTRUCTURE_FAILURE
- Public retraction generated + utility notified

## 3:20-3:40 — Robustness demo
- Switch scenario to "API Failure"
- Yellow degraded-mode banner appears
- App continues with cached intelligence

## 3:40-4:00 — Citizen + AR scanner + cost dashboard
- Citizen tab → AR scanner → point at puddle → Claude Vision returns risk score
- Show cost dashboard ticked $0.13 across run

## 4:00 — Outro
"Antigravity-orchestrated, satellite-powered, Pakistan-first. DengueSat."
```

- [ ] **Step 2: Record video**

Manual action: record screen via OBS or built-in Android screen recorder while running APK on device. Edit to 3-5 min in DaVinci Resolve or similar. Save to `submission/demo.mp4`.

- [ ] **Step 3: Commit script**

```bash
git add denguesat-ciro/submission/demo-script.md
git commit -m "docs: demo video script"
```

---

### Task 14.4: Final submission bundle

**Files:**
- Create: `denguesat-ciro/submission/README.md`

- [ ] **Step 1: Write submission README**

Create `submission/README.md`:

```markdown
# DengueSat CIRO — AI-Seekho 2026 Submission

## Files included
- `denguesat-v1.0.apk` — Android install file
- `demo.mp4` — 3-5 min demo video
- `antigravity-trace-bundle.json` — exported Antigravity traces
- `source-code.zip` — full source (no node_modules, no .env)
- `README.md` — comprehensive documentation
- `architecture.png` — system diagram

## How to install
1. Download `denguesat-v1.0.apk` on Android device
2. Enable "Install from unknown sources" in Settings
3. Tap APK → install → launch
4. Province picker on home screen
5. Tap "Run Analysis" to see live Antigravity orchestration

## Antigravity workspace
Open `denguesat-ciro/` in Google Antigravity IDE to see parallel dev session traces.

## Contact
ibrahimsamad507@gmail.com
```

- [ ] **Step 2: Export Antigravity bundle from app**

Run app → Logs tab → tap Export → share to file system.

- [ ] **Step 3: Zip source**

Run:
```bash
cd C:/Users/ibrah/Desktop/ai-seekho
zip -r submission/denguesat-source.zip denguesat-ciro -x 'denguesat-ciro/node_modules/*' 'denguesat-ciro/.env*' 'denguesat-ciro/.superpowers/*' 'denguesat-ciro/.expo/*'
```

- [ ] **Step 4: Commit**

```bash
git add denguesat-ciro/submission/README.md
git commit -m "docs: final submission bundle README"
```

---

## Self-Review

- All spec sections covered (architecture, components, data flow, error handling, testing): YES — Phases 0-14 map directly.
- No placeholders, no TBD: VERIFIED.
- Type consistency: `AntigravityTrace`, `CitizenReport`, `SourceHealth`, `CostState`, `Province`/`City`/`District` defined in Phase 4.1 used consistently across Phases 5-13.
- Method signatures: `antigravity.runFullPipeline()` defined Phase 5.4, called Phase 11.1 + 10.3. `callAgentTool(name, input)` defined Phase 5.2, used Phase 10.1. `callVision(image, text, location)` defined Phase 5.2, used Phase 9.1 + 9.2. Consistent.
- Spec coverage: all 5 design sections + scenarios + bonuses covered.

---

## Execution
