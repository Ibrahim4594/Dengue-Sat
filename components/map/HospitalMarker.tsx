import React, { memo, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Marker, Callout } from 'react-native-maps';
import { Hospital } from 'phosphor-react-native';

interface Props {
  latitude: number;
  longitude: number;
  name: string;
  beds?: number;
  admissions?: number;
  platelets?: number;
}

function HospitalMarkerInner({ latitude, longitude, name, beds, admissions, platelets }: Props) {
  const [tracksView, setTracksView] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setTracksView(false), 600);
    return () => clearTimeout(t);
  }, []);
  // Stress color: red if admissions > 30, orange > 15, default blue.
  const stress = (admissions ?? 0) > 30 ? '#FF5C75' : (admissions ?? 0) > 15 ? '#FF8A00' : '#7AB6FF';

  return (
    <Marker coordinate={{ latitude, longitude }} tracksViewChanges={tracksView} anchor={{ x: 0.5, y: 0.5 }}>
      <View style={[styles.pin, { borderColor: stress }]}>
        <Hospital size={14} color={stress} weight="bold" />
      </View>
      <Callout tooltip>
        <View style={styles.callout}>
          <Text style={styles.title} numberOfLines={1}>{name}</Text>
          <View style={styles.row}>
            <View style={styles.stat}>
              <Text style={styles.label}>BEDS</Text>
              <Text style={styles.value}>{beds ?? '—'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.label}>ADMITS·24H</Text>
              <Text style={[styles.value, { color: stress }]}>{admissions ?? 0}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.label}>PLATELETS</Text>
              <Text style={styles.value}>{platelets ?? '—'}</Text>
            </View>
          </View>
        </View>
      </Callout>
    </Marker>
  );
}

export const HospitalMarker = memo(HospitalMarkerInner);

const styles = StyleSheet.create({
  pin: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, backgroundColor: 'rgba(11,15,23,0.92)', alignItems: 'center', justifyContent: 'center' },
  callout: { backgroundColor: '#0B0F17', borderColor: '#232D3F', borderWidth: 1, borderRadius: 12, padding: 12, minWidth: 220 },
  title: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Sora_800ExtraBold', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'stretch' },
  stat: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  divider: { width: 1, backgroundColor: '#232D3F', marginHorizontal: 6 },
  label: { color: '#7A8BA6', fontSize: 8, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, marginBottom: 2 },
  value: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Sora_800ExtraBold' },
});
