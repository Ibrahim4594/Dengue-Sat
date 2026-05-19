# DengueSat — MAX-POWER Refactor Design

**Date:** 2026-05-14
**Owner:** Ibrahim Samad
**Hackathon:** AI-Seekho 2026 — Challenge 3 (CIRO: Crisis Intelligence & Response Orchestrator)
**Submit deadline:** 2026-05-20
**Status:** Draft for user review

---

## 1. Goal

Convert the existing DengueSat scaffold (React Native + Expo Android app at `denguesat-ciro/`) from a deterministic state-machine wearing an "agentic" costume into a real Claude-powered multi-agent system orchestrated via Google Antigravity, satisfying the AI-Seekho Challenge 3 rubric (Antigravity Integration 20-25%, Agentic Reasoning 20-25%, Workflow/Action Chain 15%, Robustness/Scale 10-15%, Innovation/UX 10%).

**Crisis scope:** Dengue outbreaks in Pakistan (flagship). Heatwave used only in mandatory multi-crisis demo scenario, not standalone feature.

**Constraints:**
- Mobile Android-only (no web app).
- Preserve current UI theme (`react-native-paper`, `constants/theme.ts`, `constants/Colors.ts`).
- Preserve current 7 tab structure; add 1 "Citizen" tab containing AR Scanner + Reporter sub-views.
- All Claude calls go through a Vercel Edge Function proxy (RN never holds `ANTHROPIC_API_KEY`).
- Models: Claude Sonnet 4.6 default, Haiku 4.5 for cheap classification, prompt caching enabled.
- All external APIs proxied through Vercel for CORS + caching + rate-limit consolidation.

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  MOBILE APP (RN/Expo, Android)                               │
│                                                              │
│  UI: 8 tabs (Intel, Map, Health, Logs, Sim, Alerts,          │
│       Recovery, Citizen) + Province/City/District picker.    │
│  Bonus: Cost dashboard, AR scanner, Citizen reporter,        │
│         live agent chat stream, PITB comparison.             │
│                                                              │
│  State: Zustand store (traces, crises, source health,        │
│         antigravityTraces[], tokenCost, citizenReports).     │
│                                                              │
│  Runtime: lib/antigravity.ts — calls /api/agent on Vercel.   │
└──────────────────────────────────────────────────────────────┘
                              │ HTTPS (SSE for streaming)
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  VERCEL EDGE FUNCTIONS                                       │
│   /api/agent/orchestrate  — Master coordinator entrypoint.   │
│   /api/agent/tool/:name   — Sub-agent tool dispatch.         │
│   /api/vision             — Claude Vision (AR puddle).       │
│   /api/data/nasa          — NASA POWER proxy + cache.        │
│   /api/data/openweather   — OpenWeather proxy + cache.       │
│   /api/data/maps          — Google Maps proxy + cache.       │
│   /api/data/firebase      — Firebase RTDB read proxy.        │
│   /api/data/trends        — Google Trends proxy.             │
│   /api/synth/posts        — Claude Haiku → Urdu/Eng posts.   │
│                                                              │
│  Secrets (server-side): ANTHROPIC_API_KEY, OPENWEATHER_KEY,  │
│                         GOOGLE_MAPS_KEY, FIREBASE_*          │
│  Features: prompt caching, exp backoff, circuit breaker,     │
│            cost tracking, request idempotency.               │
└──────────────────────────────────────────────────────────────┘
       │                        │                  │
       ▼                        ▼                  ▼
