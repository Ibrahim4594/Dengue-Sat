import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { AgentIcon } from '../lib/agent-icons';
import { Brain } from 'phosphor-react-native';
import { AntigravityTrace } from '../lib/types';

// Legacy emoji map kept for label fallback only; rendering uses AgentIcon.
const AGENT_EMOJI_DEPRECATED: Record<string, string> = {
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

interface Step {
  type: 'master' | 'tool';
  iter?: number;
  trace: AntigravityTrace;
  label: string;
}

export function DecisionReplay() {
  const theme = useTheme();
  const traces = useCrisisStore((s: any) => s.antigravityTraces) as AntigravityTrace[];
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playTimer = useRef<any>(null);

  const steps: Step[] = useMemo(() => {
    if (!traces || traces.length === 0) return [];
    return traces
      .filter(t => t.type === 'master.iter' || t.type === 'tool.done' || t.type === 'master.done')
      .map(t => {
        if (t.type === 'master.iter') {
          return { type: 'master' as const, iter: t.iter, trace: t, label: `Master iter ${t.iter}` };
        }
        if (t.type === 'master.done') {
          return { type: 'master' as const, trace: t, label: 'Master verdict' };
        }
        return { type: 'tool' as const, trace: t, label: t.agent ?? 'tool' };
      });
  }, [traces]);

  useEffect(() => {
    if (!playing) {
      if (playTimer.current) clearInterval(playTimer.current);
      return;
    }
    playTimer.current = setInterval(() => {
      setStepIdx(i => {
        if (i >= steps.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 1400);
    return () => playTimer.current && clearInterval(playTimer.current);
  }, [playing, steps.length]);

  useEffect(() => {
    if (steps.length > 0 && stepIdx > steps.length - 1) {
      setStepIdx(steps.length - 1);
    }
  }, [steps.length]);

  if (steps.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="play-circle-outline" size={56} color={theme.colors.onSurfaceVariant} />
        <Text style={styles.emptyTitle}>Decision Replay</Text>
        <Text style={styles.empty}>
          Run analysis first. Then step through the Master Coordinator decisions one by one — or hit play for live replay.
        </Text>
      </View>
    );
  }

  const current = steps[Math.min(stepIdx, steps.length - 1)];
  const t = current.trace;

  return (
    <View style={styles.container}>
      {/* Timeline strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeline} contentContainerStyle={styles.timelineContent}>
        {steps.map((s, i) => {
          const active = i === stepIdx;
          const past = i < stepIdx;
          const agentKey = s.type === 'master' ? 'master' : (s.trace.agent ?? '').toLowerCase().replace(/([A-Z])/g, '_$1').replace(/^_/, '');
          return (
            <Pressable
              key={s.trace.id}
              onPress={() => { setStepIdx(i); setPlaying(false); }}
              style={[
                styles.step,
                active && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer },
                past && { opacity: 0.5 },
              ]}
            >
              <AgentIcon agent={agentKey} size={18} color={active ? theme.colors.primary : theme.colors.onSurfaceVariant} weight={active ? 'fill' : 'bold'} />
              <Text style={[styles.stepLabel, active && { color: theme.colors.primary, fontWeight: '800' }]}>
                {s.iter !== undefined ? `#${s.iter}` : 'END'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable
          onPress={() => setStepIdx(Math.max(0, stepIdx - 1))}
          style={styles.ctrlBtn}
          disabled={stepIdx === 0}
        >
          <Ionicons name="play-skip-back" size={20} color={stepIdx === 0 ? theme.colors.onSurfaceVariant : theme.colors.primary} />
        </Pressable>
        <Pressable
          onPress={() => setPlaying(p => !p)}
          style={[styles.ctrlBtn, styles.playBtn]}
        >
          <Ionicons name={playing ? 'pause' : 'play'} size={24} color={theme.colors.onPrimary} />
        </Pressable>
        <Pressable
          onPress={() => setStepIdx(Math.min(steps.length - 1, stepIdx + 1))}
          style={styles.ctrlBtn}
          disabled={stepIdx >= steps.length - 1}
        >
          <Ionicons name="play-skip-forward" size={20} color={stepIdx >= steps.length - 1 ? theme.colors.onSurfaceVariant : theme.colors.primary} />
        </Pressable>
        <View style={styles.progressBox}>
          <Text style={styles.progressText}>{stepIdx + 1} / {steps.length}</Text>
        </View>
      </View>

      {/* Current step detail */}
      <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailContent}>
        <Surface style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailType}>{t.type.toUpperCase()}</Text>
            <Text style={styles.detailTime}>{new Date(t.timestamp).toLocaleTimeString()}</Text>
          </View>
          {t.agent && <Text style={styles.detailAgent}>Agent: {t.agent}</Text>}
          {t.thinking && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>💭 THINKING</Text>
              <Text style={styles.thinking}>{t.thinking}</Text>
            </View>
          )}
          {t.text && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>📝 PLANNER OUTPUT</Text>
              <Text style={styles.text}>{t.text}</Text>
            </View>
          )}
          {t.toolCallsPlanned && t.toolCallsPlanned.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>🔧 DISPATCHING</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {t.toolCallsPlanned.map((tool, i) => (
                  <View key={i} style={styles.chip}><Text style={styles.chipText}>{tool}</Text></View>
                ))}
              </View>
            </View>
          )}
          {t.reasoning && (
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Brain size={12} color={theme.colors.onSurfaceVariant} weight="bold" />
                <Text style={styles.sectionLabel}>SUB-AGENT REASONING</Text>
              </View>
              <Text style={styles.thinking}>{t.reasoning}</Text>
            </View>
          )}
          {t.output && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>📤 OUTPUT (truncated)</Text>
              <Text style={styles.code}>{JSON.stringify(t.output, null, 2).slice(0, 600)}</Text>
            </View>
          )}
          {t.usage && (
            <View style={styles.usageRow}>
              <Ionicons name="flash" size={11} color={theme.colors.primary} />
              <Text style={styles.usage}>
                ${(t.usage.costUSD ?? 0).toFixed(5)} · {((t.usage.inputTokens ?? 0) + (t.usage.outputTokens ?? 0)).toLocaleString()} tok
              </Text>
            </View>
          )}
        </Surface>
      </ScrollView>
    </View>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    emptyContainer: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.onSurface, marginTop: 12, marginBottom: 8 },
    empty: { fontSize: 14, textAlign: 'center', color: theme.colors.onSurfaceVariant, lineHeight: 20, maxWidth: 300 },
    timeline: { maxHeight: 72, paddingVertical: 8 },
    timelineContent: { paddingHorizontal: 10, gap: 6, alignItems: 'center' },
    step: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.outline, alignItems: 'center', minWidth: 50 },
    stepEmoji: { fontSize: 18 },
    stepLabel: { fontSize: 9, color: theme.colors.onSurfaceVariant, marginTop: 2, fontWeight: '600' },
    controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.outline },
    ctrlBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    playBtn: { backgroundColor: theme.colors.primary, width: 48, height: 48, borderRadius: 24 },
    progressBox: { marginLeft: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: theme.colors.surfaceVariant },
    progressText: { fontSize: 12, fontWeight: '600', color: theme.colors.onSurfaceVariant, fontVariant: ['tabular-nums'] },
    detailScroll: { flex: 1 },
    detailContent: { padding: 12 },
    detailCard: { padding: 12, borderRadius: 10, backgroundColor: theme.colors.surface, elevation: 1 },
    detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    detailType: { fontSize: 11, fontWeight: '800', color: theme.colors.primary, letterSpacing: 1 },
    detailTime: { fontSize: 11, color: theme.colors.onSurfaceVariant },
    detailAgent: { fontSize: 13, fontWeight: '700', color: theme.colors.onSurface, marginBottom: 10 },
    section: { marginBottom: 8 },
    sectionLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.onSurfaceVariant, letterSpacing: 0.5, marginBottom: 4 },
    text: { fontSize: 13, color: theme.colors.onSurface, lineHeight: 18 },
    thinking: { fontSize: 12, color: theme.colors.onSurfaceVariant, lineHeight: 17, fontStyle: 'italic' },
    chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: theme.colors.secondaryContainer },
    chipText: { fontSize: 11, fontWeight: '600', color: theme.colors.onSecondaryContainer, fontFamily: 'monospace' },
    code: { fontFamily: 'monospace', fontSize: 11, color: theme.colors.onSurfaceVariant, backgroundColor: theme.colors.surfaceVariant, padding: 6, borderRadius: 4 },
    usageRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    usage: { fontSize: 11, color: theme.colors.primary, fontWeight: '600' },
  });
}
