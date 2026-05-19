import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

interface Props {
  intensity?: 'subtle' | 'normal' | 'intense';
  colors?: readonly [string, string, ...string[]];
  style?: ViewStyle;
}

/**
 * Aurora animated gradient backdrop.
 * Two overlapping radial-style linear gradients that breathe + drift.
 * Use behind hero cards / loading states / empty states for premium feel.
 */
export function AuroraBackground({
  intensity = 'normal',
  colors = ['#007AFF', '#5A4FFF', '#00E676'],
  style,
}: Props) {
  const opacity = intensity === 'subtle' ? 0.18 : intensity === 'intense' ? 0.55 : 0.32;

  return (
    <View style={[styles.wrap, style]} pointerEvents="none">
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity, scale: 1.15 }}
        transition={{ type: 'timing', duration: 4200, loop: true, repeatReverse: true }}
        style={styles.blob1}
      >
        <LinearGradient
          colors={[colors[0], 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fill}
        />
      </MotiView>
      <MotiView
        from={{ opacity: 0, translateX: -40 }}
        animate={{ opacity, translateX: 40 }}
        transition={{ type: 'timing', duration: 5800, loop: true, repeatReverse: true, delay: 600 }}
        style={styles.blob2}
      >
        <LinearGradient
          colors={[colors[1] ?? colors[0], 'transparent']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.fill}
        />
      </MotiView>
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: opacity * 0.7, translateY: -20 }}
        transition={{ type: 'timing', duration: 6400, loop: true, repeatReverse: true, delay: 1200 }}
        style={styles.blob3}
      >
        <LinearGradient
          colors={[colors[2] ?? colors[0], 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.fill}
        />
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  fill: { flex: 1 },
  blob1: { position: 'absolute', top: -80, left: -60, width: 320, height: 320, borderRadius: 160 },
  blob2: { position: 'absolute', top: 40, right: -80, width: 280, height: 280, borderRadius: 140 },
  blob3: { position: 'absolute', bottom: -100, left: 40, width: 360, height: 280, borderRadius: 180 },
});