┌─────────────┐         ┌──────────────┐    ┌──────────────┐
│ Anthropic   │         │ External     │    │ Firebase     │
│ Claude API  │         │ APIs         │    │ RTDB +       │
│ Sonnet 4.6  │         │ NASA POWER   │    │ Firestore    │
│ Haiku 4.5   │         │ OpenWeather  │    │ (hospital    │
│             │         │ Google Maps  │    │  SIMULATED + │
│             │         │ Google Trends│    │  incident    │
│             │         │              │    │  log + trace │
│             │         │              │    │  export)     │
└─────────────┘         └──────────────┘    └──────────────┘
```

**Antigravity layer pattern — Master Coordinator + Tool-Use Loop (Option A from brainstorming):**

1. RN sends `POST /api/agent/orchestrate` with `{ location, scenarioId?, runId }`.
2. Edge function pre-fetches all 6 data sources in parallel (NASA, OpenWeather, Maps, Firebase RTDB, Google Trends, synth posts via Haiku).
3. Edge function initializes **Master Coordinator** as a Claude Sonnet 4.6 call with:
   - System prompt declaring Antigravity coordinator role.
   - Tool schema for 8 sub-agents (signal_fuse, outbreak_eye, severity_mind, resource_forge, crisis_sim, recovery_guard, trend_spy, citizen_signal).
   - Extended thinking enabled (budget 8K tokens) for visible reasoning.
4. Master loops via Anthropic tool-use API:
   - Master plans → emits tool_use → edge function executes sub-agent → result → Master observes → next tool or final response.
5. Each sub-agent call is a separate Claude API request with role-specific system prompt and structured-output schema (Zod-validated).
6. All trace events streamed to RN via SSE in Antigravity-compatible JSON format.
7. Traces mirrored to Firestore `/traces/{runId}` for submission bundle export.
8. Antigravity IDE workspace traces from local dev sessions exported separately, bundled at submission.

---

## 3. Components

### 3.1 Files preserved (no changes)
- `constants/Colors.ts`, `constants/theme.ts`, `constants/paper-theme.ts`, `constants/typography.ts`, `constants/cities.ts`, `constants/cost-data.ts`
- `app/_layout.tsx`, `app/+html.tsx`, `app/+not-found.tsx`, `app/modal.tsx`
- `components/Themed.tsx`, `components/StyledText.tsx`, `components/EditScreenInfo.tsx`, `components/ExternalLink.tsx`
- `components/useClientOnlyValue*.ts`, `components/useColorScheme*.ts`
- `components/AgentTraces.tsx` (kept as inline view, superseded by AntigravityTraceViewer)
- `components/PITBGapAnalysis.tsx`, `components/ScenarioSelector.tsx`

### 3.2 Files expanded (kept, augmented)
- `hooks/useCrisisStore.ts` — add: `tokenCostUSD`, `tokenCount`, `antigravityTraces[]`, `citizenReports[]`, `sourceHealth`, `scenarioId`, `selectedLocation`.
- `lib/dri-calculator.ts` — kept verbatim, used as deterministic fallback when LLM unreachable.
- `lib/network-guard.ts` — upgraded with 3x exponential backoff, 10s timeout, circuit breaker.
- `lib/types.ts` — expanded with `AntigravityTrace`, `AgentToolCall`, `SourceHealth`, `Province`, `District`, `CitizenReport`.
- `lib/symptom-checker.ts` — keep, integrate into Citizen reporter.
- `lib/cost-analysis.ts` — keep, feed Cost Dashboard.

### 3.3 Files rewritten (gut + replace)
- `lib/orchestrator.ts` → Master Coordinator wrapper invoking proxy.
- `lib/agents/BaseAgent.ts` → real `reason({ system, input, schema, model, thinking })` method calling proxy.
- `lib/agents/SignalFuse.ts` → Sonnet 4.6, multi-source fusion w/ credibility scores.
- `lib/agents/OutbreakEye.ts` → Sonnet 4.6, classification + confidence + conflict flags.
- `lib/agents/SeverityMind.ts` → Sonnet 4.6 + extended thinking, DRI w/ visible chain-of-thought.
- `lib/agents/ResourceForge.ts` → Sonnet 4.6, constrained allocation w/ tradeoff reasoning.
- `lib/agents/CrisisSim.ts` → Sonnet 4.6, before/after metrics + Urdu/Eng stakeholder messages.
- `lib/agents/RecoveryGuard.ts` → Sonnet 4.6, false-positive detection + retraction.
- `lib/agents/TrendSpy.ts` → Haiku 4.5 (cheap), Google Trends anomaly wrapper.

### 3.4 New files

#### Backend (Vercel)
| Path | Purpose |
|------|---------|
| `server/api/agent/orchestrate.ts` | Master Coordinator entry, SSE stream. |
| `server/api/agent/tool/[name].ts` | Sub-agent tool dispatch. |
| `server/api/vision.ts` | Claude Vision for AR puddle scanner. |
| `server/api/data/nasa.ts` | NASA POWER proxy + 24h cache. |
| `server/api/data/openweather.ts` | OpenWeather proxy + 10min cache. |
| `server/api/data/maps.ts` | Google Maps Geocoding + Distance Matrix. |
| `server/api/data/firebase.ts` | Firebase RTDB read proxy. |
| `server/api/data/trends.ts` | Google Trends proxy. |
| `server/api/synth/posts.ts` | Claude Haiku synth Urdu/Eng posts. |
| `server/lib/claude.ts` | Anthropic SDK client + retry + cost tracking. |
| `server/lib/cache.ts` | Vercel KV cache wrapper. |
| `server/lib/rate-limit.ts` | Token bucket per-API. |
| `vercel.json` | Vercel deployment config. |
| `server/package.json` | Backend deps. |
| `server/.env.example` | Backend env template. |

#### Frontend (RN)
| Path | Purpose |
|------|---------|
| `lib/antigravity.ts` | Master orchestrator runtime, SSE consumer, Antigravity-compatible trace emitter. |
| `lib/claude-client.ts` | Thin proxy client. |
| `lib/agents/CitizenSignal.ts` | New 8th agent for user-submitted reports. |
| `lib/api/nasa.ts` | NASA client (calls proxy). |
| `lib/api/openweather.ts` | OpenWeather client (calls proxy). |
| `lib/api/google-maps.ts` | Maps client (calls proxy). |
| `lib/api/firebase-rtdb.ts` | Firebase RTDB hospital data client. |
| `lib/api/google-trends.ts` | Trends wrapper. |
| `lib/synth-posts.ts` | Synth post client. |
| `lib/cost-tracker.ts` | Live token/$ tracking, Zustand integration. |
| `lib/antigravity-export.ts` | Export trace bundle JSON for submission. |
| `lib/scenarios.ts` | Scenario injection logic (dual-crisis, false-alarm, api-failure, hospital-rush). |
| `constants/provinces.ts` | Province → City → District tree w/ lat/lng (Sindh, Punjab, KP, Balochistan, ICT). |
| `components/ProvincePicker.tsx` | Cascading selector. |
| `components/CostDashboard.tsx` | Live token + USD counter. |
| `components/ARPuddleScanner.tsx` | expo-camera + Claude Vision integration. |
| `components/CitizenReportForm.tsx` | Photo + text submission. |
| `components/AgentChatStream.tsx` | Live chat-style agent message stream. |
| `components/PITBCompare.tsx` | PITB vs DengueSat comparison table. |
| `components/UrduVoiceAlert.tsx` | expo-speech Urdu TTS. |
| `components/AntigravityTraceViewer.tsx` | Animated trace timeline. |
| `components/SourceHealthBadge.tsx` | Per-source health indicator. |
| `components/DegradedModeBanner.tsx` | Yellow/orange/red top banner. |
| `app/(tabs)/citizen.tsx` | New "Citizen" tab w/ Scanner + Reporter sub-views. |
| `mock-data/scenarios/dual-crisis.json` | Korangi dengue + Clifton heatwave fixture. |
| `mock-data/scenarios/false-alarm.json` | Water-main burst fixture. |
| `mock-data/scenarios/api-failure.json` | NASA degraded fixture. |
| `mock-data/scenarios/hospital-rush.json` | Alert cascade fixture. |
| `data/cache/karachi.json` | NASA fallback cache. |
| `data/cache/lahore.json` | NASA fallback cache. |
| `data/cache/peshawar.json` | NASA fallback cache. |
| `data/cache/islamabad.json` | NASA fallback cache. |

### 3.5 Dependencies to add (mobile)
- `@anthropic-ai/sdk` (optional, for typing only — actual calls go through proxy)
- `expo-camera` — AR scanner
- `expo-speech` — Urdu TTS
- `expo-image-picker` — Citizen reporter
- `expo-file-system` — local cache
- `eventsource-polyfill` — SSE on RN
- `zod` — schema validation

### 3.6 Dependencies (backend)
- `@anthropic-ai/sdk`
- `zod`
- `@vercel/kv` (cache)
- `node-fetch` (built-in fetch fine on Edge)

### 3.7 Tab structure (8 total)
1. **Intel** (existing) — DRI gauge, province picker, run analysis button, cost dashboard
2. **Map** (existing) — risk zones, hospital markers, fumigation routes
3. **Health** (existing) — symptom checker, hospital readiness
4. **Logs** (existing, upgraded) — Antigravity trace timeline + agent chat stream
5. **Sim** (existing, upgraded) — before/after split view w/ animation
6. **Alerts** (existing, upgraded) — Urdu/Eng + voice playback button
7. **Recovery** (existing) — false-positive log, source health, PITB compare
8. **Citizen** (new) — AR scanner + report form sub-views

---

## 4. Data flow

### 4.1 Happy path — analysis run
```
User selects Sindh→Karachi→Korangi → tap "Run Analysis"
  ↓
