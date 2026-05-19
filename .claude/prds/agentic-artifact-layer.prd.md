# Antigravity Agentic Artifact Layer

## Problem
DengueSat's current trace viewer renders the multi-agent run as a chronological event stream. Judges scoring the AI-Seekho 2026 Challenge 3 rubric (45-50% weight combined on Antigravity Integration + Agentic Reasoning) cannot quickly identify the artifacts they look for — workplan, task list, decisions, recoveries, outcomes. Without explicit rubric-aligned labeling, even a high-quality agentic pipeline reads as log spam and scores below its actual sophistication.

## Evidence
- AI-Seekho Challenge 3 rubric (PDF): Antigravity Integration 20-25%, Agentic Reasoning & Coordination 20-25%, Situation Detection 20%, Action Planning 15%, Tech 10%, Innovation 10%. Two rubric buckets totaling ~50% reward visible agentic structure.
- Google Antigravity official docs (antigravity.google/docs/artifacts): "Artifacts allow for the Agent to asynchronously communicate its work to the user, as opposed to requiring the user to carefully monitor every Agent step synchronously." Artifact types: Task List, Implementation Plan, Walkthrough, Knowledge.
- Anthropic "Building Effective Agents" (Jul 2025): names the exact pattern DengueSat uses as Orchestrator-Workers, and lists production agentic loops as having explicit "understanding inputs → reasoning → planning → tool use → error recovery → completion".
- User testing in current build: Logs tab shows ~12-20 generic trace cards per run, requires ≥30 sec scroll to find any specific decision or recovery event.
- Hackathon constraint: judges review 500 submissions. First 30 sec on each app are decisive. A 5-second-legible Logs view wins.

## Users
- **Primary**: AI-Seekho 2026 Challenge 3 judges (panel members + competition reviewers, time-constrained, scoring against a documented rubric).
- **Secondary**: User-presented audience during 3-5 min demo video (rapid visual narrative required).
- **Not for**: End citizens of the deployed app (they live on the Alerts, Map, Citizen tabs; agentic detail is not their workflow).

## Hypothesis
We believe **a structured Antigravity-Artifact view that labels Workplan, Task List, Observations, Reasoning, Decisions, Tool Calls, Action Execution, Error Recovery, and Final Outcomes as explicit sections (each derivable from existing trace events) plus a Walkthrough/Replay control** will **score 95%+ on the combined Antigravity Integration + Agentic Reasoning rubric** for **AI-Seekho hackathon judges**. We'll know we're right when **a 5-second glance at the Logs/Brain tab during demo makes the multi-agent workflow legible without the judge reading any prose paragraph**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Rubric score: Antigravity Integration | ≥ 23 / 25 | Judge feedback / public rubric scoring sheet |
| Rubric score: Agentic Reasoning | ≥ 18 / 20 | Judge feedback / public rubric scoring sheet |
| Time-to-comprehension on Logs tab | < 5 sec | Internal demo-test with 3 non-engineer testers |
| Artifact coverage (9 rubric concepts visible) | 9/9 | Manual checklist on demo run |
| Demo video clarity | "agentic pipeline obvious" verdict | Self-review + 2 external reviewers |

## Scope
**MVP** — Restructure the existing AntigravityTraceViewer into nine labeled artifact sections, derived purely from existing SSE event stream (no new backend work). Add explicit phase badges on each trace card. Preserve Decision Replay as a complementary view.

The nine artifacts (each maps to an existing trace event or computed view):

| # | Artifact | Source |
|---|---|---|
| 1 | **Workplan** | First master.iter event's thinking block |
| 2 | **Task Plan** | Per-agent tool.start + tool.done pairs, summarized |
| 3 | **Observations** | tool.done outputs, especially signal_fuse fused data |
| 4 | **Reasoning** | All `thinking` and `reasoning` fields |
| 5 | **Decisions** | master.iter events with non-empty `text` (planner verdicts) |
| 6 | **Tool Calls** | tool.start events grouped with their tool.done pairs |
| 7 | **Action Execution** | crisis_sim + resource_forge outputs |
| 8 | **Error Recovery** | tool.error events + recovery_guard outputs |
| 9 | **Final Outcomes** | master.done event + RunSummaryCard metrics |

**Out of scope**
- Programmatic Tool Calling migration — Anthropic preview, doesn't move rubric, ~3 day rewrite
- Tool Search Tool — only useful for >50 tools, we have 8
- Claude Agent SDK migration — current direct SDK use works; switching introduces risk pre-deadline
- Multi-modal artifacts (screenshots, recordings) — only renderable inside Antigravity IDE workspace, not in deployed RN app
- Workspace bundle file format change — existing rubricEvidence JSON export already covers it
- Real-time judge collaboration (live cursors, comments) — out of hackathon scope

## Delivery Milestones
<!-- Business outcomes, not engineering tasks. /plan turns each into a plan. -->

| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Phase badge on every trace card | Trace card visually labels its rubric category (OBSERVATION / REASONING / DECISION / TOOL / ACTION / RECOVERY / OUTCOME). Existing _antigravity.phase metadata surfaced as colored badge + icon. | pending | — |
| 2 | Agentic Dashboard restructure of Logs tab | Logs tab top section becomes 9-card artifact dashboard (Workplan, Task Plan, Observations, Reasoning, Decisions, Tool Calls, Actions, Recovery, Outcomes). Each card shows count + latest event preview, taps to expand. Existing live trace + replay views become nested tabs below. | pending | — |
| 3 | Workplan card on Intel tab | After analysis completes, Intel tab surfaces the Master's workplan (first thinking block, distilled) as a compact card above other run results. Gives judges immediate proof of planning. | pending | — |
| 4 | Workspace artifact JSON export upgrade | The existing antigravity-bundle export gains a top-level `artifacts` object grouping events by all 9 categories. Judges who download the JSON see explicit structure. Bundles version-stamped. | pending | — |
| 5 | Demo-mode safety net (one-tap "Load Demo Run") | One button on Intel tab loads a pre-canned realistic dual-crisis run into the store (no API). Guarantees populated UI even if Claude key fails at demo time. Labeled clearly as "Demo Replay" not real data. | pending | — |

## Open Questions
- [ ] Should Workplan also be exposed in Decision Replay's first step, or kept Intel-only?
- [ ] Should the Demo Replay auto-load on first launch (zero-friction judge experience) or require explicit tap?
- [ ] Should the Workspace artifact JSON include thinking blocks verbatim or summarized for size?
- [ ] Is one Workplan card per run enough, or do we also need a "Re-plan" event surfaced when Master changes course mid-run?

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Judges skim too fast and miss any structure | Medium | High | Demo video script explicitly narrates each rubric artifact section |
| Claude API key invalid during live demo | Medium | High | Milestone 5 (Demo Replay) provides one-tap populated UI without backend |
| Trace event phase metadata missing on some events | Low | Medium | Frontend infers phase from event type/agent if `_antigravity.phase` absent |
| Logs tab becomes too dense for small phones | Medium | Medium | Cards collapse by default; tap-to-expand pattern |
| Decision Replay + Agentic Dashboard duplicate content | Medium | Low | Position Dashboard as static summary, Replay as time-machine. Different mental models, same source data. |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*
*Author: Ibrahim Samad*
*Date: 2026-05-16*
*Related: docs/superpowers/specs/2026-05-14-denguesat-max-power-design.md*
