import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import {
  Canvas,
  Circle,
  Path,
  Skia,
  LinearGradient,
  vec,
  Group,
  BlurMask,
  Mask,
  Rect,
} from '@shopify/react-native-skia';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { AntigravityTrace } from '../lib/types';

const SIZE = 220;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;
const CX = SIZE / 2;
const CY = SIZE / 2;

function severityColors(score: number): [string, string, string] {
  if (score >= 75) return ['#FF1744', '#FF6659', '#FFB199']; // CRITICAL red-orange
  if (score >= 50) return ['#FF8A00', '#FFB54D', '#FFE3B2']; // HIGH orange
  if (score >= 25) return ['#FFD600', '#FFEB7A', '#FFF7C2']; // MODERATE yellow
  return ['#00E676', '#7FFFB0', '#C2FFD9']; // LOW green
}

function severityName(score: number): string {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MODERATE';
  return 'LOW';
}

/**
 * Holographic DRI gauge with Skia.
 * Renders a glowing arc, holographic shine sweep, and animated center score.
 * Reads latest severity_mind assessment from antigravity traces.
 */
export function HoloDRIGauge() {
  const theme = useTheme();
  const traces = useCrisisStore((s: any) => s.antigravityTraces) as AntigravityTrace[];
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const data = useMemo(() => {
    const t = [...traces].reverse().find(tr => tr.agent === 'severity_mind' && tr.output);
    const a = t?.output?.assessments?.[0];
    if (!a) return null;
    return {
      score: a.dri.score,
      protocol: a.dri.protocol,
      uncertaintyPct: a.uncertaintyPct ?? 10,
    };
  }, [traces]);

  const score = data?.score ?? 0;
  const startAngle = -225;
  const sweepAngle = (score / 100) * 270;

  const arcPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addArc({ x: CX - RADIUS, y: CY - RADIUS, width: RADIUS * 2, height: RADIUS * 2 }, startAngle, sweepAngle);
    return path;
  }, [score]);

  const fullArcPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addArc({ x: CX - RADIUS, y: CY - RADIUS, width: RADIUS * 2, height: RADIUS * 2 }, startAngle, 270);
    return p;
  }, []);

  if (!data) return null;

  const [primary, secondary, tertiary] = severityColors(data.score);

  return (
    <Surface style={styles.card}>
      <View style={styles.canvasWrap}>
        <Canvas style={{ width: SIZE, height: SIZE }}>
          {/* Background arc track */}
          <Path
            path={fullArcPath}
            color={theme.colors.outline}
            style="stroke"
            strokeWidth={STROKE}
            strokeCap="round"
          />
          {/* Glow under main arc */}
          <Group>
            <Path
              path={arcPath}
              style="stroke"
              strokeWidth={STROKE + 8}
              strokeCap="round"
            >
              <LinearGradient start={vec(0, 0)} end={vec(SIZE, SIZE)} colors={[primary, secondary]} />
              <BlurMask blur={14} style="solid" />
            </Path>
          </Group>
          {/* Main gradient arc */}
          <Path
            path={arcPath}
            style="stroke"
            strokeWidth={STROKE}
            strokeCap="round"
          >
            <LinearGradient start={vec(0, 0)} end={vec(SIZE, SIZE)} colors={[primary, secondary, tertiary]} />
          </Path>
          {/* Inner ring accent */}
          <Circle cx={CX} cy={CY} r={RADIUS - STROKE} style="stroke" strokeWidth={1} color={theme.colors.outline} opacity={0.3} />
          {/* Center dot */}
          <Circle cx={CX} cy={CY} r={4} color={primary} />
        </Canvas>
        <View pointerEvents="none" style={styles.centerLabel}>
          <Text style={[styles.score, { color: primary }]}>{Math.round(data.score)}</Text>
          <Text style={styles.scoreUnit}>/ 100 DRI</Text>
          <View style={[styles.severityBadge, { backgroundColor: primary }]}>
            <Text style={styles.severityText}>{severityName(data.score)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.footerRow}>
        <Text style={styles.footerLabel}>UNCERTAINTY</Text>
        <Text style={styles.footerValue}>±{data.uncertaintyPct.toFixed(0)}%</Text>
        <Text style={styles.footerLabel}>PROTOCOL</Text>
        <Text style={[styles.footerValue, { color: primary }]}>{data.protocol}</Text>
      </View>
    </Surface>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    card: { padding: 16, marginHorizontal: 12, marginVertical: 6, borderRadius: 18, backgroundColor: theme.colors.surface, alignItems: 'center', elevation: 4 },
    canvasWrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
    centerLabel: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
    score: { fontSize: 64, fontFamily: 'Sora_800ExtraBold', letterSpacing: -3, lineHeight: 70 },
    scoreUnit: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: theme.colors.onSurfaceVariant, marginTop: -4 },
    severityBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginTop: 8 },
    severityText: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', color: '#0B0F17', letterSpacing: 1.5 },
    footerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.colors.outline, alignSelf: 'stretch', justifyContent: 'space-evenly' },
    footerLabel: { fontSize: 9, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1.2, color: theme.colors.onSurfaceVariant },
    footerValue: { fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: theme.colors.onSurface, fontVariant: ['tabular-nums'] },
  });
}
