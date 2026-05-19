// components/SourceHealthBadge.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { ExtendedSourceStatus } from '../lib/types';

const COLORS: Record<ExtendedSourceStatus, string> = {
  live: '#10b981',
  cached: '#f59e0b',
  degraded: '#ef4444',
  failed: '#7f1d1d',
};

export function SourceHealthBadge({ name, status }: { name: string; status: ExtendedSourceStatus }) {
  const safeStatus: ExtendedSourceStatus = status ?? 'live';
  return (
    <View style={[styles.badge, { backgroundColor: COLORS[safeStatus] }]}>
      <Text style={styles.text}>{name}: {safeStatus.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 6, marginBottom: 6 },
  text: { color: '#fff', fontSize: 10, fontWeight: '600' },
});
