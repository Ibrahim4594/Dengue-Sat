import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Broadcast, Pulse } from 'phosphor-react-native';
import { useCrisisStore } from '../hooks/useCrisisStore';

function useAnimatedNumber(target: number, durationMs = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = Date.now();
    const from = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return n;
}

// Tuned for AAA contrast (≥7:1) on #0B0F17 background.
const EMPTY_CRISES: any[] = [];

const SEVERITY_COLOR: Record<string, string> = {
  LOW: '#00E676',
  MODERATE: '#FFD600',
  HIGH: '#FF8A00',
  CRITICAL: '#FF5C75',
};

export function HeroDRICard() {
  const finalSummary = useCrisisStore((s: any) => s.finalSummary);
  const activeCrises = useCrisisStore((s: any) => s.activeCrises) ?? EMPTY_CRISES;

  // Derive score: prefer real DRI from activeCrises, else map severity → indicative score.
  const SEV_TO_SCORE: Record<string, number> = { LOW: 12, MODERATE: 42, HIGH: 68, CRITICAL: 88 };
  const rawScore = activeCrises[0]?.dri?.score;
  const fallbackScore = SEV_TO_SCORE[finalSummary?.headlineSeverity ?? ''] ?? 0;
  const targetScore = Math.round(rawScore && rawScore > 0 ? rawScore : fallbackScore);
  const score = useAnimatedNumber(targetScore, 1100);

  if (!finalSummary && activeCrises.length === 0) return null;

  const sev = finalSummary?.headlineSeverity ?? activeCrises[0]?.dri?.severity ?? 'MODERATE';
  const color = SEVERITY_COLOR[sev] ?? SEVERITY_COLOR.MODERATE;
  const summaryEn = finalSummary?.summaryEn ?? '';
  const summaryUr = finalSummary?.summaryUr ?? '';

  return (
    <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 22 }}>
      <Surface style={styles.card} elevation={4}>
        <LinearGradient
          colors={[color + '22', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.glowBar, { backgroundColor: color }]} />
        <View style={styles.header}>
          <Broadcast size={14} color={color} weight="duotone" />
          <Text style={[styles.label, { color }]}>THREAT LEVEL</Text>
          <View style={styles.liveDotWrap}>
            <MotiView
              from={{ opacity: 0.55, scale: 0.6 }}
              animate={{ opacity: 0, scale: 2.2 }}
              transition={{ type: 'timing', duration: 1400, loop: true, repeatReverse: false, easing: Easing.out(Easing.quad) }}
              style={[styles.liveDotPulse, { backgroundColor: color }]}
            />
            <View style={[styles.liveDot, { backgroundColor: color }]} />
          </View>
          <Text style={[styles.liveLabel, { color }]}>LIVE</Text>
          <View style={[styles.severityChip, { borderColor: color, backgroundColor: color + '15' }]}>
            <Text style={[styles.severityText, { color }]}>{sev}</Text>
          </View>
        </View>

        <View style={styles.scoreRow}>
          <Text style={[styles.score, { color }]}>{score}</Text>
          <Text style={styles.scoreUnit}>/ 100 DRI</Text>
        </View>

        {summaryEn ? (
          <>
            <Text style={styles.summaryEn}>{summaryEn}</Text>
            <Text style={styles.bilingualDot}>•</Text>
            <Text style={styles.summaryUr}>{summaryUr}</Text>
          </>
        ) : (
          <View style={styles.pulseRow}>
            <Pulse size={14} color="#A0AEC0" weight="fill" />
            <Text style={styles.pulseText}>Awaiting bilingual summary from coordinator…</Text>
          </View>
        )}
      </Surface>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, marginTop: 12, padding: 20, borderRadius: 20, backgroundColor: '#0B0F17', borderWidth: 1, borderColor: '#1A2536', overflow: 'hidden' },
  glowBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, opacity: 0.8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  label: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1.2 },
  liveDotWrap: { width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveDotPulse: { position: 'absolute', width: 6, height: 6, borderRadius: 3 },
  liveLabel: { fontSize: 9, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1.5 },
  severityChip: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  severityText: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 18 },
  score: { fontSize: 64, fontFamily: 'Sora_800ExtraBold', letterSpacing: -2, lineHeight: 70 },
  scoreUnit: { fontSize: 14, color: '#A0AEC0', fontFamily: 'Inter_600SemiBold' },
  summaryEn: { fontSize: 16, lineHeight: 22, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  bilingualDot: { fontSize: 16, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginVertical: 10 },
  summaryUr: { fontSize: 17, lineHeight: 30, color: '#FFFFFF', textAlign: 'right', writingDirection: 'rtl', letterSpacing: 0 },
  pulseRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  pulseText: { fontSize: 12, color: '#A0AEC0', fontFamily: 'Inter_400Regular' },
});
