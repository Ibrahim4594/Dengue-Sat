import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { Platform } from 'react-native';
import { PillTabBar } from '../../components/PillTabBar';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      tabBar={(props) => <PillTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#6E7681',
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.outline,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 28 : 16,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        headerStyle: { backgroundColor: theme.colors.surface, height: 110 },
        headerTitleStyle: { fontFamily: 'Sora_700Bold', color: theme.colors.onSurface, fontSize: 18 },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Intelligence',
          tabBarLabel: 'Intel',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'analytics' : 'analytics-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="outbreaks"
        options={{
          title: 'Surveillance',
          tabBarLabel: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="traces"
        options={{
          title: 'Neural Analytics',
          tabBarLabel: 'Logs',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'terminal' : 'terminal-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="citizen"
        options={{
          title: 'Community Hub',
          tabBarLabel: 'Civic',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
        }}
      />
      {/* Hidden redundant tabs — functionality moved to sub-navigations or merged screens */}
      <Tabs.Screen name="health" options={{ href: null }} />
      <Tabs.Screen name="simulation" options={{ href: null }} />
      <Tabs.Screen name="alerts" options={{ href: null }} />
      <Tabs.Screen name="recovery" options={{ href: null }} />
    </Tabs>
  );
}
