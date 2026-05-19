import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MotiView } from 'moti';

interface Props {
  crisisCount: number;
  hospitalCount: number;
}

export function MapLegend({ crisisCount, hospitalCount }: Props) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: -8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={styles.wrap}
    >
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: '#FF5C75' }]} />
        <Text style={styles.label}>CRITICAL</Text>
      </View>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: '#FF8A00' }]} />
        <Text style={styles.label}>HIGH</Text>
      </View>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: '#FFD600' }]} />
        <Text style={styles.label}>MODERATE</Text>
      </View>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: '#00E676' }]} />
        <Text style={styles.label}>LOW</Text>
      </View>
      <View style={styles.divider} />
      <Text style={styles.count}>{crisisCount} crises · {hospitalCount} hospitals</Text>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 20, left: 14, backgroundColor: 'rgba(11,15,23,0.92)', borderColor: '#232D3F', borderWidth: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, gap: 6, minWidth: 130 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { color: '#FFFFFF', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 },
  divider: { height: 1, backgroundColor: '#232D3F', marginVertical: 4 },
  count: { color: '#7A8BA6', fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.4 },
});
