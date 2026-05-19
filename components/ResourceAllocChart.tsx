import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useCrisisStore } from '../hooks/useCrisisStore';

interface ResourceBar {
  label: string;
  icon: any;
  allocated: number;
  total: number;
  color: string;
}

export function ResourceAllocChart() {
  const theme = useTheme();
  const plan = useCrisisStore((s: any) => s.resourcePlan);
  const styles = makeStyles(theme);

  if (!plan || !plan.allocations || plan.allocations.length === 0) return null;

  const totals = plan.allocations.reduce(
    (acc: any, a: any) => ({
      ambulances: acc.ambulances + (a.ambulances ?? 0),
      fumigationTrucks: acc.fumigationTrucks + (a.fumigationTrucks ?? 0),
      hospitalBeds: acc.hospitalBeds + (a.hospitalBeds ?? 0),
      medicalTeams: acc.medicalTeams + (a.medicalTeams ?? 0),
    }),
    { ambulances: 0, fumigationTrucks: 0, hospitalBeds: 0, medicalTeams: 0 },
  );

  const reserve = plan.reserve ?? {};
  const reserveCounts = {
    ambulances: reserve.ambulances?.available ?? 0,
    fumigationTrucks: reserve.fumigationTrucks?.available ?? 0,
    hospitalBeds: reserve.hospitalBeds?.available ?? 0,
    medicalTeams: reserve.medicalTeams?.available ?? 0,
  };

  const bars: ResourceBar[] = [
    { label: 'Ambulances', icon: 'medical', allocated: totals.ambulances, total: 15, color: '#ef4444' },
    { label: 'Fumigation Trucks', icon: 'cube', allocated: totals.fumigationTrucks, total: 8, color: '#10b981' },
    { label: 'Hospital Beds', icon: 'bed', allocated: totals.hospitalBeds, total: 200, color: '#3b82f6' },
    { label: 'Medical Teams', icon: 'people', allocated: totals.medicalTeams, total: 12, color: '#8b5cf6' },
  ];

  return (
    <Surface style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="git-network" size={18} color={theme.colors.primary} />
        <Text style={styles.title}>Resource Allocation</Text>
      </View>
      <Text style={styles.subtitle}>Constrained pool distributed across {plan.allocations.length} crisis zone(s)</Text>

      {bars.map(b => {
        const reserveCount = (reserveCounts as any)[Object.keys(totals).find(k => (totals as any)[k] === b.allocated) ?? ''] ?? 0;
        const allocPct = b.total > 0 ? (b.allocated / b.total) * 100 : 0;
        const reservePct = b.total > 0 ? (reserveCount / b.total) * 100 : 0;
        return (
          <View key={b.label} style={styles.barRow}>
            <View style={styles.barHeader}>
              <View style={styles.barIcon}>
                <Ionicons name={b.icon} size={14} color={b.color} />
              </View>
              <Text style={styles.barLabel}>{b.label}</Text>
              <Text style={styles.barCount}>{b.allocated} / {b.total}</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barAllocated, { width: `${allocPct}%`, backgroundColor: b.color }]} />
              <View style={[styles.barReserve, { width: `${reservePct}%`, backgroundColor: b.color, opacity: 0.3 }]} />
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: b.color }]} /><Text style={styles.legendText}>deployed</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: b.color, opacity: 0.3 }]} /><Text style={styles.legendText}>reserve</Text></View>
            </View>
          </View>
        );
      })}

      {plan.tradeoffs && plan.tradeoffs.length > 0 && plan.tradeoffs[0] && (
        <View style={styles.tradeoff}>
          <Text style={styles.tradeoffLabel}>TRADE-OFF</Text>
          <Text style={styles.tradeoffText}>{plan.tradeoffs[0]}</Text>
        </View>
      )}
    </Surface>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    card: { padding: 14, marginHorizontal: 16, marginBottom: 16, borderRadius: 12, backgroundColor: theme.colors.surface, elevation: 1 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    title: { fontSize: 15, fontWeight: '700', color: theme.colors.onSurface },
    subtitle: { fontSize: 12, color: theme.colors.onSurfaceVariant, marginBottom: 16 },
    barRow: { marginBottom: 14 },
    barHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    barIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' },
    barLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.onSurface, flex: 1 },
    barCount: { fontSize: 12, color: theme.colors.onSurfaceVariant, fontVariant: ['tabular-nums'] },
    barTrack: { flexDirection: 'row', height: 8, backgroundColor: theme.colors.surfaceVariant, borderRadius: 4, overflow: 'hidden' },
    barAllocated: { height: '100%' },
    barReserve: { height: '100%' },
    legendRow: { flexDirection: 'row', gap: 14, marginTop: 4 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 10, color: theme.colors.onSurfaceVariant },
    tradeoff: { marginTop: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.outline },
    tradeoffLabel: { fontSize: 9, fontWeight: '700', color: theme.colors.onSurfaceVariant, letterSpacing: 1, marginBottom: 4 },
    tradeoffText: { fontSize: 12, color: theme.colors.onSurface, fontStyle: 'italic', lineHeight: 17 },
  });
}
