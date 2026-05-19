import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const ROWS = [
  { metric: 'Response Time', icon: 'time-outline', pitb: '7 days', us: '7 minutes', delta: '1440× faster' },
  { metric: 'Detection Mode', icon: 'eye-outline', pitb: 'Reactive', us: 'Proactive (satellite signal)', delta: 'pre-symptom' },
  { metric: 'Data Sources', icon: 'layers-outline', pitb: '1 (field reports)', us: '6 fused streams', delta: '6× breadth' },
  { metric: 'AI Reasoning', icon: 'sparkles-outline', pitb: 'None', us: 'Claude Sonnet 4.6 + thinking', delta: 'autonomous' },
  { metric: 'Coverage', icon: 'globe-outline', pitb: 'Punjab only', us: 'All 4 provinces + ICT', delta: 'nationwide' },
  { metric: 'Language', icon: 'language-outline', pitb: 'English UI', us: 'Urdu + English w/ voice', delta: 'bilingual TTS' },
  { metric: 'Stakeholder Coord', icon: 'people-outline', pitb: 'Manual phone calls', us: '5 auto-generated msg types', delta: 'instant' },
  { metric: 'False Positive Handling', icon: 'shield-checkmark-outline', pitb: 'Manual review', us: 'Auto reclassify + retract', delta: 'self-correcting' },
];

export function PITBCompare() {
  const theme = useTheme();
  const styles = makeStyles(theme);

  return (
    <Surface style={styles.surface}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>vs PITB Dengue Surveillance</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>1440× FASTER</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>Pakistan's most advanced existing system. We close every gap.</Text>

      {ROWS.map((r, i) => (
        <View key={r.metric} style={styles.row}>
          <View style={styles.metricCol}>
            <Ionicons name={r.icon as any} size={14} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.metricName}>{r.metric}</Text>
          </View>
          <View style={styles.valuesCol}>
            <View style={styles.pitbBox}>
              <Text style={styles.pitbLabel}>PITB</Text>
              <Text style={styles.pitbText} numberOfLines={2}>{r.pitb}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
            <View style={styles.usBox}>
              <Text style={styles.usLabel}>DengueSat</Text>
              <Text style={styles.usText} numberOfLines={2}>{r.us}</Text>
              <Text style={styles.delta}>{r.delta}</Text>
            </View>
          </View>
        </View>
      ))}

      <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={12} color={theme.colors.onSurfaceVariant} />
        <Text style={styles.footerText}>PITB DATS data per PITB.gov.pk (2025). Comparison based on documented response times.</Text>
      </View>
    </Surface>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    surface: { padding: 14, marginHorizontal: 12, marginVertical: 8, borderRadius: 12, backgroundColor: theme.colors.surface, elevation: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    title: { fontSize: 16, fontWeight: '700', color: theme.colors.onSurface, flex: 1 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: theme.colors.primaryContainer },
    badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: theme.colors.onPrimaryContainer },
    subtitle: { fontSize: 12, color: theme.colors.onSurfaceVariant, marginBottom: 14 },
    row: { marginBottom: 10 },
    metricCol: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    metricName: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: theme.colors.onSurfaceVariant, textTransform: 'uppercase' },
    valuesCol: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
    pitbBox: { flex: 1, padding: 8, borderRadius: 8, backgroundColor: theme.colors.surfaceVariant, opacity: 0.7 },
    pitbLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, color: theme.colors.onSurfaceVariant, marginBottom: 2 },
    pitbText: { fontSize: 12, color: theme.colors.onSurface, textDecorationLine: 'line-through' },
    usBox: { flex: 1.4, padding: 8, borderRadius: 8, backgroundColor: theme.colors.primaryContainer },
    usLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, color: theme.colors.primary, marginBottom: 2 },
    usText: { fontSize: 12, color: theme.colors.onPrimaryContainer, fontWeight: '600' },
    delta: { fontSize: 10, color: theme.colors.primary, fontStyle: 'italic', marginTop: 2 },
    footer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.outline },
    footerText: { fontSize: 10, color: theme.colors.onSurfaceVariant, flex: 1 },
  });
}
