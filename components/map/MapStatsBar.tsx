import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MotiView } from 'moti';
import { MapPin, Warning, Hospital, Pulse } from 'phosphor-react-native';

interface Props {
  city: string;
  district: string;
  crisisCount: number;
  hospitalCount: number;
  isDark: boolean;
}

export function MapStatsBar({ city, district, crisisCount, hospitalCount, isDark }: Props) {
  const bg = isDark ? 'rgba(11,15,23,0.92)' : 'rgba(255,255,255,0.96)';
  const border = isDark ? '#232D3F' : '#DCE3EE';
  const fg = isDark ? '#FFFFFF' : '#1A2536';
  const muted = isDark ? '#7A8BA6' : '#5A6B85';
  const accent = '#107BFF';

  return (
    <MotiView
      from={{ opacity: 0, translateY: -10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      style={[styles.wrap, { backgroundColor: bg, borderColor: border }]}
    >
      <View style={styles.locRow}>
        <MapPin size={14} color={accent} weight="fill" />
        <Text style={[styles.locText, { color: fg }]}>{district}</Text>
        <Text style={[styles.locSep, { color: muted }]}>·</Text>
        <Text style={[styles.locCity, { color: muted }]}>{city}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Warning size={12} color={crisisCount > 0 ? '#FF5C75' : muted} weight="fill" />
          <Text style={[styles.statValue, { color: fg }]}>{crisisCount}</Text>
          <Text style={[styles.statLabel, { color: muted }]}>CRISES</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: border }]} />
        <View style={styles.statItem}>
          <Hospital size={12} color={accent} weight="fill" />
          <Text style={[styles.statValue, { color: fg }]}>{hospitalCount}</Text>
          <Text style={[styles.statLabel, { color: muted }]}>HOSP</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: border }]} />
        <View style={styles.statItem}>
          <Pulse size={12} color="#00E676" weight="fill" />
          <Text style={[styles.statValue, { color: '#00E676' }]}>LIVE</Text>
          <Text style={[styles.statLabel, { color: muted }]}>FEED</Text>
        </View>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 14, left: 70, right: 70, borderRadius: 16, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 14, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locText: { fontSize: 13, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.2 },
  locSep: { fontSize: 13 },
  locCity: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1, marginVertical: 8, opacity: 0 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  statDivider: { width: 1, height: 14 },
  statValue: { fontSize: 13, fontFamily: 'Sora_800ExtraBold' },
  statLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, marginLeft: 2 },
});
