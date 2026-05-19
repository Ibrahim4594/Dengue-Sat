import React, { useRef, useEffect, useMemo } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { AntigravityTrace } from '../lib/types';
import { AgentIcon } from '../lib/agent-icons';

export function AgentChatStream() {
  const theme = useTheme();
  const traces = useCrisisStore((s: any) => s.antigravityTraces) as AntigravityTrace[];
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const scrollRef = useRef<ScrollView | null>(null);

  const messages = useMemo(() => traces
    .filter(t => t.text || t.reasoning || t.thinking || t.error)
    .map(t => ({
      id: t.id,
      agent: t.agent ?? (t.type.startsWith('master') ? 'master' : 'system'),
      content: t.text ?? t.reasoning ?? t.thinking ?? t.error ?? '',
      isMaster: t.type.startsWith('master'),
      timestamp: t.timestamp,
    })), [traces]);

  useEffect(() => {
    if (messages.length > 0 && scrollRef.current) {
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length]);

  return (
    <ScrollView ref={scrollRef} style={styles.container}>
      {messages.map(m => (
        <View key={m.id} style={[styles.bubble, m.isMaster ? styles.bubbleMaster : styles.bubbleAgent]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <AgentIcon agent={m.agent} size={12} color={theme.colors.onSurface} weight="bold" />
            <Text style={styles.header}>{m.agent.toUpperCase()}</Text>
          </View>
          <Text style={styles.content}>{m.content.slice(0, 600)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1, padding: 12 },
    bubble: { padding: 10, marginBottom: 8, borderRadius: 12, maxWidth: '92%' },
    bubbleMaster: { backgroundColor: theme.colors.primaryContainer, alignSelf: 'flex-end' },
    bubbleAgent: { backgroundColor: theme.colors.surfaceVariant, alignSelf: 'flex-start' },
    header: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4, color: theme.colors.onSurface },
    content: { fontSize: 13, color: theme.colors.onSurface, lineHeight: 18 },
  });
}
