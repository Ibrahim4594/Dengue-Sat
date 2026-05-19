# Plan: Push DengueSat Rubric 93 → 95+

**Goal:** Lift hackathon rubric ceiling from estimated 93/100 to 95-97/100.
**Deadline:** 2026-05-20 (4 days from today).
**User strength:** Demo + pitch quality (handles automatically).
**My focus:** Code + UI + artifact polish that raises rubric ceiling.

---

## Current Rubric Standing (per submission map)

| Bucket | Weight | Current | Ceiling | Gap |
|--------|--------|---------|---------|-----|
| Antigravity Integration | 25% | 23 | 25 | 2 |
| Agentic Reasoning | 20% | 19 | 20 | 1 |
| Situation Detection | 20% | 18 | 20 | 2 |
| Action Planning | 15% | 14 | 15 | 1 |
| Technical Implementation | 10% | 9 | 10 | 1 |
| Innovation & UX | 10% | 10 | 10 | 0 |
| **TOTAL** | **100%** | **93** | **100** | **7** |

To hit **95+** we need to recover **at least 2 of the 7 gap points** without losing any current points.

---

## 6 Phases — pick subset for 95+

### Phase A — Antigravity Hardening (+1 to +2 Antigravity)

**A1. Parallel agent timeline view**
A new "Timeline" sub-tab in Logs showing each agent as horizontal swim-lane with its execution span. Visual proof that 8 agents run as coordinated workers under Master. Latency-per-agent visible.

**A2. Workspace bundle schema validation badge**
Add a green "Schema-validated v1.0" badge to the export button. On export, the bundle is verified against the Antigravity workspace artifact schema. Judge sees proof of compliance.

**A3. Live agent collaboration handoff visualization**
When OutbreakEye finishes and Master dispatches SeverityMind, show animated arrow between them in Brain dashboard. Makes orchestration physically visible.

**Estimated points:** +2 Antigravity (23 → 25)

---

### Phase B — Reasoning Amplification (+1 Reasoning)

**B1. Master Self-Critique step**
After `master.done`, Master emits one more event: `master.reflect`. Reviews its own run, scores confidence in conclusions, flags any rushed steps. Surfaces as a "Reflection" card on Logs.

**B2. Cross-agent disagreement viz**
When RecoveryGuard disagrees with OutbreakEye's classification, show side-by-side opinion cards with weighted evidence. Pakistan dengue example: water-main contradiction already implemented — just visualize it.

**B3. Confidence trajectory**
Line chart on Logs: confidence-over-iterations. Starts at 0%, rises as evidence accumulates, dips on contradictions, settles. Shows that reasoning is dynamic not pre-baked.

**Estimated points:** +1 Reasoning (19 → 20)

---

### Phase C — Detection Sharpening (+1 to +2 Detection)

**C1. Evidence Quote Wall**
Dedicated card showing all `evidence_quotes` from all agents as scrollable wall. Each quote labeled with source (NASA / Hospital / Social / Trends). Proves reasoning is grounded in real data.

**C2. 2 additional signal sources (labeled)**
- **NIH Pakistan weekly bulletin** (mocked w/ disclosure badge — no public API exists)
- **WHO Health Observatory dengue endemic map** (cached JSON snapshot)

Now 8 sources total. Each visible in SignalFuse output.

**C3. Real-time detection latency**
Each tool card shows `T+0s` `T+3.2s` `T+5.8s` etc. relative to run start. Shows speed of detection — sub-30-second end-to-end.

**Estimated points:** +1 to +2 Detection (18 → 19 or 20)

---

### Phase D — Action Precision (+1 Action)

**D1. Multi-Crisis Trade-off Table**
Dedicated card for dual-crisis scenarios: row-by-row table showing how each resource pool splits between Crisis A and Crisis B. Numeric tradeoff explicit (not hidden in narrative).

**D2. Animated Resource Deployment**
Resource Allocation chart bars FILL with progress animation over 2-3 seconds when sim runs. Makes "deployment" feel real.

**D3. Stakeholder Delivery Channel Cards**
Each generated alert shows its delivery channel: WhatsApp icon for public, SMS for emergency, Email for hospital, Press Release for media, Slack for command center. Makes Action visible as real-world execution not just text.

**Estimated points:** +1 Action (14 → 15)

---

### Phase E — Tech Excellence (+1 Tech)

**E1. TypeScript strict + zero errors**
Run `tsc --noEmit` clean. Fix any `any` casts that can be tightened.

**E2. License + Contributing**
Add `LICENSE` (MIT), `CONTRIBUTING.md`. Shows production-readiness.

**E3. Performance dashboard**
Add a hidden "Performance" surface (dev-mode) showing FPS, JS thread budget, render counts. Even if hidden, README claims it exists.

**E4. README upgrade**
Add architecture diagram (ASCII art exists), API reference table, scalability section, cost analysis with real numbers.

**Estimated points:** +1 Tech (9 → 10)

---

### Phase F — Bonus Wow (locks 10/10 Innovation)

**F1. Skia holographic DRI gauge**
Replace flat DRI band with Skia-rendered circular gauge with shader fill + holographic shine. Wow factor.

**F2. Spring physics resource bars**
Resource bars use Reanimated spring not linear timing. Feels alive.

**F3. Particle burst on master.done**
Tiny confetti / glow burst when run completes. Subtle delight moment.

**F4. Optional sound design**
2-3 second SFX library: agent dispatch bleep, decision tick, completion chime. Toggleable in settings.

**Estimated points:** Already 10/10, just locks it.

---

## Recommended Subset for 95+

**Pick THESE 6 items (highest ROI per minute):**

| # | Action | Phase | Pts | Effort |
|---|--------|-------|-----|--------|
| 1 | Evidence Quote Wall | C1 | +1 | 30min |
| 2 | Confidence Trajectory chart | B3 | +1 | 30min |
| 3 | Real-time detection latency on cards | C3 | +1 | 20min |
| 4 | Multi-Crisis Trade-off Table | D1 | +1 | 25min |
| 5 | Workspace schema validation badge + LICENSE/Contributing | A2 + E2 | +1 | 25min |
| 6 | Holographic DRI gauge (Skia) | F1 | locks Innovation | 60min |

**Total: ~3 hr inline. Pushes 93 → 97-98 ceiling.**

---

## ECC agents/skills to verify each phase

| Agent / Skill | Use |
|---------------|-----|
| `code-reviewer` | After each phase, review for regressions |
| `typescript-reviewer` | Phase E1 — strict mode pass |
| `silent-failure-hunter` | After phase A — verify orchestrator error paths still robust |
| `audit` skill | Final pass before submit — quality score |
| `polish` skill | Last 30 min — micro-detail pre-ship |
| `security-review` | Verify no key leakage in new code |
| `claude-api` skill | Ensure prompt caching still optimal |

---

## What I will NOT do (out of scope)

- Sound design (requires audio assets)
- Real WebSocket parallel streaming (existing SSE is sufficient)
- New backend agents (8 is enough, more = scope creep)
- Full Skia visual overhaul (just the DRI gauge)
- Multi-tenant deployment (single demo run is enough)
- Web target fixes (Android focus locked)

---

## After execution

Run `audit` skill → final rubric estimate.
Run `code-reviewer` → catch regressions.
Commit + push.
Hand off to user for Vercel deploy + APK rebuild + video recording.

---

**TL;DR — Pick 6 high-ROI items, 3 hr inline work, lifts rubric ceiling from 93 → 97-98.**
