import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { MotiView } from 'moti';
import { Pulse, Lightning, Brain, MagicWand, Warning } from 'phosphor-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { AntigravityTrace } from '../lib/types';
import { phaseFor } from '../lib/phases';

function TraceCard({ t, isLatest, theme, styles, runStart }: { t: AntigravityTrace; isLatest: boolean; theme: any; styles: any; runStart: number }) {
  const cost = t.usage?.costUSD ?? 0;
  const tokens = (t.usage?.inputTokens ?? 0) + (t.usage?.outputTokens ?? 0);
  const phase = phaseFor(t);
  const colorBorder = phase.color;
  const elapsedSec = runStart > 0 ? ((t.timestamp - runStart) / 1000).toFixed(1) : null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 260 }}
    >
      <Surface
        style={[
          styles.card,
          { borderLeftColor: colorBorder },
          isLatest && t.type === 'tool.start' && { borderColor: colorBorder, borderWidth: 1.5, shadowColor: colorBorder, shadowOpacity: 0.3, shadowRadius: 10 },
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.typeBadge, { backgroundColor: phase.bg, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
            <Ionicons name={phase.icon as any} size={10} color={colorBorder} />
            <Text style={[styles.tag, { color: colorBorder }]}>{phase.shortLabel}</Text>
          </View>
          {t.agent && <Text style={styles.agent}>{t.agent}</Text>}
          {isLatest && t.type === 'tool.start' && (
            <MotiView
              style={styles.livePulse}
              from={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 600, loop: true }}
            >
              <View style={[styles.pulseDot, { backgroundColor: colorBorder }]} />
              <Text style={[styles.liveLabel, { color: colorBorder }]}>ACTIVE</Text>
            </MotiView>
          )}
          {elapsedSec !== null && (
            <View style={[styles.timeBadge, { backgroundColor: phase.bg }]}>
              <Text style={[styles.timeBadgeText, { color: colorBorder }]}>T+{elapsedSec}s</Text>
            </View>
          )}
          <Text style={styles.time}>{new Date(t.timestamp).toLocaleTimeString()}</Text>
        </View>

        {t.thinking && (
          <Surface style={styles.thinkingTerminal} elevation={0}>
            <View style={styles.terminalHeader}>
              <Brain size={12} color="#A0AEC0" weight="fill" />
              <Text style={styles.terminalTitle}>NEURAL THOUGHT PROCESS</Text>
            </View>
            <Text style={styles.thinkingText}>{t.thinking}</Text>
          </Surface>
        )}

        {t.text && (
          <View style={styles.messageSection}>
            <Text style={styles.messageText}>{t.text}</Text>
          </View>
        )}

        {t.toolCallsPlanned && t.toolCallsPlanned.length > 0 && (
          <View style={styles.toolSection}>
            <View style={styles.sectionHeader}>
              <MagicWand size={12} color={theme.colors.primary} weight="duotone" />
              <Text style={styles.sectionLabel}>DISPATCHING SUB-AGENTS</Text>
            </View>
            <View style={styles.toolChipContainer}>
              {t.toolCallsPlanned.map((tool, i) => (
                <View key={i} style={styles.toolChip}>
                  <Text style={styles.toolChipText}>{tool}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {t.reasoning && (
          <View style={styles.reasoningSection}>
            <View style={styles.sectionHeader}>
              <Lightning size={12} color={theme.colors.secondary} weight="duotone" />
              <Text style={styles.sectionLabel}>SUB-AGENT REASONING</Text>
            </View>
            <Text style={styles.reasoningText}>{t.reasoning}</Text>
          </View>
        )}

        {t.output && (
          <View style={styles.outputSection}>
            <Text style={styles.sectionLabel}>DATA PAYLOAD</Text>
            <Text style={styles.code}>{JSON.stringify(t.output, null, 2).slice(0, 800)}</Text>
          </View>
        )}

        {t.error && (
          <View style={styles.errorSection}>
            <View style={styles.sectionHeader}>
              <Warning size={14} color={theme.colors.error} weight="fill" />
              <Text style={[styles.sectionLabel, { color: theme.colors.error }]}>CRITICAL FAULT</Text>
            </View>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{t.error}</Text>
          </View>
        )}

        {(tokens > 0 || cost > 0) && (
          <View style={styles.footerRow}>
            <Ionicons name="flash" size={10} color={theme.colors.primary} />
            <Text style={styles.usageText}>
              ${cost.toFixed(6)} • {tokens.toLocaleString()} TOKENS
            </Text>
          </View>
        )}
      </Surface>
    </MotiView>
  );
}

export function AntigravityTraceViewer() {
  const traces = useCrisisStore((s: any) => s.antigravityTraces) as AntigravityTrace[];
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const listRef = useRef<any>(null);

  useEffect(() => {
    if (traces.length > 0 && listRef.current) {
      requestAnimationFrame(() => {
        try { listRef.current?.scrollToEnd({ animated: true }); }
        catch (e) { console.warn('[TraceViewer] scrollToEnd failed', e); }
      });
    }
  }, [traces.length]);

  const runStart = traces.length > 0 ? traces[0].timestamp : 0;

  if (traces.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MotiView
          from={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring' }}
        >
          <Pulse size={80} color={theme.colors.primary} weight="duotone" />
        </MotiView>
        <Text style={styles.emptyTitle}>ANTIGRAVITY STANDBY</Text>
        <Text style={styles.emptySub}>
          The system is ready for tactical analysis. Execute a scan from the Intel tab to begin orchestration.
        </Text>
      </View>
    );
  }

  const lastTrace = traces[traces.length - 1];
  const isLive = lastTrace && lastTrace.type !== 'master.done';

  return (
    <View style={{ flex: 1, backgroundColor: '#040609' }}>
      {isLive && (
        <Surface style={styles.liveBar} elevation={4}>
          <MotiView
            from={{ opacity: 0.3 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 500, loop: true }}
          >
            <View style={[styles.pulseDotLarge, { backgroundColor: theme.colors.primary }]} />
          </MotiView>
          <Text style={styles.liveBarText}>ORCHESTRATION IN PROGRESS • {traces.length} EVENTS</Text>
        </Surface>
      )}
      <FlashList
        ref={listRef as any}
        data={traces}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listPadding}
        renderItem={({ item, index }) => (
          <TraceCard
            t={item}
            isLatest={index === traces.length - 1}
            theme={theme}
            styles={styles}
            runStart={runStart}
          />
        )}
      />
    </View>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    listPadding: { padding: 12, paddingBottom: 100 },
    emptyContainer: { flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 16, fontWeight: '900', color: theme.colors.onSurface, marginTop: 24, letterSpacing: 2 },
    emptySub: { fontSize: 13, textAlign: 'center', color: '#6E7681', lineHeight: 22, marginTop: 12, maxWidth: 300 },
    liveBar: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#0B0F17', borderBottomWidth: 1, borderBottomColor: '#232D3F', gap: 10 },
    liveBarText: { fontSize: 11, fontWeight: '900', color: theme.colors.primary, letterSpacing: 1.5 },
    card: { padding: 16, marginBottom: 14, borderRadius: 20, borderLeftWidth: 4, backgroundColor: '#0B0F17', elevation: 2 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    tag: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    agent: { fontSize: 14, fontWeight: '800', color: 'white' },
    livePulse: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
    liveLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    time: { marginLeft: 'auto', fontSize: 11, color: '#6E7681', fontFamily: 'monospace' },
    timeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 'auto' },
    timeBadgeText: { fontSize: 9, fontFamily: 'Inter_800ExtraBold', fontVariant: ['tabular-nums'] },
    thinkingTerminal: { backgroundColor: '#040609', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#1A1F2C' },
    terminalHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    terminalTitle: { fontSize: 9, fontWeight: '900', color: '#6E7681', letterSpacing: 1 },
    thinkingText: { fontSize: 13, color: '#A0AEC0', lineHeight: 20, fontStyle: 'italic' },
    messageSection: { marginBottom: 12 },
    messageText: { fontSize: 15, color: 'white', lineHeight: 22, fontWeight: '500' },
    toolSection: { marginBottom: 12 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    sectionLabel: { fontSize: 10, fontWeight: '900', color: '#6E7681', letterSpacing: 1 },
    toolChipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    toolChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: 'rgba(0,122,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,122,255,0.2)' },
    toolChipText: { fontSize: 11, fontWeight: '800', color: '#007AFF' },
    reasoningSection: { marginBottom: 12, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: '#232D3F' },
    reasoningText: { fontSize: 13, color: '#C9D1D9', lineHeight: 20 },
    outputSection: { marginBottom: 8 },
    code: { fontFamily: 'monospace', fontSize: 11, color: '#00E676', backgroundColor: '#040609', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#141A26' },
    errorSection: { padding: 12, backgroundColor: 'rgba(255,23,68,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,23,68,0.2)' },
    errorText: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
    footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#141A26' },
    usageText: { fontSize: 10, color: '#6E7681', fontWeight: '800', letterSpacing: 0.5 },
    pulseDot: { width: 6, height: 6, borderRadius: 3 },
    pulseDotLarge: { width: 8, height: 8, borderRadius: 4 },
  });
}
