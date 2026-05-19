import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MotiView } from 'moti';
import { Lightning } from 'phosphor-react-native';
import { useCrisisStore } from '../hooks/useCrisisStore';

export function ActionCard() {
  const finalSummary = useCrisisStore((s: any) => s.finalSummary);
  if (!finalSummary?.actionEn) return null;

  return (
    <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 80 }}>
      <Surface style={styles.card} elevation={3}>
        <View style={styles.header}>
          <Lightning size={14} color="#FFD600" weight="fill" />
          <Text style={styles.label}>NEXT 24 HOURS</Text>
        </View>
        <Text style={styles.actionEn}>{finalSummary.actionEn}</Text>
        <Text style={styles.bilingualDot}>•</Text>
        <Text style={styles.actionUr}>{finalSummary.actionUr}</Text>
      </Surface>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, marginTop: 12, padding: 20, borderRadius: 20, backgroundColor: '#141A26', borderLeftWidth: 3, borderLeftColor: '#FFD600' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  label: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1.2, color: '#FFD600' },
  actionEn: { fontSize: 15, lineHeight: 22, color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' },
  bilingualDot: { fontSize: 15, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginVertical: 10 },
  actionUr: { fontSize: 16, lineHeight: 28, color: '#FFFFFF', textAlign: 'right', writingDirection: 'rtl', letterSpacing: 0 },
});
