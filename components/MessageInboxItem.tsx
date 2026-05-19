import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MotiView, AnimatePresence } from 'moti';
import { CaretDown, CaretUp, Megaphone, Siren, Hospital, Bank, NewspaperClipping } from 'phosphor-react-native';

const ICONS: Record<string, any> = {
  public: Megaphone,
  emergency: Siren,
  hospital: Hospital,
  hospitals: Hospital,
  government: Bank,
  media: NewspaperClipping,
};

// AAA contrast on #141A26 surface.
const URGENCY_COLOR: Record<string, string> = {
  CRITICAL: '#FF5C75',
  HIGH: '#FF8A00',
  MODERATE: '#FFD600',
  LOW: '#00E676',
};

export function MessageInboxItem({ msg }: { msg: any }) {
  const [open, setOpen] = useState(false);
  const Icon = ICONS[msg.type] ?? Megaphone;
  const urgencyColor = URGENCY_COLOR[msg.urgency] ?? '#A0AEC0';
  const en = msg.messageEn ?? msg.message ?? '';
  const ur = msg.messageUr ?? msg.messageUrdu ?? '';

  return (
    <Pressable onPress={() => setOpen(o => !o)}>
      <Surface style={[styles.card, { borderLeftColor: urgencyColor }]} elevation={2}>
        <View style={styles.headerRow}>
          <View style={[styles.iconBox, { backgroundColor: urgencyColor + '20', borderColor: urgencyColor + '40' }]}>
            <Icon size={20} color={urgencyColor} weight="duotone" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.recipient}>{msg.recipient}</Text>
            <Text style={styles.title} numberOfLines={1}>{msg.title}</Text>
          </View>
          <View style={[styles.urgencyChip, { borderColor: urgencyColor }]}>
            <Text style={[styles.urgencyText, { color: urgencyColor }]}>{msg.urgency}</Text>
          </View>
          {open ? <CaretUp size={16} color="#A0AEC0" /> : <CaretDown size={16} color="#A0AEC0" />}
        </View>

        <AnimatePresence>
          {open && (
            <MotiView
              from={{ opacity: 0, translateY: -4 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -4 }}
              transition={{ type: 'timing', duration: 220 }}
              style={styles.body}
            >
              <Text style={styles.en}>{en}</Text>
              {ur ? <Text style={styles.bilingualDot}>•</Text> : null}
              {ur ? <Text style={styles.ur}>{ur}</Text> : null}
            </MotiView>
          )}
        </AnimatePresence>
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, marginVertical: 6, padding: 14, borderRadius: 16, backgroundColor: '#141A26', borderLeftWidth: 3, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  recipient: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1, color: '#A0AEC0' },
  title: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF', marginTop: 2 },
  urgencyChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  urgencyText: { fontSize: 9, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1 },
  body: { marginTop: 14 },
  en: { fontSize: 13, lineHeight: 20, color: '#FFFFFF' },
  bilingualDot: { fontSize: 13, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginVertical: 8 },
  ur: { fontSize: 14, lineHeight: 26, color: '#FFFFFF', textAlign: 'right', writingDirection: 'rtl', letterSpacing: 0 },
});
