import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { AntigravityTrace } from '../lib/types';
import { PHASES, classifyPhase, AgenticPhase } from '../lib/phases';
import { selectionHaptic } from '../lib/haptics';
import { EvidenceWall } from './EvidenceWall';
import { ConfidenceTrajectory } from './ConfidenceTrajectory';

const PHASE_ORDER: AgenticPhase[] = [
  'workplan',
  'task',
  'observation',
  'reasoning',
  'decision',
  'tool-call',
  'action',
  'recovery',
  'outcome',
];

interface PhaseGroup {
  phase: AgenticPhase;
  traces: AntigravityTrace[];
}

export function AgenticDashboard() {
  const theme = useTheme();
  const traces = useCrisisStore((s: any) => s.antigravityTraces) as AntigravityTrace[];
  const [expanded, setExpanded] = useState<AgenticPhase | null>(null);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const groups: Record<AgenticPhase, AntigravityTrace[]> = useMemo(() => {
    const out: Record<string, AntigravityTrace[]> = {};
    for (const phase of PHASE_ORDER) out[phase] = [];
    for (const t of traces) {
      const phase = classifyPhase(t);
      if (phase === 'system') continue;
      // task = tool-call pairs; we synth: tool-call events count as both tool-call AND task entries
      if (phase === 'tool-call' && t.type === 'tool.start') {
        out['task'].push(t);
      }
      out[phase].push(t);
    }
    return out as any;
  }, [traces]);

  if (traces.length === 0) {
    return (
      <Surface style={styles.emptyCard}>
        <Ionicons name="pulse-outline" size={48} color={theme.colors.onSurfaceVariant} />
        <Text style={styles.emptyTitle}>Antigravity Standby</Text>
        <Text style={styles.emptyText}>
          Run analysis from the Intel tab. The 9 agentic artifacts will populate here in real time.
        </Text>
      </Surface>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Agentic Pipeline Artifacts</Text>
        <Text style={styles.subheading}>9 rubric-aligned views into the multi-agent run</Text>
      </View>

      <ConfidenceTrajectory />
      <EvidenceWall />

      <View style={styles.grid}>
        {PHASE_ORDER.map((phase, idx) => {
          const meta = PHASES[phase];
          const items = groups[phase] ?? [];
          const isExpanded = expanded === phase;
          return (
            <MotiView
              key={phase}
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 220, delay: idx * 40 }}
            >
              <Pressable
                onPress={() => {
                  selectionHaptic();
                  setExpanded(isExpanded ? null : phase);
                }}
              >
                <Surface
                  style={[
                    styles.card,
                    { borderLeftColor: meta.color },
                    items.length === 0 && styles.cardEmpty,
                    isExpanded && { borderColor: meta.color, borderWidth: 1.5 },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
                      <Ionicons name={meta.icon as any} size={16} color={meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardLabel}>{meta.label}</Text>
                      <Text style={styles.cardDesc}>{meta.description}</Text>
                    </View>
                    <View style={[styles.countBadge, { backgroundColor: meta.bg }]}>
                      <Text style={[styles.countText, { color: meta.color }]}>{items.length}</Text>
                    </View>
                  </View>
                  {isExpanded && items.length > 0 && (
                    <View style={styles.expandBody}>
                      {items.slice(0, 6).map((t) => (
                        <View key={t.id} style={styles.itemRow}>
                          <View style={[styles.itemDot, { backgroundColor: meta.color }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemAgent}>{t.agent ?? t.type}</Text>
                            <Text style={styles.itemPreview} numberOfLines={2}>
                              {(t.text ?? t.thinking ?? t.reasoning ?? t.error ?? JSON.stringify(t.output ?? {})).slice(0, 180)}
                            </Text>
                          </View>
                          <Text style={styles.itemTime}>
                            {new Date(t.timestamp).toLocaleTimeString().slice(0, 5)}
                          </Text>
                        </View>
                      ))}
                      {items.length > 6 && (
                        <Text style={styles.moreText}>+{items.length - 6} more in Live Trace tab</Text>
                      )}
                    </View>
                  )}
                </Surface>
              </Pressable>
            </MotiView>
          );
        })}
      </View>
    </ScrollView>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1, padding: 12 },
    headerRow: { marginBottom: 16, paddingHorizontal: 4 },
    heading: { fontSize: 20, fontFamily: 'Sora_700Bold', color: theme.colors.onSurface },
    subheading: { fontSize: 12, fontFamily: 'Inter_500Medium', color: theme.colors.onSurfaceVariant, marginTop: 2 },
    grid: { gap: 8 },
    card: {
      padding: 14,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      borderLeftWidth: 4,
      borderColor: theme.colors.outline,
      borderWidth: 1,
      elevation: 1,
      marginBottom: 4,
    },
    cardEmpty: { opacity: 0.5 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    cardLabel: { fontSize: 14, fontFamily: 'Inter_700Bold', color: theme.colors.onSurface },
    cardDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', color: theme.colors.onSurfaceVariant, marginTop: 1 },
    countBadge: { minWidth: 28, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignItems: 'center' },
    countText: { fontSize: 13, fontFamily: 'Inter_800ExtraBold' },
    expandBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.outline, gap: 10 },
    itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    itemDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
    itemAgent: { fontSize: 11, fontFamily: 'Inter_700Bold', color: theme.colors.onSurface, letterSpacing: 0.3 },
    itemPreview: { fontSize: 11, fontFamily: 'Inter_400Regular', color: theme.colors.onSurfaceVariant, marginTop: 2, lineHeight: 15 },
    itemTime: { fontSize: 10, color: theme.colors.onSurfaceVariant, fontVariant: ['tabular-nums'] },
    moreText: { fontSize: 11, color: theme.colors.primary, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
    emptyCard: { padding: 32, margin: 16, borderRadius: 16, alignItems: 'center', gap: 12, backgroundColor: theme.colors.surface },
    emptyTitle: { fontSize: 16, fontFamily: 'Sora_700Bold', color: theme.colors.onSurface },
    emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: theme.colors.onSurfaceVariant, textAlign: 'center' },
  });
}