RN: POST /api/agent/orchestrate { location, runId }
  ↓
Vercel pre-fetch parallel (3s):
  NASA POWER, OpenWeather, Maps traffic, Firebase RTDB hospital,
  Google Trends, Claude Haiku synth posts
  ↓
Vercel: init Master Coordinator (Sonnet 4.6 + extended thinking)
        system prompt + 8 tools registered
  ↓
Master tool-use loop (streamed back via SSE):
  Iter 1: think → signal_fuse(data)        → trace event 1
  Iter 2: observe → outbreak_eye(signal)   → trace event 2
  Iter 3: observe → severity_mind(crises)  → trace event 3 (extended thinking visible)
  Iter 4: observe → resource_forge(crises) → trace event 4
  Iter 5: observe → crisis_sim(plan)       → trace event 5
  Iter 6: observe → recovery_guard(...)    → trace event 6
  Iter 7: final synthesis                  → trace event 7 (DONE)
  ↓
RN consumes SSE → Zustand store updates per event
  Traces tab streams events live
  Agent chat view animates messages
  Cost dashboard ticks tokens + USD
  ↓
Final result → store.currentAnalysis = { crises, plan, simulation, alerts }
  Intel: DRI gauge animates 0→86
  Map: red overlay on Korangi
  Sim: before/after slides ready
  Alerts: Urdu+Eng + voice ready
  ↓
