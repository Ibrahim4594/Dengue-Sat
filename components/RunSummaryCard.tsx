import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { AntigravityTrace } from '../lib/types';

export function RunSummaryCard() {
  const theme = useTheme();
  const traces = useCrisisStore((s: any) => s.antigravityTraces) as AntigravityTrace[];
  const cost = useCrisisStore((s: any) => s.cost);
  const styles = makeStyles(theme);

  const summary = useMemo(() => {
    if (!traces || traces.length === 0) return null;
    const done = traces.find(t => t.type === 'master.done');
    if (!done) return null;

    const startEvent = traces.find(t => t.type === 'master.start');
    const startTs = startEvent?.timestamp ?? traces[0]?.timestamp;
    const endTs = done.timestamp;
    const durationSec = ((endTs - startTs) / 1000).toFixed(1);

    const toolDoneEvents = traces.filter(t => t.type === 'tool.done');
    const toolErrEvents = traces.filter(t => t.type === 'tool.error');
    const masterIters = traces.filter(t => t.type === 'master.iter').length;

    const uniqueAgents = new Set(toolDoneEvents.map(t => t.agent)).size;

    return {
      durationSec,
      totalToolCalls: toolDoneEvents.length,
      totalErrors: toolErrEvents.length,
      masterIters,
      uniqueAgents,
      finalText: done.text ?? '',
    };
  }, [traces]);

  if (!summary) return null;

  return (
    <Surface style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
        <Text style={styles.title}>Antigravity Run Complete</Text>
      </View>
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricNum}>{summary.durationSec}s</Text>
          <Text style={styles.metricLabel}>duration</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricNum}>{summary.uniqueAgents}/8</Text>
          <Text style={styles.metricLabel}>agents used</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricNum}>{summary.masterIters}</Text>
          <Text style={styles.metricLabel}>master iters</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricNum}>{summary.totalToolCalls}</Text>
          <Text style={styles.metricLabel}>tool calls</Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricNum, summary.totalErrors > 0 && { color: theme.colors.error }]}>
            {summary.totalErrors}
          </Text>
          <Text style={styles.metricLabel}>errors</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricNum}>${(cost?.totalUSD ?? 0).toFixed(4)}</Text>
          <Text style={styles.metricLabel}>cost</Text>
        </View>
      </View>
      {summary.finalText && (
        <View style={styles.verdict}>
          <Text style={styles.verdictLabel}>MASTER VERDICT</Text>
          <Text style={styles.verdictText}>{summary.finalText.slice(0, 280)}</Text>
        </View>
      )}
    </Surface>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    card: { padding: 14, marginHorizontal: 12, marginVertical: 8, borderRadius: 12, backgroundColor: theme.colors.surface, elevation: 2, borderLeftWidth: 4, borderLeftColor: theme.colors.primary },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    title: { fontSize: 15, fontWeight: '700', color: theme.colors.onSurface },
    metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
    metric: { minWidth: 60, alignItems: 'center', flexGrow: 1 },
    metricNum: { fontSize: 18, fontWeight: '800', color: theme.colors.primary, fontVariant: ['tabular-nums'] },
    metricLabel: { fontSize: 9, fontWeight: '600', color: theme.colors.onSurfaceVariant, letterSpacing: 0.5, marginTop: 2, textAlign: 'center' },
    verdict: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.outline },
    verdictLabel: { fontSize: 9, fontWeight: '700', color: theme.colors.onSurfaceVariant, letterSpacing: 1, marginBottom: 4 },
    verdictText: { fontSize: 13, color: theme.colors.onSurface, lineHeight: 18, fontStyle: 'italic' },
  });
}
