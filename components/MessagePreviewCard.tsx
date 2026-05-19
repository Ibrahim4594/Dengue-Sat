import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MotiView } from 'moti';
import { Megaphone, CaretRight } from 'phosphor-react-native';
import { router } from 'expo-router';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { selectionHaptic } from '../lib/haptics';

export function MessagePreviewCard() {
  const sim = useCrisisStore((s: any) => s.simulationResult);
  const notifs = sim?.stakeholderNotifications ?? [];
  if (notifs.length === 0) return null;

  const publicMsg = notifs.find((n: any) => n.type === 'public') ?? notifs[0];
  const remaining = Math.max(0, notifs.length - 1);

  return (
    <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 160 }}>
      <Pressable onPress={() => { selectionHaptic(); router.push('/(tabs)/citizen'); }}>
        <Surface style={styles.card} elevation={3}>
          <View style={styles.header}>
            <Megaphone size={14} color="#007AFF" weight="fill" />
            <Text style={styles.label}>LATEST PUBLIC ALERT</Text>
            <CaretRight size={14} color="#A0AEC0" style={{ marginLeft: 'auto' }} />
          </View>
          <Text style={styles.msgEn} numberOfLines={2}>{publicMsg.messageEn ?? publicMsg.message ?? ''}</Text>
          <Text style={styles.bilingualDot}>•</Text>
          <Text style={styles.msgUr} numberOfLines={2}>{publicMsg.messageUr ?? publicMsg.messageUrdu ?? ''}</Text>
          {remaining > 0 && <Text style={styles.more}>See {remaining} more in Civic →</Text>}
        </Surface>
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, marginTop: 12, marginBottom: 16, padding: 20, borderRadius: 20, backgroundColor: '#141A26' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  label: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1.2, color: '#007AFF' },
  msgEn: { fontSize: 14, lineHeight: 20, color: '#FFFFFF', fontFamily: 'Inter_400Regular' },
  bilingualDot: { fontSize: 14, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginVertical: 8 },
  msgUr: { fontSize: 15, lineHeight: 26, color: '#FFFFFF', textAlign: 'right', writingDirection: 'rtl', letterSpacing: 0 },
  more: { marginTop: 12, fontSize: 11, color: '#007AFF', fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
});
