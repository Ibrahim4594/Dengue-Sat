import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { AntigravityTrace } from '../lib/types';

const SEVERITY_BANDS = [
  { name: 'LOW', max: 25, color: '#2BB673' },
  { name: 'MODERATE', max: 50, color: '#FFD33D' },
  { name: 'HIGH', max: 75, color: '#FF8A00' },
  { name: 'CRITICAL', max: 100, color: '#E53935' },
];

interface Assessment {
  dri: { score: number; severity: string; protocol: string };
  uncertaintyPct: number;
  affectedRadiusKm: number;
  populationAtRisk: number;
  expectedDurationDays: number;
}

export function DRIConfidenceBand() {
  const theme = useTheme();
  const traces = useCrisisStore((s: any) => s.antigravityTraces) as AntigravityTrace[];
  const styles = makeStyles(theme);

  const assessment = useMemo<Assessment | null>(() => {
    if (!traces || traces.length === 0) return null;
    const severityTrace = [...traces].reverse().find(t => t.agent === 'severity_mind' && t.output);
    if (!severityTrace?.output?.assessments?.[0]) return null;
    return severityTrace.output.assessments[0] as Assessment;
  }, [traces]);

  if (!assessment) return null;

  const score = assessment.dri.score;
  const uncertainty = assessment.uncertaintyPct ?? 10;
  const lowBound = Math.max(0, score - uncertainty);
  const highBound = Math.min(100, score + uncertainty);

  const severityBand = SEVERITY_BANDS.find(b => score <= b.max) ?? SEVERITY_BANDS[3];

  return (
    <Surface style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="speedometer" size={18} color={severityBand.color} />
        <Text style={styles.title}>DRI Confidence Band</Text>
        <View style={[styles.badge, { backgroundColor: severityBand.color }]}>
          <Text style={styles.badgeText}>{severityBand.name}</Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <Text style={[styles.bigScore, { color: severityBand.color }]}>{score.toFixed(0)}</Text>
        <Text style={styles.scoreUnit}>/ 100</Text>
        <Text style={styles.uncertainty}>±{uncertainty.toFixed(0)}%</Text>
      </View>

      {/* Confidence band visualization */}
      <View style={styles.bandWrap}>
        {/* Background severity zones */}
        <View style={styles.bandBackground}>
          {SEVERITY_BANDS.map((b, i) => {
            const prevMax = i === 0 ? 0 : SEVERITY_BANDS[i - 1].max;
            const width = ((b.max - prevMax) / 100) * 100;
            return (
              <View
                key={b.name}
                style={[styles.bandSegment, { width: `${width}%`, backgroundColor: b.color, opacity: 0.2 }]}
              />
            );
          })}
        </View>
        {/* Uncertainty range */}
        <View
          style={[
            styles.uncertaintyRange,
            { left: `${lowBound}%`, width: `${highBound - lowBound}%`, backgroundColor: severityBand.color },
          ]}
        />
        {/* Point marker */}
        <View style={[styles.pointMarker, { left: `${score}%` }]}>
          <View style={[styles.pointDot, { backgroundColor: severityBand.color }]} />
        </View>
      </View>

      <View style={styles.boundsRow}>
        <Text style={styles.boundText}>low: {lowBound.toFixed(0)}</Text>
        <Text style={styles.boundText}>high: {highBound.toFixed(0)}</Text>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detail}>
          <Text style={styles.detailNum}>{assessment.affectedRadiusKm.toFixed(1)} km</Text>
          <Text style={styles.detailLabel}>radius</Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.detailNum}>{(assessment.populationAtRisk ?? 0).toLocaleString()}</Text>
          <Text style={styles.detailLabel}>at risk</Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.detailNum}>{assessment.expectedDurationDays.toFixed(0)}d</Text>
          <Text style={styles.detailLabel}>duration</Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.detailNum}>{assessment.dri.protocol}</Text>
          <Text style={styles.detailLabel}>protocol</Text>
        </View>
      </View>
    </Surface>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    card: { padding: 16, marginHorizontal: 12, marginVertical: 8, borderRadius: 16, backgroundColor: theme.colors.surface, elevation: 4, borderTopWidth: 1, borderTopColor: theme.colors.outline },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    title: { fontSize: 16, fontWeight: '800', color: theme.colors.onSurface, flex: 1, letterSpacing: 0.5 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    badgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, color: '#000' }, // Dark text on bright badge
    scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
    bigScore: { fontSize: 52, fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: -2 },
    scoreUnit: { fontSize: 16, color: theme.colors.onSurfaceVariant, fontWeight: '700' },
    uncertainty: { fontSize: 16, color: theme.colors.primary, marginLeft: 'auto', fontWeight: '800', fontVariant: ['tabular-nums'] },
    bandWrap: { height: 32, marginVertical: 8, position: 'relative' },
    bandBackground: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', position: 'absolute', top: 9, left: 0, right: 0 },
    bandSegment: { height: '100%' },
    uncertaintyRange: { position: 'absolute', top: 9, height: 14, borderRadius: 7, opacity: 0.6 },
    pointMarker: { position: 'absolute', top: 0, transform: [{ translateX: -8 }] },
    pointDot: { width: 16, height: 32, borderRadius: 8, borderWidth: 3, borderColor: '#fff' },
    boundsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: 14 },
    boundText: { fontSize: 11, color: theme.colors.onSurfaceVariant, fontVariant: ['tabular-nums'], fontWeight: '600' },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.colors.outline },
    detail: { alignItems: 'center', flex: 1 },
    detailNum: { fontSize: 15, fontWeight: '800', color: theme.colors.primary, fontVariant: ['tabular-nums'] },
    detailLabel: { fontSize: 10, color: theme.colors.onSurfaceVariant, marginTop: 4, letterSpacing: 0.8, fontWeight: '700', textTransform: 'uppercase' },
  });
}
