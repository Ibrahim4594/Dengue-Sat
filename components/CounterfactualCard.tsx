import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useCrisisStore } from '../hooks/useCrisisStore';

/**
 * Counterfactual projection: what happens if NO intervention.
 * Reads from simulationResult.before (the "do nothing" baseline).
 */
export function CounterfactualCard() {
  const theme = useTheme();
  const sim = useCrisisStore((s: any) => s.simulationResult);
  const styles = makeStyles(theme);

  if (!sim) return null;

  const before = sim.before ?? {};
  const after = sim.after ?? {};
  const cases = before.projectedCases ?? 0;
  const deaths = before.projectedDeaths ?? 0;
  const livesSaved = sim.livesSaved ?? 0;
  const casesReduced = sim.casesReduced ?? 0;

  const reductionPct = cases > 0 ? Math.round(((casesReduced) / cases) * 100) : 0;

  return (
    <Surface style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="warning" size={18} color={theme.colors.error} />
        <Text style={styles.title}>Counterfactual — If No Action</Text>
      </View>
      <Text style={styles.subtitle}>14-day projection without DengueSat intervention</Text>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={[styles.bigNum, { color: theme.colors.error }]}>
            {cases.toLocaleString()}
          </Text>
          <Text style={styles.metricLabel}>projected cases</Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.bigNum, { color: theme.colors.error }]}>
            {deaths.toLocaleString()}
          </Text>
          <Text style={styles.metricLabel}>projected deaths</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={[styles.bigNum, { color: theme.colors.primary }]}>
            -{casesReduced.toLocaleString()}
          </Text>
          <Text style={styles.metricLabel}>cases prevented ({reductionPct}%)</Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.bigNum, { color: theme.colors.primary }]}>
            +{livesSaved.toLocaleString()}
          </Text>
          <Text style={styles.metricLabel}>lives saved</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Ionicons name="trending-down" size={14} color={theme.colors.primary} />
        <Text style={styles.footerText}>
          With intervention: projected to {(after.projectedCases ?? 0).toLocaleString()} cases / {(after.projectedDeaths ?? 0).toLocaleString()} deaths
        </Text>
      </View>
    </Surface>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    card: { padding: 14, marginHorizontal: 16, marginBottom: 16, borderRadius: 12, backgroundColor: theme.colors.surface, elevation: 1, borderLeftWidth: 4, borderLeftColor: theme.colors.error },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    title: { fontSize: 15, fontWeight: '700', color: theme.colors.onSurface },
    subtitle: { fontSize: 12, color: theme.colors.onSurfaceVariant, marginBottom: 14 },
    metricsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
    metric: { alignItems: 'center', flex: 1 },
    bigNum: { fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
    metricLabel: { fontSize: 10, color: theme.colors.onSurfaceVariant, marginTop: 2, letterSpacing: 0.5, textAlign: 'center' },
    divider: { height: 1, backgroundColor: theme.colors.outline, marginVertical: 12 },
    footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.outline },
    footerText: { fontSize: 11, color: theme.colors.onSurfaceVariant, flex: 1 },
  });
}
