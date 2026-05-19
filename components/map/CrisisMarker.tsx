import React, { memo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { Marker, Callout } from 'react-native-maps';

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: '#FF5C75',
  HIGH: '#FF8A00',
  MODERATE: '#FFD600',
  LOW: '#00E676',
};

interface Props {
  latitude: number;
  longitude: number;
  severity: string;
  driScore: number;
  district: string;
  populationAtRisk: number;
  reasoning?: string;
}

function CrisisMarkerInner({ latitude, longitude, severity, driScore, district, populationAtRisk, reasoning }: Props) {
  const color = SEVERITY_COLOR[severity] ?? SEVERITY_COLOR.MODERATE;
  const isCritical = severity === 'CRITICAL' || severity === 'HIGH';
  // tracksViewChanges: true while pulse animation runs (critical only) or initially, false otherwise.
  const [tracksView, setTracksView] = useState(true);
  React.useEffect(() => {
    if (!isCritical) {
      const t = setTimeout(() => setTracksView(false), 600);
      return () => clearTimeout(t);
    }
  }, [isCritical]);

  return (
    <Marker coordinate={{ latitude, longitude }} tracksViewChanges={tracksView} anchor={{ x: 0.5, y: 0.5 }}>
      <View style={styles.wrap}>
        {isCritical && (
          <MotiView
            from={{ opacity: 0.55, scale: 0.6 }}
            animate={{ opacity: 0, scale: 2.4 }}
            transition={{ type: 'timing', duration: 1500, loop: true, repeatReverse: false, easing: Easing.out(Easing.quad) }}
            style={[styles.pulse, { backgroundColor: color }]}
          />
        )}
        <View style={[styles.outer, { borderColor: color, shadowColor: color }]}>
          <View style={[styles.inner, { backgroundColor: color }]}>
            <Text style={styles.score}>{Math.round(driScore)}</Text>
          </View>
        </View>
      </View>
      <Callout tooltip>
        <View style={styles.callout}>
          <View style={[styles.calloutBadge, { backgroundColor: color }]}>
            <Text style={styles.calloutSev}>{severity}</Text>
          </View>
          <Text style={styles.calloutTitle}>{district}</Text>
          <View style={styles.calloutRow}>
            <Text style={styles.calloutLabel}>DRI</Text>
            <Text style={[styles.calloutValue, { color }]}>{Math.round(driScore)}</Text>
          </View>
          <View style={styles.calloutRow}>
            <Text style={styles.calloutLabel}>Population</Text>
            <Text style={styles.calloutValue}>{populationAtRisk.toLocaleString()}</Text>
          </View>
          {reasoning ? <Text style={styles.calloutReason} numberOfLines={3}>{reasoning}</Text> : null}
        </View>
      </Callout>
    </Marker>
  );
}

export const CrisisMarker = memo(CrisisMarkerInner);

const styles = StyleSheet.create({
  wrap: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 30, height: 30, borderRadius: 15 },
  outer: { width: 38, height: 38, borderRadius: 19, borderWidth: 2.5, backgroundColor: 'rgba(11,15,23,0.85)', alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 6 },
  inner: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  score: { color: '#0B0F17', fontSize: 11, fontFamily: 'Sora_800ExtraBold' },
  callout: { backgroundColor: '#0B0F17', borderColor: '#232D3F', borderWidth: 1, borderRadius: 14, padding: 14, minWidth: 200, maxWidth: 260 },
  calloutBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginBottom: 8 },
  calloutSev: { color: '#0B0F17', fontSize: 9, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1 },
  calloutTitle: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Sora_800ExtraBold', marginBottom: 8 },
  calloutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  calloutLabel: { color: '#7A8BA6', fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  calloutValue: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Inter_700Bold' },
  calloutReason: { color: '#A0AEC0', fontSize: 11, lineHeight: 16, marginTop: 8, fontStyle: 'italic' },
});
