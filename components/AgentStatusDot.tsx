import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface Props {
  icon: string;
  name: string;
  status: 'idle' | 'processing' | 'done' | 'error';
}

export function AgentStatusDot({ icon, name, status }: Props) {
  const theme = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'processing') {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ringScale, { toValue: 1.35, duration: 1100, useNativeDriver: true }),
            Animated.timing(ringScale, { toValue: 1.0, duration: 0, useNativeDriver: true }),
          ]),
        ]),
      ).start();
    } else {
      pulse.setValue(0);
      ringScale.setValue(1);
    }
  }, [status]);

  const colors = {
    processing: { bg: theme.colors.primaryContainer, border: theme.colors.primary, ringOpacity: 0.35 },
    done: { bg: theme.colors.secondaryContainer ?? '#d1fae5', border: theme.colors.secondary ?? '#10b981', ringOpacity: 0 },
    error: { bg: theme.colors.errorContainer, border: theme.colors.error, ringOpacity: 0 },
    idle: { bg: theme.colors.surfaceVariant, border: theme.colors.outline, ringOpacity: 0 },
  }[status] ?? { bg: theme.colors.surfaceVariant, border: theme.colors.outline, ringOpacity: 0 };

  return (
    <View style={styles.wrap}>
      <View style={styles.dotShell}>
        {status === 'processing' && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                borderColor: theme.colors.primary,
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [colors.ringOpacity, 0] }),
                transform: [{ scale: ringScale }],
              },
            ]}
          />
        )}
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: colors.bg, borderColor: colors.border },
            status === 'processing' && {
              transform: [
                {
                  scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }),
                },
              ],
            },
          ]}
        >
          <Text style={{ fontSize: 14 }}>{icon}</Text>
        </Animated.View>
      </View>
      <Text style={[styles.name, { color: theme.colors.onSurface }]} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', flex: 1 },
  dotShell: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  dot: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  ring: { position: 'absolute', width: 40, height: 40, borderRadius: 20, borderWidth: 2 },
  name: { textAlign: 'center', fontSize: 10, fontFamily: 'Inter_600SemiBold' },
});
