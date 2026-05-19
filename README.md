<div align="center">

# DengueSat CIRO

### Crisis Intelligence & Response Orchestrator for Pakistan's Dengue Epidemic

A multi-agent decision-support system built on Antigravity Sonnet 4.6 + Haiku 4.5,
streamed over Server-Sent Events from Vercel Edge to a React Native client,
fusing six geospatial and clinical signals into bilingual public-health action.

<br/>

**AI-Seekho 2026 · Challenge 3 · Submission**

[Architecture](#3-architecture) ·
[Agents](#4-agent-taxonomy) ·
[Data Contracts](#6-data-contracts--schemas) ·
[Traces](#9-antigravity-trace-system) ·
[Run Locally](#13-running-locally)

</div>

---

## Table of Contents

1.  [Abstract](#1-abstract)
2.  [Problem Statement](#2-problem-statement)
3.  [Architecture](#3-architecture)
4.  [Agent Taxonomy](#4-agent-taxonomy)
5.  [Phase Taxonomy](#5-phase-taxonomy)
6.  [Data Contracts & Schemas](#6-data-contracts--schemas)
7.  [External Data Sources](#7-external-data-sources)
8.  [Bilingual Output Contract](#8-bilingual-output-contract)
9.  [Antigravity Trace System](#9-antigravity-trace-system)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Backend Architecture](#11-backend-architecture)
12. [Reliability & Failure Modes](#12-reliability--failure-modes)
13. [Running Locally](#13-running-locally)
14. [Configuration](#14-configuration)
15. [Performance Budgets](#15-performance-budgets)
16. [Security & Privacy](#16-security--privacy)
17. [Roadmap](#17-roadmap)
18. [Acknowledgements](#18-acknowledgements)
19. [License](#19-license)

---

## 1. Abstract

DengueSat CIRO is a production-grade, agentic crisis-response system targeting the dengue
disease surveillance gap in Pakistan. The system ingests six heterogeneous data streams,
fuses them through a master coordinator running Antigravity Haiku 4.5, dispatches
work to seven specialized sub-agents running Antigravity Sonnet 4.6 with extended thinking,
and produces a bilingual (English + Urdu) public-health response package — a Dengue Risk
Index (DRI) score, a severity classification, a 24-hour recommended action, and a
five-recipient stakeholder broadcast (citizens, emergency services, hospitals,
government / NDMA, media) — all within a single ~60–150 second pipeline run.

Every step of model reasoning, tool dispatch, schema validation outcome, latency, and
cost is emitted as a structured event over a Server-Sent Events stream, materialized on
the device as a trace timeline that judges can replay, scrub, and audit. The system is
explicitly designed for observability-first agentic operation: schema soft-fails do not
silently corrupt downstream state, master decisions are explainable, and the final
bilingual output is contract-enforced.

---

## 2. Problem Statement

> The 2022 Pakistan floods, followed by the 2023–2024 dengue resurgence, exposed the
> absence of any national crisis coordination layer for vector-borne disease in South
> Asia. Provincial health departments, NDMA, district administrations, hospitals, and
> citizens operate on disconnected timelines.

| Stakeholder | Currently sees | Currently misses |
|---|---|---|
| **Citizen** | TV news headlines · WhatsApp forwards · symptom guesswork | District-level risk, language-native prevention advice, where to seek care |
| **Hospital admin** | Walk-in admissions, lagging by 24–72h | Forward signal of incoming surge, platelet inventory pressure |
| **District government** | PCR-confirmed case counts, weekly | Climate-driven breeding risk maps, geo-localized intervention priorities |
| **NDMA / federal** | Province-level rollups, monthly | Real-time multi-district crisis hotspots, resource allocation cross-checks |
| **Media** | Press releases from MoH | Vetted bilingual public messaging, structured by urgency |

The information asymmetry is the disease. DengueSat CIRO collapses the latency from
*outbreak signal* to *bilingual stakeholder action* from days to under three minutes.

---

## 3. Architecture

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT  (Android · RN 0.81 · Expo 54)              │
│                                                                                │
│  Intel · Map · Logs · Civic  ─────  4 visible tabs (pill bar, Skia + Moti)      │
│                                                                                │
│  Province / City / District picker  →  6 prefetched API calls in parallel       │
│                                                                                │
│  Zustand store: activeCrises · finalSummary · simulationResult · cost · traces  │
│                                                                                │
│  Skia DRI gauge · MapView (Google) · MotiView animation system · phosphor icons │
└────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │  HTTPS  (POST + SSE)
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                          PROXY  (Vercel Edge Functions)                         │
│                                                                                │
│  /api/agent/orchestrate       master loop · Haiku 4.5 · SSE keepalive 10s       │
│  /api/agent/tool/[name]       8 sub-agent endpoints · Sonnet 4.6 · thinking     │
│  /api/synth/posts             synthetic social posts · Haiku 4.5                │
│  /api/vision                  Antigravity Vision · citizen photo classifier          │
│  /api/data/{nasa,owm,trends,maps}  cached upstream data passthrough             │
│                                                                                │
│  Reliability: 429 retry w/ Retry-After header · libuv supervisor on Windows     │
│  Soft-fail schema validation · structured _antigravity metadata on every event  │
└────────────────────────────────────────────────────────────────────────────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                ▼                      ▼                      ▼
        ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
        │  Antigravity │       │   External   │       │   Firebase   │
        │   Models     │       │   APIs       │       │   RTDB       │
        │              │       │              │       │              │
        │ Sonnet 4.6   │       │ NASA POWER   │       │ Hospitals    │
        │ Haiku 4.5    │       │ OpenWeather  │       │ Admissions   │
        │ + thinking   │       │ Google Maps  │       │ Platelets    │
        │              │       │ Trends       │       │              │
        └──────────────┘       └──────────────┘       └──────────────┘
```

### 3.1 Why this shape

| Decision | Rationale |
|---|---|
| **Edge functions, not Lambda** | Lowest-latency agent call from us-east-1; native SSE streaming; cheaper for spiky workloads |
| **SSE not WebSocket** | Half-duplex is sufficient (server → client trace stream); survives flaky mobile networks; no protocol upgrade needed |
| **Haiku master + Sonnet workers** | Haiku is 5× cheaper and 3× faster on dispatch decisions; Sonnet's depth + thinking is reserved for reasoning-heavy sub-tasks |
| **Zustand over Redux** | 60 byte selector subscriptions; no provider tree; trivially testable; UI thread never blocks on hydration |
| **react-native-maps + Google provider** | `customMapStyle` for the brand-tuned dark mode and the `Heatmap` overlay only work on the Google provider |
| **Skia for the DRI gauge** | GPU-accelerated arcs at 60 fps regardless of JS-thread pressure during live trace streaming |

---

## 4. Agent Taxonomy

The system runs a **Master Coordinator** plus **eight specialized sub-agents**. Each
sub-agent has a typed Zod input contract, a typed Zod output contract, a system prompt
that is prompt-cached, and a dedicated Edge function endpoint.

| # | Agent | Model | Thinking | Role | Output schema (excerpt) |
|---|---|---|---|---|---|
| ⌘ | **Master** | Haiku 4.5 | off | Tool dispatch, iteration control, final bilingual emit | `{summaryEn, summaryUr, actionEn, actionUr, headlineSeverity}` |
| 1 | **SignalFuse** | Sonnet 4.6 | off | Multi-source fusion + per-source credibility scoring | `fusedSignal{climate, vegetation, hospitalLoad, social, ...}` |
| 2 | **TrendSpy** | Haiku 4.5 | off | Google Trends anomaly detection (rolling-mean z-score) | `{anomaly_score, trend_direction, peak_value}` |
| 3 | **OutbreakEye** | Sonnet 4.6 | off | Crisis classification, geographic clustering, anomaly detection | `crises[]{id, type, severityIndicator, populationAtRisk}` |
| 4 | **SeverityMind** | Sonnet 4.6 | **on** | DRI score derivation (T-R-V-H-W weighted), severity & protocol selection | `assessments[]{dri{score, severity, protocol, factors}}` |
| 5 | **ResourceForge** | Sonnet 4.6 | **on** | Proportional resource allocation, tradeoff narration | `allocation{perCrisis, reserve, tradeoff, sideEffects}` |
| 6 | **CrisisSim** | Sonnet 4.6 | off | Before/after state simulation, metrics derivation, stakeholder copy | `{beforeState, afterState, metrics, stakeholderMessages}` |
| 7 | **RecoveryGuard** | Sonnet 4.6 | off | False-positive detection, classification verdict (UPHOLD/RECLASSIFY/SPLIT/RETRACT) | `{verdict, retractionMessages?, utilityNotifications}` |
| 8 | **CitizenSignal** | Sonnet 4.6 | off | Citizen-submitted photo + text triage (used by vision endpoint) | `{breedingLikelihood, riskScore, recommendation}` |

### 4.1 Master loop contract

```
LOOP up to 12 iterations:
  1. Master.messages.create({ model: Haiku, tools: TOOLS, messages })
  2. If stop_reason === "end_turn":
       emit master.done with finalText (bilingual JSON)
       break
  3. For each tool_use in response:
       emit tool.start
       POST /api/agent/tool/{name} with tool_use.input
       emit tool.done with output + schema-validation result
       append tool_result to messages (is_error flagged on schema fail)
  4. continue
END
If MAX_ITERS exhausted: emit master.done with empty finalText (fallback path triggers)
```

---

## 5. Phase Taxonomy

The Antigravity trace stream is annotated with a nine-phase ontology that judges (and
developers) can use to filter, replay, and audit any single pipeline run.

| Phase | Trace marker | What happens |
|---|---|---|
| `init` | `master.start` | runId minted, prefetched data assembled, master system primed |
| `prefetch` | (client only) | NASA POWER, OpenWeather, Google Maps, Firebase, Trends, synthetic social fetched in parallel |
| `plan` | `master.iter` | Master emits thinking, decides which tools to call this turn |
| `tool-dispatch` | `tool.start` | Sub-agent endpoint invoked with structured input |
| `tool-result` | `tool.done` | Schema validation runs; raw output passes through on soft-fail |
| `bridge` | client-side | Loose agent shapes mapped to Zustand store fields |
| `synthesize` | `master.iter` | Master integrates sub-agent outputs into final reasoning |
| `complete` | `master.done` | Bilingual JSON parsed; finalSummary committed to store |
| `fallback` | finally block | If finalSummary or simulationResult still missing, synth canned bilingual + 5-recipient broadcast |

---

## 6. Data Contracts & Schemas

All tool outputs are validated against Zod schemas at the Edge function. When validation
fails, the raw output is returned with a `_schemaError` flag so the master loop and the
client bridge can both decide how to recover. **This is intentional**: we prefer
degraded-but-running over hard-stopped on agent schema drift.

### 6.1 Master bilingual output (strictly enforced)

The master is instructed in `MASTER_SYSTEM` to emit, as its final text response,
a JSON object inside a triple-backtick code fence with the `json` language tag:

```json
{
  "summaryEn": "<1 sentence, 12–18 words, non-technical>",
  "summaryUr": "<same in authentic Urdu script, no Roman Urdu, no English mixed>",
  "actionEn": "<imperative 1 sentence, next 24 hours>",
  "actionUr": "<same in Urdu>",
  "headlineSeverity": "LOW | MODERATE | HIGH | CRITICAL"
}
```

The client-side parser (`lib/bilingual.ts`) first attempts the fenced extraction, then
falls back to the first `{...}` block in the response, then surrenders to a synthesized
fallback in the finally block. This three-tier strategy is what keeps the home screen
populated even when the agent declines to follow the fence convention.

### 6.2 Tool input/output schemas

Defined in `server/lib/schemas.ts` (Zod). Every schema has:

- **Strict mode** for the contract-of-record stored in the repo
- **Pre-process normalization** for known camelCase / snake_case drift
- **Soft-fail return path** at the tool layer when the agent returns unexpected fields

Representative examples:

```typescript
export const OutbreakEyeOutput = z.object({
  crises: z.array(z.object({
    id: z.string(),
    type: z.enum(['DENGUE_OUTBREAK', 'HEATWAVE', 'INFRASTRUCTURE_FAILURE', 'OTHER']),
    district: z.string(),
    severityIndicator: z.number(),
    populationAtRisk: z.number(),
    confidence: z.number().min(0).max(100),
    contradictions: z.array(z.string()),
    evidence_quotes: z.array(z.string()),
  })),
});

export const SeverityMindOutput = z.object({
  assessments: z.array(z.object({
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
  })),
});
```

### 6.3 The DRI formula

The Dengue Risk Index is a 0–100 composite that SeverityMind computes deterministically
from five weighted environmental and epidemiological factors:

```
DRI  =  Tw · T_norm
     +  Rw · R_norm
     +  Vw · V_norm
     +  Hw · H_norm
     +  Ww · W_norm

Where:
  T_norm    temperature_optimal_for_Aedes_aegypti  (26–34 °C window)
  R_norm    recent_rainfall_mm normalized
  V_norm    NDVI normalized (vegetation density favorable for vector)
  H_norm    humidity_pct (>60% RH supports survival)
  W_norm    NDWI (surface water proxy for breeding sites)

Weights (Tw + Rw + Vw + Hw + Ww = 1.0) are emitted in the trace
under assessments[i].dri.factors and are auditable per run.
```

A separate hospital-admissions component is fused in at the OutbreakEye stage as
`anomaliesDetected[i].dataEvidence.dengue_admissions_24h` and is treated as the
highest-credibility source (95/100 in the source-credibility ledger).

---

## 7. External Data Sources

| Source | Endpoint | Refresh | Credibility weight | What it tells the system |
|---|---|---|---|---|
| **NASA POWER** | `power.larc.nasa.gov` | 24h, lat/lng | 99 | Temperature, humidity, rainfall, NDVI, NDWI |
| **OpenWeather** | `api.openweathermap.org` | 10 min | 92 | Live temp + humidity confirmation |
| **Google Maps Places** | nearby search | 1h | 88 | Hospital facility count + proximity |
| **Firebase RTDB** | `denguesa-e0371` | streaming | 95 | Real hospital admissions, bed count, platelet inventory |
| **Google Trends** | `trends.google.com` (via wrapper) | 4h, keyword | 75 | Public search-interest anomalies |
| **Synthetic social** | Antigravity Haiku 4.5 generated | per-run | 42 | Urdu / Roman-Urdu / English health discourse simulation |

All six are fetched **in parallel** by the client before the SSE pipeline begins, then
folded into the master message payload as `prefetchedData`. This eliminates a round-trip
between every sub-agent and the upstream API.

Live status is surfaced on the Home screen and reflected on `setExtendedSourceStatus`
calls — judges can see green / cached / failed badges per source per run.

---

## 8. Bilingual Output Contract

DengueSat CIRO is the first agentic crisis system targeting Pakistan that ships
**authentic Urdu** as a first-class output, not as a post-hoc translation layer.

| Field | Constraint | Why |
|---|---|---|
| `summaryEn` | 12–18 words, plain English, non-technical | Reads to a low-literacy citizen |
| `summaryUr` | Native Urdu script, no Roman Urdu, no English code-mixing | Cultural credibility for Pakistani audiences |
| `actionEn` | Imperative, next-24-hour action | Operational, not advisory |
| `actionUr` | Same as actionEn in Urdu | Same |
| `headlineSeverity` | `LOW \| MODERATE \| HIGH \| CRITICAL` | Mapped to chip color, DRI fallback score, severity-stripe on stakeholder messages |

Five stakeholder broadcasts (public, emergency services, hospital network, government /
NDMA, media) carry bilingual `message` / `messageUrdu` pairs where applicable. The
Civic Inbox renders each as an expandable card with severity-tinted icon, urgency chip,
and a centered `•` divider between languages.

---

## 9. Antigravity Trace System

Every pipeline event is emitted with an `_antigravity` envelope:

```typescript
type AntigravityTrace = {
  schemaVersion: '1.0.0';
  workspace: 'denguesat-ciro';
  runId: string;
  parentRunId: string | null;
  stepIndex: number;          // monotonic across a single run
  orchestrator: 'claude-master-coordinator';
  model: 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6';
  thinkingEnabled: boolean;
  phase: PhaseTag;            // see §5
  tool?: string;
  iter?: number;
  toolUseId?: string;
  latencyMs?: number;
  confidence?: number;
  evidenceQuotesCount?: number;
  stopReason?: string;
  plannerDecisionReason?: string;
  // ...
};
```

These traces flow into:

- **Logs tab → Live** : raw SSE stream with TraceCards
- **Logs tab → Brain** : `AgenticDashboard` groups by phase taxonomy
- **Logs tab → Replay** : `DecisionReplay` timeline scrubber with play/pause
- **Logs tab → Chat** : `AgentChatStream` renders each agent's reasoning as a chat bubble
- **Logs tab → Sim** : `SimulationScreen` shows before/after metrics from CrisisSim

The trace timeline is exportable via `exportAntigravityBundle()` as a JSONL artifact
the judges can replay deterministically. Every run is reproducible from this bundle plus
the original location triple.

---

## 10. Frontend Architecture

### 10.1 Stack

- **React Native 0.81** + **Expo 54** + **expo-router 6**
- **TypeScript strict mode**
- **Zustand 5** for app state (single store, slice selectors)
- **React Native Paper** for MD3 theming primitives
- **Moti** + **Reanimated 3** for animations (UI-thread worklets)
- **React Native Skia** for the holographic DRI gauge
- **@shopify/flash-list v2** for virtualized lists in the Logs tab
- **@gorhom/bottom-sheet** for the province / city / district picker
- **react-native-maps** with `PROVIDER_GOOGLE` for the live map
- **Phosphor icons** for the entire icon vocabulary
- **Sora** for display type, **Inter** for body
- **react-native-svg** + **SvgXml** for 16 brand-recolored undraw illustrations

### 10.2 Tab structure

```
(tabs)/
  index.tsx        Intel        Home: province picker · Hero DRI · Action · Message preview · Execute
  outbreaks.tsx    Map          Google Maps dark/light · custom markers · heatmap · stats bar · FAB stack
  traces.tsx       Logs         Brain / Live / Sim / Replay / Chat sub-tabs over Antigravity traces
  citizen.tsx      Civic        Inbox / Scan / Report sub-tabs
  + 4 hidden routes (alerts, health, recovery, simulation) reached programmatically
```

The pill-style `PillTabBar` is custom and replaces Expo Router's default with brand
animations + accessibility roles + 8 pt `hitSlop`.

### 10.3 Design system

| Token | Hex | Purpose |
|---|---|---|
| `surface-0` | `#0B0F17` | App background |
| `surface-1` | `#141A26` | Cards |
| `surface-2` | `#1A2536` | Raised cards |
| `border` | `#232D3F` | Hairline |
| `primary` | `#107BFF` | Brand, links |
| `primary-deep` | `#0056B3` | Gradient end |
| `primary-light` | `#7AB6FF` | SVG accent |
| `cyan-accent` | `#00E5FF` | Magenta replacement in illustrations |
| `CRITICAL` | `#FF5C75` | AAA contrast on surface-0 (was `#FF1744`, failed AAA) |
| `HIGH` | `#FF8A00` | AAA |
| `MODERATE` | `#FFD600` | AAA |
| `LOW` | `#00E676` | AAA |

All 16 undraw illustrations have been deep-recolored from the default `#6c63ff` palette
into this brand system. Pink and magenta accents from the originals map to the cyan
accent so the entire app reads as one visual system.

### 10.4 Animation system

All motion is UI-thread via Moti / Reanimated worklets. No layout-prop animations.

| Animation | Pattern | Duration · Easing |
|---|---|---|
| Card entry (Hero, Action, Message) | Spring | stiffness 280, damping 22, staggered 0/80/160ms |
| Live dot pulse | Timing loop, opacity 0.55→0, scale 0.6→2.2 | 1400ms · `Easing.out(Easing.quad)` |
| Execute button ring | Timing loop, opacity 0.5→0, scale 0.98→1.06 | 1800ms · `Easing.out(Easing.cubic)` |
| Empty-hero radar pulses | Timing loop, 3 concentric, 800ms stagger | 2400ms · `Easing.out(Easing.cubic)` |
| Inbox row expand | Timing | 220ms |
| Tab pill scale | Spring | stiffness 280, damping 22 |
| Map auto-fit | `animateToRegion` / `fitToCoordinates` | 600ms |
| DRI score count-up | rAF easing (cubic) | 1100ms |

---

## 11. Backend Architecture

### 11.1 Why Vercel Edge

The pipeline is read-heavy on Antigravity and IO-bound on upstream APIs. Vercel Edge runs in
the same region as the agent API origin, has native streaming `Response` support, and
billboards `waitUntil` semantics that survive client disconnect. Local development uses
`vercel dev` under a Node supervisor because the Windows libuv layer crashes intermittently
on SSE close — the supervisor (`server/supervise-vercel.cjs`) respawns within 2 seconds.

### 11.2 Master loop

`server/api/agent/orchestrate.ts` runs the master loop. Key invariants:

- **`masterDoneEmitted` flag** guarantees `master.done` is emitted exactly once, including
  on `MAX_ITERS` exhaustion and on rate-limit final failure.
- **429 retry with `Retry-After` parsing**: if the API returns the header, it is respected
  up to a 90s cap; otherwise an exponential 20/40/60s backoff is applied for up to 4 attempts.
- **SSE keepalive**: a `: ping <ts>` comment every 10 seconds keeps proxies happy.
- **Stream lifecycle**: a `closed` flag plus `closeAll()` helper prevents double-close
  on libuv races.

### 11.3 Sub-agent endpoint

`server/api/agent/tool/[name].ts` is a single dynamic handler that routes to the eight
sub-agents by URL slug. It:

1. Loads the system prompt + Zod schema for the requested agent.
2. Calls `callAgent({...})` with `cacheSystem: true` (5-minute prompt cache).
3. Extracts the JSON inside a `\`\`\`json\`\`\`` fence.
4. Validates against the schema. On failure, returns the raw output plus a
   `_schemaError` field so the master loop sees it as `is_error: true`.
5. Emits usage as `inputTokens`, `outputTokens`, `cacheReadTokens`, `cacheWriteTokens`,
   and a precomputed `costUSD`.

### 11.4 Pricing model

Each sub-agent's tokens are priced from a per-model table (`server/lib/pricing.ts`) and
accumulated into a per-run cost figure surfaced in the cost dashboard. Master uses Haiku;
sub-agents use Sonnet except `trend_spy` (Haiku). Typical full-pipeline cost is
**~$0.08–$0.18 per run** at 2025 rates.

---

## 12. Reliability & Failure Modes

DengueSat CIRO acknowledges its failure modes explicitly instead of suppressing them.

| Failure | Symptom | Mitigation |
|---|---|---|
| the agent returns no `\`\`\`json\`\`\`` fence | `parseFinalSummary → null` | Fallback regex extracts first `{...}` block; if still null, synth from `headlineSeverity` |
| agent call returns 429 rate-limit | Master call fails | Up to 4 retries, `Retry-After` parsed, exponential backoff |
| Sub-agent schema soft-fail | `is_error: true` propagated | Bridge layer reads loose shape with fallback paths; trace records `_schemaError` |
| Firebase RTDB key missing | `[firebase-rtdb] missing data key` warn | Caller treats as empty list; `setExtendedSourceStatus('firebase', 'failed')` |
| `vercel dev` libuv assertion (Windows) | Process crash | `supervise-vercel.cjs` respawns within 2s, caps at 10 restarts/min |
| Metro stale bundle after edits | UI shows old code | Documented in [§13](#13-running-locally); `--clear` on Metro start |
| SSE stall (proxy crash mid-stream) | Client hangs | 90s `STALL_TIMEOUT_MS` aborts and surfaces an error |
| Pipeline > 420s hard cap | Pipeline aborted | `setAnalyzing(false)`, fallback finalSummary fires, processing agents flipped to `error` |
| `crisis_sim` never runs (no crises detected) | Civic Inbox empty | Finally-block fallback synthesizes 5 stakeholder messages from `headlineSeverity` |
| `activeCrises[0].dri.score === 0` (cold city like Quetta, no real outbreak) | DRI shows 0 | Score derived from severity map (LOW=12, MODERATE=42, HIGH=68, CRITICAL=88) as fallback |

---

## 13. Running Locally

### 13.1 Prerequisites

- Node.js 20 LTS
- pnpm or npm
- Android emulator (Pixel 7 + API 34 Google Play x86_64 recommended; Pixel 10 caused ANRs)
- adb on `$PATH`
- Java 17 (for Expo prebuild if needed)

### 13.2 First-time setup

```bash
cd denguesat-ciro
npm install
cd server && npm install && cd ..

cp .env.example .env.local                       # if not already present
# Fill in: AGENT_API_KEY, FIREBASE_*, OPENWEATHER_API_KEY, GOOGLE_MAPS_API_KEY
```

### 13.3 Run the stack

Three processes:

```bash
# Terminal 1 — proxy (supervised, restarts on Windows libuv crash)
cd server && node supervise-vercel.cjs

# Terminal 2 — Metro
npx expo start --android --clear --dev-client

# Terminal 3 — reverse ports into the emulator
adb reverse tcp:3000 tcp:3000
adb reverse tcp:8081 tcp:8081
```

Then in the running app: pick a province → city → district, tap **Execute System Scan**,
wait ~60–150 seconds, watch the trace stream populate the Logs tab and the bilingual cards
land on the home screen.

### 13.4 Smoke-test the proxy

```bash
curl -sS -X POST http://localhost:3000/api/agent/tool/trend_spy \
  -H "content-type: application/json" \
  -d '{"input":{"keyword":"dengue Karachi","data":[{"date":"2026-04-01","value":50}]}}' \
  | head -c 400
```

Should return an `output` object with `anomaly_score`, `trend_direction`, etc.

---

## 14. Configuration

| Var | Where | Purpose |
|---|---|---|
| `AGENT_API_KEY` | `server/.env.local` | agent access |
| `EXPO_PUBLIC_AGENT_PROXY_URL` | `.env` / `.env.local` | Client → proxy URL (defaults to `http://localhost:3000`) |
| `EXPO_PUBLIC_FIREBASE_*` | `.env` | Firebase RTDB config (project `denguesa-e0371`) |
| `OPENWEATHER_API_KEY` | `server/.env.local` | OpenWeather |
| `GOOGLE_MAPS_API_KEY` | `server/.env.local` + `AndroidManifest.xml` meta-data | Maps + Places |
| `NASA_POWER_BASE_URL` | `.env` | NASA POWER (no key, public) |
| `FIREBASE_DATABASE_URL` | `server/.env.local` | RTDB URL |

`.env*` files are gitignored. The Google Maps key embedded in
`android/app/src/main/AndroidManifest.xml` should be restricted in Google Cloud Console
to the package name `com.anonymous.denguesatciro` before public release.

---

## 15. Performance Budgets

| Metric | Budget | Measured |
|---|---|---|
| Cold pipeline run | < 180 s | ~60–150 s typical |
| Master call (Haiku, no thinking) | < 5 s | ~2–4 s |
| Sub-agent call (Sonnet + thinking) | < 60 s | 30–65 s p95 |
| Trace event → UI render | < 50 ms | ≈ 16–32 ms |
| Tab switch frame budget | 16.6 ms | held |
| Per-run agent cost | < $0.25 | $0.08–$0.18 typical |
| Bundle size (Android dev) | n/a (dev client) | ~5500 modules |

---

## 16. Security & Privacy

DengueSat CIRO handles location and (in citizen-report flows) photo data. The current
state of the repository reflects a hackathon submission and is **not yet hardened for
public deployment**. Specifically:

- **API endpoints are unauthenticated.** Production must add a per-request shared-secret
  header (`X-Api-Key`) plus per-IP rate-limiting (e.g. `@upstash/ratelimit`).
- **Location strings are interpolated into the master prompt unsanitized.** Production
  must restrict to a whitelist regex `/^[A-Za-z0-9\s\-,\.]{1,100}$/` before injection.
- **Citizen-report photos are stored base64-encoded in the Zustand client store.**
  Production must store only the URI and discard the base64 after upload.
- **`console.warn` / `console.log` paths emit partial agent output.** Replace with
  a structured logger that suppresses below an environment-controlled threshold.

These are tracked as P0 items in `docs/security-followups.md`. The hackathon submission
runs entirely on a local emulator + local proxy; no external traffic ingress is exposed.

---

## 17. Roadmap

**Phase 1 — submitted (this repo)**
- ✅ 8-agent pipeline, bilingual master output
- ✅ 6 live data sources fused
- ✅ Antigravity trace system with replay + scrub
- ✅ Live Google Maps with heatmap + dark/light theme + custom markers
- ✅ Civic Inbox with 5-recipient bilingual broadcasts
- ✅ Citizen photo report + camera scanner with Antigravity Vision

**Phase 2 — post-hackathon**
- 🔄 Authenticated endpoints (Clerk or NextAuth) + rate limiting
- 🔄 Real-time push notifications (`expo-notifications` + Firebase Cloud Messaging)
- 🔄 District polygon boundary overlays (Pakistan administrative shapefile)
- 🔄 Distance Matrix API: ambulance ETA per hospital → crisis pair
- 🔄 Google Earth Engine NDVI/NDWI live tile overlay
- 🔄 Apply for Google Maps Platform Crisis Response credit
- 🔄 Replace Nastaliq fallback with `Noto Nastaliq Urdu` font load
- 🔄 Offline-first mode with last-known traces

**Phase 3 — partnership track**
- 🔄 PITB / Punjab Health Department integration
- 🔄 NDMA crisis-feed handoff schema
- 🔄 WHO PaHIS interoperability

---

## 18. Acknowledgements

| | |
|---|---|
| **Antigravity** | Antigravity Sonnet 4.6 + Haiku 4.5 + extended thinking + prompt caching |
| **NASA** | POWER climate data (free, public, no key) |
| **OpenWeather** | Live weather API |
| **Google Maps Platform** | Maps SDK Android, Places (heatmap free in SDK) |
| **Firebase** | Realtime Database for hospital inventory streaming |
| **unDraw** (Katerina Limpitsouni, MIT) | 16 brand-recolored illustrations |
| **Phosphor Icons** | The icon vocabulary throughout the app |
| **Shopify** | FlashList v2, React Native Skia |
| **Software Mansion** | React Native Reanimated 3 |
| **Fernando Rojo** | Moti |
| **Mo Gorhom** | @gorhom/bottom-sheet |

This submission is built for the **AI-Seekho 2026 Hackathon, Challenge 3 — Crisis
Intelligence & Response Orchestrator** at the request of the organizers. All third-party
trademarks belong to their respective owners.

---

## 19. License

MIT. See [LICENSE](./LICENSE).

The Antigravity prompts and the DRI scoring formula are released into the public domain by
the author. The brand identity ("DengueSat CIRO"), the trace-system schema
(`_antigravity` envelope), and the bilingual output contract may be reused under MIT.

---

<div align="center">

**Built for Pakistan. Architected for observability. Authored against the latency
gap between satellite signal and stakeholder action.**

</div>
