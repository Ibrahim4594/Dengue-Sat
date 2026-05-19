import React, { useRef, useEffect } from 'react';
import { View, FlatList, Animated } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { TraceEvent } from '../lib/types';
import { Ionicons } from '@expo/vector-icons';

interface AgentTracesProps {
  traces: TraceEvent[];
}

export const AgentTraces: React.FC<AgentTracesProps> = ({ traces }) => {
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (traces.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [traces]);

  const renderItem = ({ item }: { item: TraceEvent }) => {
    const isCritical = item.type === 'conflict' || item.type === 'critical';
    const isSuccess = item.type === 'success';

    const icon = isCritical ? 'alert-circle' : isSuccess ? 'checkmark-circle' : 'information-circle';
    const color = isCritical ? theme.colors.error : isSuccess ? theme.colors.secondary : theme.colors.primary;

    return (
      <View style={{ marginBottom: 12, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: color, paddingVertical: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={icon} size={14} color={color} style={{ marginRight: 6 }} />
            <Text variant="labelSmall" style={{ color }}>{item.agent.toUpperCase()}</Text>
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
          </Text>
        </View>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, lineHeight: 18 }}>
          {item.message}
        </Text>
      </View>
    );
  };

  return (
    <Animated.View style={{ opacity: opacityAnim }}>
      <Surface elevation={1} style={{ borderRadius: 12, overflow: 'hidden' }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.outline,
        }}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>ANALYSIS TIMELINE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.secondary, marginRight: 6 }} />
            <Text variant="labelSmall" style={{ color: theme.colors.secondary }}>LIVE MONITORING</Text>
          </View>
        </View>
        <FlatList
          ref={flatListRef}
          data={traces}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12 }}
          showsVerticalScrollIndicator={false}
        />
      </Surface>
    </Animated.View>
  );
};