Mirror to Firestore /incidents/{runId} + /traces/{runId}
```

### 4.2 Citizen reporter loop
```
User: Citizen tab → photo + text → submit
  ↓
RN: POST /api/vision { image_base64, text, location }
  ↓
Vercel: Claude Vision (Sonnet 4.6, image input)
        → { riskScore, breedingLikelihood, recommendation, evidence_quotes }
  ↓
If riskScore > 70:
  citizenReports[] += report
  Next orchestrator run includes report in SignalFuse pool
Push notification: "Report accepted, fumigation queued"
```

### 4.3 Multi-crisis flow
```
OutbreakEye returns 2 active crises → Master detects
Master calls resource_forge w/ both crises + constraints
  → returns allocation w/ tradeoff narrative
Master calls crisis_sim per crisis
Master calls recovery_guard for both
Master returns merged report
```

### 4.4 False-positive flow
```
New evidence: "water-main burst Block A" injected (scenario button or citizen report)
Master → recovery_guard(evidence + existing classification)
  → re-runs outbreak_eye w/ enriched context
  → reclassifies Block A as INFRASTRUCTURE_FAILURE
Master emits: retraction event + utility notification structured payload
RN: Alerts tab adds RETRACTION card w/ Urdu apology
RN: Recovery tab logs correction
Resources deallocated from Block A in next allocation cycle
```

### 4.5 API failure flow (degraded mode)
```
Vercel: NASA fetch fails (3x retry exhausted) → fallback to cached
  → sourceHealth.nasa = 'cached'
