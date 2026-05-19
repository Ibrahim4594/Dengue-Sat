import { AntigravityTrace } from './types';

export type AgenticPhase =
  | 'workplan'
  | 'task'
  | 'observation'
  | 'reasoning'
  | 'decision'
  | 'tool-call'
  | 'action'
  | 'recovery'
  | 'outcome'
  | 'system';

interface PhaseMeta {
  id: AgenticPhase;
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  icon: string; // Ionicons name
  description: string;
}

export const PHASES: Record<AgenticPhase, PhaseMeta> = {
  workplan: {
    id: 'workplan',
    label: 'Workplan',
    shortLabel: 'PLAN',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.18)',
    icon: 'map',
    description: 'Master coordinator strategic plan',
  },
  task: {
    id: 'task',
    label: 'Task Plan',
    shortLabel: 'TASK',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.18)',
    icon: 'list',
    description: 'Per-agent task assignment',
  },
  observation: {
    id: 'observation',
    label: 'Observation',
    shortLabel: 'OBS',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.18)',
    icon: 'eye',
    description: 'Raw signal data ingested',
  },
  reasoning: {
    id: 'reasoning',
    label: 'Reasoning',
    shortLabel: 'REASON',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.18)',
    icon: 'bulb',
    description: 'Extended thinking chain-of-thought',
  },
  decision: {
    id: 'decision',
    label: 'Decision',
    shortLabel: 'DECIDE',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.18)',
    icon: 'git-branch',
    description: 'Planner verdict / fork choice',
  },
  'tool-call': {
    id: 'tool-call',
    label: 'Tool Call',
    shortLabel: 'TOOL',
    color: '#22d3ee',
    bg: 'rgba(34, 211, 238, 0.18)',
    icon: 'construct',
    description: 'Sub-agent dispatch',
  },
  action: {
    id: 'action',
    label: 'Action',
    shortLabel: 'ACT',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.18)',
    icon: 'flash',
    description: 'Resource allocation / alert dispatch / simulation',
  },
  recovery: {
    id: 'recovery',
    label: 'Recovery',
    shortLabel: 'RECOV',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.18)',
    icon: 'refresh-circle',
    description: 'Error handled or false-positive corrected',
  },
  outcome: {
    id: 'outcome',
    label: 'Outcome',
    shortLabel: 'DONE',
    color: '#84cc16',
    bg: 'rgba(132, 204, 22, 0.18)',
    icon: 'checkmark-circle',
    description: 'Final verdict and metrics',
  },
  system: {
    id: 'system',
    label: 'System',
    shortLabel: 'SYS',
    color: '#6b7280',
    bg: 'rgba(107, 114, 128, 0.18)',
    icon: 'cog',
    description: 'Pipeline metadata',
  },
};

/**
 * Classify a trace event into one of the 9 rubric-aligned agentic phases.
 * Prefers explicit `_antigravity.phase` from server, falls back to type/agent inference.
 */
export function classifyPhase(t: AntigravityTrace): AgenticPhase {
  const meta = (t as any)._antigravity ?? {};
  const explicit = meta.phase as string | undefined;
  if (explicit) {
    if (explicit === 'init') return 'workplan';
    if (explicit === 'plan') {
      // First plan iter = workplan; later iters = decisions
      return (meta.iter ?? 0) === 0 ? 'workplan' : 'decision';
    }
    if (explicit === 'tool-dispatch') return 'tool-call';
    if (explicit === 'tool-result') {
      if (t.agent === 'crisis_sim' || t.agent === 'resource_forge') return 'action';
      if (t.agent === 'recovery_guard') return 'recovery';
      if (t.agent === 'signal_fuse') return 'observation';
      if (t.agent === 'severity_mind') return 'reasoning';
      return 'tool-call';
    }
    if (explicit === 'complete') return 'outcome';
  }

  // Fallback inference
  if (t.type === 'master.start') return 'workplan';
  if (t.type === 'master.done') return 'outcome';
  if (t.type === 'master.iter') {
    return (t.iter ?? 0) === 0 ? 'workplan' : 'decision';
  }
  if (t.type === 'tool.error') return 'recovery';
  if (t.type === 'tool.start') return 'tool-call';
  if (t.type === 'tool.done') {
    if (t.agent === 'recovery_guard') return 'recovery';
    if (t.agent === 'crisis_sim' || t.agent === 'resource_forge') return 'action';
    if (t.agent === 'signal_fuse') return 'observation';
    if (t.agent === 'severity_mind') return 'reasoning';
    return 'tool-call';
  }
  return 'system';
}

/** Convenience: get phase meta for a trace */
export function phaseFor(t: AntigravityTrace): PhaseMeta {
  return PHASES[classifyPhase(t)];
}
