import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Text, useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { selectionHaptic } from '../lib/haptics';

const ICON_FOCUSED: Record<string, string> = {
  index: 'analytics',
  outbreaks: 'map',
  health: 'medkit',
  traces: 'terminal',
  simulation: 'flask',
  alerts: 'notifications',
  recovery: 'shield-checkmark',
  citizen: 'people',
};
const ICON_UNFOCUSED: Record<string, string> = {
  index: 'analytics-outline',
  outbreaks: 'map-outline',
  health: 'medkit-outline',
  traces: 'terminal-outline',
  simulation: 'flask-outline',
  alerts: 'notifications-outline',
  recovery: 'shield-checkmark-outline',
  citizen: 'people-outline',
};
const LABEL: Record<string, string> = {
  index: 'Intel',
  outbreaks: 'Map',
  traces: 'Logs',
  citizen: 'Civic',
};

export function PillTabBar(props: BottomTabBarProps) {
  const theme = useTheme();
  const { state, navigation, descriptors } = props;

  return (
    <View style={[styles.outer, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.inner, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
        {state.routes.map((route, idx) => {
          const { options } = descriptors[route.key];
          const opts = options as any;
          const isHidden =
            opts.href === null ||
            opts.tabBarButton === null ||
            opts.tabBarItemHidden === true ||
            !LABEL[route.name];
          if (isHidden) return null;

          const focused = state.index === idx;
          const iconName = (focused ? ICON_FOCUSED[route.name] : ICON_UNFOCUSED[route.name]) ?? 'ellipse-outline';
          const label = opts.tabBarLabel ?? LABEL[route.name] ?? route.name;

          const onPress = () => {
            selectionHaptic();
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={`${label} tab`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MotiView
                animate={{ scale: focused ? 1 : 0.92 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                style={[styles.pill, { backgroundColor: focused ? theme.colors.primaryContainer : 'transparent' }]}
              >
                <Ionicons name={iconName as any} size={18} color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant} />
                {focused && (
                  <MotiView
                    from={{ opacity: 0, translateX: -4 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    style={{ marginLeft: 6 }}
                  >
                    <Text style={[styles.label, { color: theme.colors.primary }]}>{label}</Text>
                  </MotiView>
                )}
              </MotiView>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 6,
    paddingBottom: Platform.OS === 'ios' ? 26 : 12,
    paddingTop: 8,
    borderTopWidth: 0,
  },
  inner: {
    flexDirection: 'row',
    borderRadius: 22,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 18, minWidth: 38 },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold' },
});