Master receives data + sourceHealth flags
Master applies confidence penalty (-15%)
Trace: "[Antigravity] Degraded: NASA POWER cached (24h old). Uncertainty ±15%"
RN: Intel + Recovery tabs show yellow degraded badge
```

### 4.6 Cost tracking
```
Every Claude call returns usage.{input_tokens, output_tokens, cache_read_tokens}
Cost calculated: (input * $3 + output * $15 + cache * $0.30) / 1M
Emitted in every trace event under .tokens.{count, costUSD}
Cost dashboard sums live
Per-analysis target: $0.10-$0.15
```

---

## 5. Error handling & robustness

### 5.1 Agentic robustness
- Every tool returns `confidence: 0-100`, `evidence_quotes: string[]`, `contradictions: string[]`.
- Master MUST call verification tool when confidence <60.
- Master MUST call `recovery_guard` when contradictions present.
- Master CAN return `escalate_to_human` decision when evidence insufficient.

### 5.2 Tool-call validation
- Every Claude tool-use response validated against Zod schema.
- Malformed → 1 retry w/ schema reminder → deterministic fallback.
- Tool-call timeout 15s → mark agent degraded, Master skips or replans.

### 5.3 Conflict resolution protocol (`recovery_guard`)
- Source weights: Hospital + lab confirmations = 95, NASA = 90, social = 70 (with credibility discount), single field report = 60.
- Geographic mismatch (different districts) → split into separate incidents.
- Temporal mismatch (>48h apart) → separate events.
- Returns reconciled hypothesis + reasoning trace.

### 5.4 Source health monitor (60s interval, background)
- Per source: `live` | `cached` | `degraded` | `failed`.
- Auto-promote `cached` → `live` when API responds.
- Confidence penalties: 1 degraded -10%, 2 degraded -25% + warning, 3+ degraded "Safety Mode" (no new decisions, last-known shown, red banner).

### 5.5 API resilience (Vercel)
- 3x exponential backoff (500ms, 1s, 2s).
- 10s per-call timeout.
- Circuit breaker: 5 failures in 60s → open circuit 5min, serve cache only.
- Last-known-good cache always returned on failure.

### 5.6 Rate limits
- Token bucket per API: NASA 1000/hr, OpenWeather 60/min, Anthropic per tier.
- Pre-flight check before each call.
- Exhausted → cache fallback + Master notified.

### 5.7 Cache
- NASA: 24h.
- OpenWeather: 10min.
- Google Maps traffic: 5min.
- Firebase RTDB: WebSocket subscription.
- Cache hit → trace tagged `[CACHED, age]`.

### 5.8 Idempotency
- `runId` (uuid) deduplicates re-requests.
- Citizen reports deduplicated by `photoHash + location + 30min window`.

### 5.9 False-positive handling (mandatory)
- Steps 1-9 as in Section 4.4 above. Audit log immutable (Firestore writeOnce rule).

### 5.10 Anti-hallucination
- Claude responses include `evidence_quotes` — verbatim from source.
- DRI computed by Claude cross-checked vs deterministic formula (±10% tolerance).
- Deviation >10% → flag + use formula, log discrepancy.

### 5.11 Graceful degradation tiers
| Tier | Trigger | Behavior |
|------|---------|----------|
| GREEN | All sources live | Full LLM agentic loop |
| YELLOW | 1-2 cached | LLM loop + confidence penalty + banner |
| ORANGE | 3+ degraded | LLM loop on cached, no new decisions, banner |
| RED | LLM/proxy unreachable | Deterministic DRI + cached data, red banner |

### 5.12 Failure observability
- Errors logged to Firestore `/errors`.
- Cost dashboard shows: total calls, success rate, retry count, fallback hits.
- "Simulate NASA Down" demo button for live judge demonstration.

---

## 6. Testing & verification

### 6.1 Unit tests (Vitest, ~60% coverage on `lib/`)
- `lib/dri-calculator.test.ts` — formula correctness.
- `lib/agents/*.test.ts` — schema validation.
- `lib/network-guard.test.ts` — retry/backoff.
- `lib/cost-tracker.test.ts` — token cost math.

### 6.2 Integration tests (smoke)
- `server/api/agent/*.test.ts` — mocked Claude SDK.
- `lib/antigravity.test.ts` — full pipeline w/ mocked tools.

### 6.3 Manual E2E checklist (judge-demo prep, all must pass)
- [ ] Province picker live data flow.
- [ ] All 6 agents emit traces in <30s.
- [ ] Dual-crisis scenario: tradeoff visible.
- [ ] False-positive: retraction generated.
- [ ] API-failure: degraded badge + cached fallback.
- [ ] Hospital-rush: side-effect flagged.
- [ ] AR scanner: vision result <5s.
- [ ] Citizen reporter: feeds next run.
- [ ] Urdu TTS plays.
- [ ] Cost dashboard ticks live.
- [ ] Agent chat streams.
- [ ] PITB compare table renders.
- [ ] Offline mode: deterministic fallback works.

### 6.4 Anti-hallucination spot-checks
- 5 random traces — does reasoning match output?
- `evidence_quotes` actually present in source data (string search).

### 6.5 Cost ceiling
- 10 full runs total <$2.

### 6.6 Performance bench
- Cold-start analysis <30s.
- Warm analysis <10s.
- AR vision <5s.
- App startup <3s.

### 6.7 Submission deliverables checklist
- [ ] APK build (`eas build -p android`) tested on physical device.
- [ ] README.md: arch, data schemas, Antigravity usage, API table, assumptions, privacy, cost/latency, scalability, limitations.
- [ ] Demo video 3-5 min recorded + edited.
- [ ] Antigravity trace bundle exported (`submission/antigravity-trace-bundle.json`).
- [ ] Source code zip (no node_modules).
- [ ] `.env.example` shipped (no real keys).

---

## 7. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Claude API rate-limit during demo | Prompt caching + idempotency + warm-up run before demo. |
| Vercel cold start delay | Edge runtime (<50ms cold). Pre-warm via cron ping. |
| Anthropic key leaked from RN | Proxy architecture — key never reaches client. |
| Hallucinated DRI numbers | Deterministic cross-check ±10% tolerance. |
| NASA API rejected from Vercel IP | Pre-cache fallback for 4 main cities ready. |
| Demo wifi fails | Offline deterministic mode + cached data, red banner. |
| AR scanner camera permission denied | Graceful prompt + skip with non-blocking explanation. |
| User pastes Claude key in plain text again | `.env.local` gitignored + setup script reads from prompt. |

---

## 8. Out of scope

- Real-time push notifications backend (use Expo push or skip).
- Real Pakistan hospital data integration (simulated, marked clearly).
- Twitter/X API (skipped, cost not worth).
- Reddit social signals (skipped, opted for LLM synth posts).
- Web companion dashboard (mobile-only focus).
- Crisis types beyond dengue + heatwave-demo (dengue-only positioning locked).
- iOS build (Android-only focus).
- Full E2E test automation (manual checklist used instead).

---

## 9. Open items requiring user input before implementation

1. **Rotate Claude API key** — user pasted key in chat earlier; must rotate at console.anthropic.com and place new key in `server/.env.local` (gitignored). Original key compromised.
2. **Provide Firebase Web SDK config block** — needed for `firebase.initializeApp()`. Paste apiKey/authDomain/projectId/storageBucket/messagingSenderId/appId in `denguesat-ciro/.env.local`.
3. **Confirm Vercel account** — need user to be logged in via `vercel login` before deploy.
4. **Confirm Antigravity IDE installed** — user confirmed yes, will drive dev sessions in IDE for parallel trace bundle.

---

## 10. Deliverables for hackathon submission

1. **APK file** (`denguesat-v1.0.apk`) — built via `eas build -p android --profile preview`.
2. **Source code zip** — excludes node_modules, .env*, .superpowers/.
3. **README.md** — comprehensive per Section 6.7.
4. **Demo video (3-5 min)** — scripted, recorded, MP4.
5. **Antigravity trace bundle** — `submission/antigravity-trace-bundle.json`.
6. **Antigravity IDE workspace export** — from local dev sessions.
7. **Architecture diagram** — embedded in README.
8. **`.env.example`** — template with no real keys.

---

## 11. Approvals

- [ ] User reviewed this design doc.
- [ ] User confirmed all 5 sections during brainstorming.
- [ ] User approves proceeding to `superpowers:writing-plans` for implementation plan.
