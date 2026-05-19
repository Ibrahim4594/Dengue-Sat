import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { CurrencyDollar, Lightning, PhoneOutgoing } from 'phosphor-react-native';
import { useCrisisStore } from '../hooks/useCrisisStore';

function useAnimatedNumber(value: number) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const anim = useRef(new Animated.Value(value)).current;

  useEffect(() => {
    if (value === prev.current) return;
    const startVal = prev.current;
    prev.current = value;
    anim.setValue(startVal);
    Animated.timing(anim, { toValue: value, duration: 400, useNativeDriver: false }).start();
    const listener = anim.addListener(({ value: v }) => setDisplay(v));
    return () => anim.removeListener(listener);
  }, [value]);

  return display;
}

export function CostDashboard() {
  const theme = useTheme();
  const cost = useCrisisStore((s: any) => s.cost);
  const isAnalyzing = useCrisisStore((s: any) => s.isAnalyzing);
  const styles = makeStyles(theme);

  const totalUSD = cost?.totalUSD ?? 0;
  const totalTokens = cost?.totalTokens ?? 0;
  const callCount = cost?.callCount ?? 0;
  const perAgentUSD = cost?.perAgentUSD ?? {};

  const animUSD = useAnimatedNumber(totalUSD);
  const animTokens = useAnimatedNumber(totalTokens);
  const animCalls = useAnimatedNumber(callCount);

  const topAgents = Object.entries(perAgentUSD)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 3);

  return (
    <Surface style={styles.surface}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>LIVE COST</Text>
        {isAnalyzing && (
          <View style={styles.liveTag}>
            <View style={[styles.liveDot, { backgroundColor: theme.colors.primary }]} />
            <Text style={[styles.liveTagText, { color: theme.colors.primary }]}>STREAMING</Text>
          </View>
        )}
      </View>
      <View style={styles.row}>
        <View style={styles.cell}>
          <CurrencyDollar size={16} color={theme.colors.primary} weight="duotone" style={{ marginBottom: 2 }} />
          <Text style={styles.bigNum}>${animUSD.toFixed(4)}</Text>
          <Text style={styles.cellLabel}>spent</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.cell}>
          <Lightning size={16} color={theme.colors.primary} weight="duotone" style={{ marginBottom: 2 }} />
          <Text style={styles.bigNum}>{Math.round(animTokens).toLocaleString()}</Text>
          <Text style={styles.cellLabel}>tokens</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.cell}>
          <PhoneOutgoing size={16} color={theme.colors.primary} weight="duotone" style={{ marginBottom: 2 }} />
          <Text style={styles.bigNum}>{Math.round(animCalls)}</Text>
          <Text style={styles.cellLabel}>API calls</Text>
        </View>
      </View>
      {topAgents.length > 0 && (
        <View style={styles.breakdown}>
          <Text style={styles.breakdownLabel}>TOP AGENTS BY COST</Text>
          {topAgents.map(([agent, usd]) => (
            <View key={agent} style={styles.breakdownRow}>
              <Text style={styles.breakdownAgent} numberOfLines={1}>{agent}</Text>
              <View style={styles.bar}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.min(100, ((usd as number) / Math.max(totalUSD, 0.0001)) * 100)}%`,
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.breakdownCost}>${(usd as number).toFixed(5)}</Text>
            </View>
          ))}
        </View>
      )}
    </Surface>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    surface: { padding: 16, marginHorizontal: 12, marginVertical: 8, borderRadius: 16, backgroundColor: theme.colors.surface, elevation: 4, borderTopWidth: 1, borderTopColor: theme.colors.outline },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    label: { fontSize: 12, fontWeight: '800', color: theme.colors.onSurface, letterSpacing: 1.2 },
    liveTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: theme.colors.primaryContainer },
    liveDot: { width: 8, height: 8, borderRadius: 4 },
    liveTagText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
    divider: { width: 1, height: 44, backgroundColor: theme.colors.outline, opacity: 0.6 },
    cell: { flex: 1, alignItems: 'center' },
    bigNum: { fontSize: 22, fontWeight: '900', color: theme.colors.primary, fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
    cellLabel: { fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    breakdown: { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.colors.outline },
    breakdownLabel: { fontSize: 11, fontWeight: '800', color: theme.colors.onSurface, letterSpacing: 1, marginBottom: 12 },
    breakdownRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
    breakdownAgent: { fontSize: 12, color: theme.colors.onSurface, width: 120, fontFamily: 'monospace', fontWeight: '500' },
    bar: { flex: 1, height: 6, backgroundColor: theme.colors.surfaceVariant, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 3 },
    breakdownCost: { fontSize: 11, color: theme.colors.onSurface, width: 70, textAlign: 'right', fontVariant: ['tabular-nums'], fontWeight: '600' },
  });
}
