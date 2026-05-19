import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Share } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { AgenticDashboard } from '../../components/AgenticDashboard';
import { AntigravityTraceViewer } from '../../components/AntigravityTraceViewer';
import { AgentChatStream } from '../../components/AgentChatStream';
import { DecisionReplay } from '../../components/DecisionReplay';
import SimulationScreen from './simulation';
import { exportAntigravityBundle } from '../../lib/antigravity-export';
import { selectionHaptic } from '../../lib/haptics';

type Mode = 'dashboard' | 'trace' | 'sim' | 'replay' | 'chat';

export default function TracesScreen() {
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>('dashboard');

  const tabs: { id: Mode; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Brain', icon: 'grid' },
    { id: 'trace', label: 'Live', icon: 'pulse' },
    { id: 'sim', label: 'Sim', icon: 'flask' },
    { id: 'replay', label: 'Replay', icon: 'play-circle' },
    { id: 'chat', label: 'Chat', icon: 'chatbubbles' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.tabBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}>
        {tabs.map(t => {
          const active = mode === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => { selectionHaptic(); setMode(t.id); }}
              style={[styles.tab, active && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
            >
              <Ionicons name={t.icon} size={14} color={active ? theme.colors.primary : theme.colors.onSurfaceVariant} />
              <Text style={[styles.tabText, { color: active ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={async () => {
            try {
              const path = await exportAntigravityBundle();
              await Share.share({ url: path, title: 'Antigravity Trace Bundle' });
            } catch (e) {
              console.error('Export failed', e);
            }
          }}
          style={styles.exportBtn}
        >
          <Ionicons name="download-outline" size={16} color={theme.colors.primary} />
        </Pressable>
      </View>
      {mode === 'dashboard' && <AgenticDashboard />}
      {mode === 'trace' && <AntigravityTraceViewer />}
      {mode === 'sim' && <SimulationScreen />}
      {mode === 'replay' && <DecisionReplay />}
      {mode === 'chat' && <AgentChatStream />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5 },
  tabText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
  exportBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
