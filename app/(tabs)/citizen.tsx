import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { ARPuddleScanner } from '../../components/ARPuddleScanner';
import { CitizenReportForm } from '../../components/CitizenReportForm';
import { MessageInboxItem } from '../../components/MessageInboxItem';
import { useCrisisStore } from '../../hooks/useCrisisStore';
import { SvgXml } from 'react-native-svg';
import { no_data } from '../../assets/illustrations';
import { MotiView } from 'moti';
import { Tray, Camera, NotePencil } from 'phosphor-react-native';

type Mode = 'inbox' | 'scanner' | 'report';

const TAB_ICON: Record<Mode, any> = { inbox: Tray, scanner: Camera, report: NotePencil };
const TAB_LABEL: Record<Mode, string> = { inbox: 'Inbox', scanner: 'Scan', report: 'Report' };

export default function CitizenScreen() {
  const [mode, setMode] = useState<Mode>('inbox');
  const theme = useTheme();
  const sim = useCrisisStore((s: any) => s.simulationResult);
  const notifs = sim?.stakeholderNotifications ?? [];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.tabBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}>
        {(['inbox', 'scanner', 'report'] as Mode[]).map(m => {
          const Icon = TAB_ICON[m];
          const active = mode === m;
          const tint = active ? theme.colors.primary : theme.colors.onSurfaceVariant;
          return (
            <Pressable key={m} onPress={() => setMode(m)} style={[styles.tab, active && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon size={16} color={tint} weight={active ? 'fill' : 'bold'} />
                <Text style={[styles.tabText, { color: tint }]}>{TAB_LABEL[m]}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.body}>
        {mode === 'inbox' && (
          <ScrollView contentContainerStyle={{ paddingVertical: 12, paddingBottom: 120 }}>
            {notifs.length === 0 ? (
              <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }} style={styles.emptyBox}>
                <SvgXml xml={no_data} width={220} height={170} />
                <Text style={styles.emptyTitle}>Inbox empty</Text>
                <Text style={styles.empty}>Stakeholder broadcasts appear here after analysis. Run System Scan from the Intel tab.</Text>
              </MotiView>
            ) : (
              notifs.map((msg: any, i: number) => <MessageInboxItem key={`${msg.type}-${i}`} msg={msg} />)
            )}
          </ScrollView>
        )}
        {mode === 'scanner' && <ARPuddleScanner />}
        {mode === 'report' && <CitizenReportForm />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  body: { flex: 1 },
  emptyBox: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { color: '#FFFFFF', fontFamily: 'Sora_800ExtraBold', fontSize: 22, marginTop: 18 },
  empty: { color: '#A0AEC0', textAlign: 'center', marginTop: 8, fontSize: 13, lineHeight: 20, fontFamily: 'Inter_400Regular' },
});
