import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MotiView } from 'moti';
import { Broadcast, Pulse } from 'phosphor-react-native';
import { AuroraBackground } from './AuroraBackground';
import { useCrisisStore } from '../hooks/useCrisisStore';

const PROVINCE_COUNT = 5;
const CITY_COUNT = 11;
const DISTRICT_COUNT = 22;

export function HeroIntelCard() {
  const currentLocation = useCrisisStore((s: any) => s.currentLocation);
  const isAnalyzing = useCrisisStore((s: any) => s.isAnalyzing);
  const extendedHealth = useCrisisStore((s: any) => s.extendedSourceHealth);

  const liveSources = extendedHealth
    ? Object.entries(extendedHealth).filter(([k, v]) => k !== 'lastChecked' && v === 'live').length
    : 0;

  return (
    <View style={styles.card}>
      <AuroraBackground intensity="normal" colors={['#007AFF', '#5A4FFF', '#00E676'] as const} />
      <View style={styles.overlay}>
        <View style={styles.headerRow}>
          <View style={styles.badge}>
            <MotiView
              from={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 900, loop: true }}
              style={styles.liveDot}
            />
            <Text style={styles.badgeText}>{isAnalyzing ? 'ANALYZING' : 'STANDBY'}</Text>
          </View>
          <View style={styles.sourceBadge}>
            <Broadcast size={11} color="#fff" weight="duotone" />
            <Text style={styles.sourceText}>{liveSources}/6 LIVE</Text>
          </View>
        </View>

        <Text style={styles.title}>DengueSat</Text>
        <Text style={styles.subtitle}>Pakistan Crisis Intelligence Orchestrator</Text>

        {currentLocation ? (
          <View style={styles.locationRow}>
            <Pulse size={14} color="#5BA8FF" weight="fill" />
            <Text style={styles.location}>
              {currentLocation.district.name}, {currentLocation.city.name}
            </Text>
          </View>
        ) : (
          <Text style={styles.locationPrompt}>
            {PROVINCE_COUNT} provinces · {CITY_COUNT} cities · {DISTRICT_COUNT} districts ready
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 160,
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: 'rgba(91, 168, 255, 0.18)',
  },
  overlay: { padding: 18, zIndex: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(0, 230, 118, 0.18)', borderWidth: 1, borderColor: 'rgba(0, 230, 118, 0.4)' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00E676' },
  badgeText: { color: '#7FFFB0', fontSize: 9, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1.2 },
  sourceBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' },
  sourceText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 },
  title: { fontSize: 36, fontFamily: 'Sora_800ExtraBold', color: '#fff', letterSpacing: -1.2 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#A0AEC0', marginBottom: 14 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  location: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#D1E9FF' },
  locationPrompt: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#7A8CA0' },
});
