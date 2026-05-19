import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useCrisisStore } from '../hooks/useCrisisStore';

export function DegradedModeBanner() {
  const health = useCrisisStore((s: any) => s.extendedSourceHealth);
  const slide = useRef(new Animated.Value(-60)).current;

  let cached = 0;
  let degraded = 0;
  if (health) {
    for (const [k, v] of Object.entries(health)) {
      if (k === 'lastChecked') continue;
      if (v === 'cached') cached++;
      if (v === 'failed' || v === 'degraded') degraded++;
    }
  }

  const shouldShow = degraded >= 1 || cached >= 2;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: shouldShow ? 0 : -60,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [shouldShow]);

  if (!health || !shouldShow) return null;

  const safetyMode = degraded >= 3;

  return (
    <Animated.View style={{ transform: [{ translateY: slide }] }}>
      <View style={[styles.banner, { backgroundColor: safetyMode ? '#7f1d1d' : '#f59e0b' }]}>
        <Ionicons name={safetyMode ? 'warning' : 'cloud-offline'} size={18} color="#fff" />
        <Text style={styles.text}>
          {safetyMode
            ? `SAFETY MODE — ${degraded} sources unavailable. Last-known intelligence only.`
            : `API Degradation — ${degraded} failed, ${cached} cached. Confidence reduced.`}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginHorizontal: 12, marginTop: 8, borderRadius: 8 },
  text: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },
});
