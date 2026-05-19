// components/UrduVoiceAlert.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

export function UrduVoiceAlert({ urdu, english }: { urdu: string; english: string }) {
  const theme = useTheme();
  const [playingUrdu, setPlayingUrdu] = useState(false);
  const [playingEng, setPlayingEng] = useState(false);
  const styles = makeStyles(theme);

  const play = (text: string, lang: string, setter: (b: boolean) => void) => {
    if (!text || !text.trim()) return;
    Speech.stop();
    setPlayingUrdu(false);
    setPlayingEng(false);
    setter(true);
    Speech.speak(text, {
      language: lang,
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setter(false),
      onStopped: () => setter(false),
      onError: () => setter(false),
    });
  };

  return (
    <View>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.label}>اردو الرٹ</Text>
          <Pressable onPress={() => play(urdu, 'ur-PK', setPlayingUrdu)} style={styles.btn}>
            <Ionicons name={playingUrdu ? 'stop-circle' : 'play-circle'} size={28} color={theme.colors.primary} />
          </Pressable>
        </View>
        <Text style={styles.urdu}>{urdu}</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.label}>ENGLISH ALERT</Text>
          <Pressable onPress={() => play(english, 'en-US', setPlayingEng)} style={styles.btn}>
            <Ionicons name={playingEng ? 'stop-circle' : 'play-circle'} size={28} color={theme.colors.primary} />
          </Pressable>
        </View>
        <Text style={styles.eng}>{english}</Text>
      </View>
    </View>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    card: { padding: 16, marginBottom: 12, borderRadius: 16, backgroundColor: theme.colors.surface, elevation: 4, borderLeftWidth: 4, borderLeftColor: theme.colors.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    label: { fontSize: 13, fontWeight: '800', color: theme.colors.onSurface, letterSpacing: 1.2 },
    btn: { padding: 4 },
    urdu: { fontSize: 18, color: theme.colors.onSurface, lineHeight: 30, textAlign: 'right', writingDirection: 'rtl', fontWeight: '600' },
    eng: { fontSize: 16, color: theme.colors.onSurface, lineHeight: 24, fontWeight: '500' },
  });
}
