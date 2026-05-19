import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useCrisisStore } from '../hooks/useCrisisStore';

const RESOURCE_META = [
  { key: 'ambulances', label: 'Ambulances', icon: 'medical', total: 15 },
  { key: 'fumigationTrucks', label: 'Fumigation Trucks', icon: 'cube', total: 8 },
  { key: 'hospitalBeds', label: 'Hospital Beds', icon: 'bed', total: 200 },
  { key: 'medicalTeams', label: 'Medical Teams', icon: 'people', total: 12 },
];

/**
 * Numeric multi-crisis tradeoff table.
 * Shows each resource pool split across active crises with explicit numbers.
 * Reveals only when 2+ crises detected — otherwise hides cleanly.
 */
export function TradeoffTable() {
  const theme = useTheme();
  const plan = useCrisisStore((s: any) => s.resourcePlan);
  const crises = useCrisisStore((s: any) => s.activeCrises) ?? [];
  const styles = makeStyles(theme);

  if (!plan?.allocations || plan.allocations.length < 1) return null;

  const reserve = plan.reserve ?? {};
  const reserveVal = {
    ambulances: reserve.ambulances?.available ?? 0,
    fumigationTrucks: reserve.fumigationTrucks?.available ?? 0,
    hospitalBeds: reserve.hospitalBeds?.available ?? 0,
    medicalTeams: reserve.medicalTeams?.available ?? 0,
  };

  // Map crisisId → label
  const labelFor = (crisisId: string) => {
    const c = crises.find((c: any) => c.id === crisisId);
    return c ? `${c.location?.district ?? 'Zone'} (${c.type?.replace(/_/g, ' ').toLowerCase() ?? 'crisis'})` : crisisId;
  };

  return (
    <Surface style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="git-compare" size={16} color={theme.colors.tertiary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>RESOURCE TRADEOFF</Text>
          <Text style={styles.title}>
            {plan.allocations.length === 1
              ? 'Single-zone allocation'
              : `${plan.allocations.length}-way crisis split`}
          </Text>
        </View>
      </View>

      {/* Header row */}
      <View style={styles.tableRow}>
        <Text style={[styles.cell, styles.cellResource]}>RESOURCE</Text>
        {plan.allocations.map((alloc: any, i: number) => (
          <Text key={alloc.crisisId} style={[styles.cell, styles.cellHeader]} numberOfLines={1}>
            {labelFor(alloc.crisisId).split(' ')[0]}
          </Text>
        ))}
        <Text style={[styles.cell, styles.cellHeader, { color: theme.colors.onSurfaceVariant }]}>RES</Text>
        <Text style={[styles.cell, styles.cellHeader]}>TOTAL</Text>
      </View>

      {/* Data rows */}
      {RESOURCE_META.map((r, idx) => {
        const allocated = plan.allocations.reduce((s: number, a: any) => s + (a[r.key] ?? 0), 0);
        const reserveCount = (reserveVal as any)[r.key] ?? 0;
        return (
          <MotiView
            key={r.key}
            from={{ opacity: 0, translateX: -8 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 200, delay: idx * 60 }}
            style={styles.tableRow}
          >
            <View style={[styles.cell, styles.cellResource, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
              <Ionicons name={r.icon as any} size={11} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.cellText}>{r.label}</Text>
            </View>
            {plan.allocations.map((alloc: any) => (
              <View key={alloc.crisisId} style={styles.cell}>
                <Text style={styles.cellNumber}>{alloc[r.key] ?? 0}</Text>
              </View>
            ))}
            <View style={styles.cell}>
              <Text style={[styles.cellNumber, { color: theme.colors.onSurfaceVariant }]}>{reserveCount}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={[styles.cellNumber, { color: theme.colors.primary }]}>{r.total}</Text>
            </View>
          </MotiView>
        );
      })}

      {plan.tradeoffs && plan.tradeoffs[0] && (
        <View style={styles.narrative}>
          <Text style={styles.narrativeLabel}>TRADEOFF NARRATIVE</Text>
          <Text style={styles.narrativeText}>{plan.tradeoffs[0]}</Text>
        </View>
      )}
    </Surface>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    card: { padding: 14, marginHorizontal: 16, marginBottom: 16, borderRadius: 12, backgroundColor: theme.colors.surface, elevation: 1 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    iconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: theme.colors.tertiaryContainer, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1.5, color: theme.colors.tertiary },
    title: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: theme.colors.onSurface, marginTop: 1 },
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.outline },
    cell: { flex: 1, alignItems: 'center' },
    cellResource: { flex: 2, alignItems: 'flex-start' },
    cellHeader: { fontSize: 9, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.5, color: theme.colors.onSurface, textTransform: 'uppercase' },
    cellText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: theme.colors.onSurface },
    cellNumber: { fontSize: 14, fontFamily: 'Inter_700Bold', color: theme.colors.onSurface, fontVariant: ['tabular-nums'] },
    narrative: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.outline },
    narrativeLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1, color: theme.colors.onSurfaceVariant, marginBottom: 4 },
    narrativeText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: theme.colors.onSurface, lineHeight: 17, fontStyle: 'italic' },
  });
}
