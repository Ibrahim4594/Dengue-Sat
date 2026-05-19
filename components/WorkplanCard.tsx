import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { AntigravityTrace } from '../lib/types';

/**
 * Surfaces the Master Coordinator's initial workplan extracted from the first
 * master.iter event's thinking block. Renders compact 3-line strategic plan + key tools.
 */
export function WorkplanCard() {
  const theme = useTheme();
  const traces = useCrisisStore((s: any) => s.antigravityTraces) as AntigravityTrace[];
  const styles = makeStyles(theme);

  const workplan = useMemo(() => {
    if (!traces || traces.length === 0) return null;
    const first = traces.find(t => t.type === 'master.iter' && t.iter === 0);
    if (!first) return null;
    const thinking = first.thinking ?? '';
    const text = first.text ?? '';
    // Distill: extract first 3 sentences from thinking (or text fallback)
    const source = thinking || text;
    if (!source) return null;
    const sentences = source.split(/(?<=[.!?])\s+/).filter(s => s.length > 16).slice(0, 3);
    return {
      summary: sentences.join(' '),
      tools: first.toolCallsPlanned ?? [],
      sourceLength: source.length,
    };
  }, [traces]);

  if (!workplan) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 280 }}
    >
      <Surface style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons name="map" size={16} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>WORKPLAN</Text>
            <Text style={styles.title}>Master Coordinator Strategy</Text>
          </View>
          <View style={styles.metaBadge}>
            <Text style={styles.metaText}>{workplan.sourceLength.toLocaleString()} chars reasoned</Text>
          </View>
        </View>
        <Text style={styles.summary}>{workplan.summary}</Text>
        {workplan.tools.length > 0 && (
          <View style={styles.toolsRow}>
            <Text style={styles.toolsLabel}>NEXT DISPATCH</Text>
            <View style={styles.toolChips}>
              {workplan.tools.slice(0, 4).map((t) => (
                <View key={t} style={styles.toolChip}>
                  <Text style={styles.toolChipText}>{t}</Text>
                </View>
              ))}
              {workplan.tools.length > 4 && (
                <Text style={styles.toolMore}>+{workplan.tools.length - 4}</Text>
              )}
            </View>
          </View>
        )}
      </Surface>
    </MotiView>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    card: {
      padding: 14,
      marginHorizontal: 12,
      marginBottom: 12,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
      elevation: 1,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    iconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: theme.colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1.5, color: theme.colors.primary },
    title: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: theme.colors.onSurface, marginTop: 1 },
    metaBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: theme.colors.surfaceVariant },
    metaText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: theme.colors.onSurfaceVariant },
    summary: { fontSize: 13, fontFamily: 'Inter_400Regular', color: theme.colors.onSurface, lineHeight: 19, marginBottom: 10 },
    toolsRow: { borderTopWidth: 1, borderTopColor: theme.colors.outline, paddingTop: 10 },
    toolsLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1, color: theme.colors.onSurfaceVariant, marginBottom: 6 },
    toolChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
    toolChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: theme.colors.secondaryContainer },
    toolChipText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: theme.colors.onSecondaryContainer, fontVariant: ['tabular-nums'] },
    toolMore: { fontSize: 10, color: theme.colors.onSurfaceVariant, fontFamily: 'Inter_600SemiBold' },
  });
}
