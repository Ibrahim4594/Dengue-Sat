import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { AntigravityTrace } from '../lib/types';

const WIDTH = 320;
const HEIGHT = 120;
const PAD = 18;

function extractConfidence(t: AntigravityTrace): number | null {
  const out = t.output;
  if (!out) return null;
  if (typeof out.confidence === 'number') return out.confidence;
  if (Array.isArray(out.crises) && out.crises[0]?.confidence != null) return out.crises[0].confidence;
  if (Array.isArray(out.assessments) && out.assessments[0]?.dri?.score != null) {
    // DRI scaled to confidence-equivalent (heuristic display)
    return Math.min(100, out.assessments[0].dri.score);
  }
  return null;
}

export function ConfidenceTrajectory() {
  const theme = useTheme();
  const traces = useCrisisStore((s: any) => s.antigravityTraces) as AntigravityTrace[];
  const styles = makeStyles(theme);

  const points = useMemo(() => {
    const ordered = traces
      .map(t => ({ trace: t, conf: extractConfidence(t) }))
      .filter(x => x.conf != null) as { trace: AntigravityTrace; conf: number }[];
    return ordered.map((x, i) => ({
      x: i,
      y: x.conf,
      agent: x.trace.agent ?? x.trace.type,
      label: x.trace.agent?.replace(/_/g, ' ').toUpperCase() ?? 'event',
    }));
  }, [traces]);

  if (points.length < 2) return null;

  const xStep = (WIDTH - PAD * 2) / Math.max(points.length - 1, 1);
  const path = points
    .map((p, i) => {
      const cx = PAD + i * xStep;
      const cy = HEIGHT - PAD - (p.y / 100) * (HEIGHT - PAD * 2);
      return `${i === 0 ? 'M' : 'L'}${cx.toFixed(1)},${cy.toFixed(1)}`;
    })
    .join(' ');

  const min = Math.min(...points.map(p => p.y));
  const max = Math.max(...points.map(p => p.y));
  const final = points[points.length - 1].y;

  return (
    <Surface style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="trending-up" size={16} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>CONFIDENCE TRAJECTORY</Text>
          <Text style={styles.title}>How certainty evolved across {points.length} agentic steps</Text>
        </View>
        <View style={styles.finalBadge}>
          <Text style={styles.finalText}>{final.toFixed(0)}%</Text>
        </View>
      </View>

      <Svg width={WIDTH} height={HEIGHT} style={styles.svg}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => {
          const y = HEIGHT - PAD - (v / 100) * (HEIGHT - PAD * 2);
          return (
            <React.Fragment key={v}>
              <Line x1={PAD} y1={y} x2={WIDTH - PAD} y2={y} stroke={theme.colors.outline} strokeWidth={0.5} strokeDasharray="3,3" opacity={0.4} />
              <SvgText x={PAD - 6} y={y + 3} fontSize={8} fill={theme.colors.onSurfaceVariant} textAnchor="end">
                {v}
              </SvgText>
            </React.Fragment>
          );
        })}
        {/* Path */}
        <Path d={path} fill="none" stroke={theme.colors.primary} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {/* Points */}
        {points.map((p, i) => {
          const cx = PAD + i * xStep;
          const cy = HEIGHT - PAD - (p.y / 100) * (HEIGHT - PAD * 2);
          return (
            <Circle
              key={i}
              cx={cx}
              cy={cy}
              r={3.5}
              fill={theme.colors.primary}
              stroke={theme.colors.surface}
              strokeWidth={1.5}
            />
          );
        })}
      </Svg>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{min.toFixed(0)}%</Text>
          <Text style={styles.statLabel}>min</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{max.toFixed(0)}%</Text>
          <Text style={styles.statLabel}>peak</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>{final.toFixed(0)}%</Text>
          <Text style={styles.statLabel}>final</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>±{(max - min).toFixed(0)}%</Text>
          <Text style={styles.statLabel}>swing</Text>
        </View>
      </View>
    </Surface>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    card: { padding: 14, marginHorizontal: 12, marginVertical: 6, borderRadius: 14, backgroundColor: theme.colors.surface, elevation: 1 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    iconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: theme.colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1.5, color: theme.colors.primary },
    title: { fontSize: 12, fontFamily: 'Inter_500Medium', color: theme.colors.onSurfaceVariant, marginTop: 1 },
    finalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: theme.colors.primaryContainer },
    finalText: { fontSize: 13, fontFamily: 'Inter_800ExtraBold', color: theme.colors.primary, fontVariant: ['tabular-nums'] },
    svg: { alignSelf: 'center', marginBottom: 8 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: theme.colors.outline, paddingTop: 10 },
    stat: { alignItems: 'center' },
    statValue: { fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: theme.colors.onSurface, fontVariant: ['tabular-nums'] },
    statLabel: { fontSize: 9, color: theme.colors.onSurfaceVariant, marginTop: 2, letterSpacing: 0.5 },
  });
}
