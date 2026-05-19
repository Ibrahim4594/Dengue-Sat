import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { AntigravityTrace } from '../lib/types';

interface Quote {
  source: string;
  agent: string;
  text: string;
  credibility?: number;
}

const SOURCE_COLOR: Record<string, string> = {
  NASA: '#3b82f6',
  Hospital: '#10b981',
  OpenWeather: '#06b6d4',
  Maps: '#a855f7',
  Trends: '#f59e0b',
  Social: '#ec4899',
  Field: '#ef4444',
  Synthetic: '#6b7280',
};

function detectSource(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('nasa') || t.includes('t2m') || t.includes('ndvi') || t.includes('ndwi')) return 'NASA';
  if (t.includes('hospital') || t.includes('jinnah') || t.includes('admission') || t.includes('platelet')) return 'Hospital';
  if (t.includes('humidity') || t.includes('precipitation') || t.includes('weather')) return 'OpenWeather';
  if (t.includes('traffic') || t.includes('congestion') || t.includes('routing')) return 'Maps';
  if (t.includes('search') || t.includes('trend') || t.includes('anomaly')) return 'Trends';
  if (t.includes('bukhar') || t.includes('mosquito') || t.includes('ڈینگی') || t.includes('بخار')) return 'Social';
  if (t.includes('field') || t.includes('water-main') || t.includes('pipe')) return 'Field';
  return 'Synthetic';
}

export function EvidenceWall() {
  const theme = useTheme();
  const traces = useCrisisStore((s: any) => s.antigravityTraces) as AntigravityTrace[];
  const styles = makeStyles(theme);

  const quotes = useMemo<Quote[]>(() => {
    const out: Quote[] = [];
    for (const t of traces) {
      const output = t.output;
      if (!output) continue;
      const collect = (arr: any) => {
        if (Array.isArray(arr)) {
          for (const q of arr) {
            if (typeof q === 'string' && q.length > 4) {
              out.push({
                source: detectSource(q),
                agent: t.agent ?? t.type,
                text: q,
              });
            }
          }
        }
      };
      collect(output.evidence_quotes);
      if (output.fusedSignal?.evidence_quotes) collect(output.fusedSignal.evidence_quotes);
      if (Array.isArray(output.crises)) {
        for (const c of output.crises) collect(c.evidence_quotes);
      }
      if (Array.isArray(output.assessments)) {
        for (const a of output.assessments) collect(a.evidence_quotes);
      }
      // SignalFuse credibility
      if (output.sourceCredibility && typeof output.sourceCredibility === 'object') {
        for (const [src, cred] of Object.entries(output.sourceCredibility)) {
          out.push({
            source: src.replace(/^./, c => c.toUpperCase()),
            agent: t.agent ?? 'signal_fuse',
            text: `Credibility score: ${cred}/100`,
            credibility: cred as number,
          });
        }
      }
    }
    // Dedupe by text
    const seen = new Set<string>();
    return out.filter(q => {
      if (seen.has(q.text)) return false;
      seen.add(q.text);
      return true;
    });
  }, [traces]);

  if (quotes.length === 0) return null;

  return (
    <Surface style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="library" size={16} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>EVIDENCE WALL</Text>
          <Text style={styles.title}>{quotes.length} verbatim quotes from {new Set(quotes.map(q => q.source)).size} sources</Text>
        </View>
      </View>
      <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator>
        {quotes.slice(0, 30).map((q, i) => {
          const color = SOURCE_COLOR[q.source] ?? '#6b7280';
          return (
            <MotiView
              key={i}
              from={{ opacity: 0, translateX: -8 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 200, delay: i * 30 }}
              style={[styles.quoteRow, { borderLeftColor: color }]}
            >
              <View style={styles.quoteHeader}>
                <View style={[styles.sourceBadge, { backgroundColor: color + '22' }]}>
                  <Text style={[styles.sourceText, { color }]}>{q.source}</Text>
                </View>
                <Text style={styles.agentText}>{q.agent}</Text>
              </View>
              <Text style={styles.quoteText} numberOfLines={3}>
                "{q.text}"
              </Text>
            </MotiView>
          );
        })}
      </ScrollView>
    </Surface>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    card: { padding: 14, marginHorizontal: 12, marginVertical: 6, borderRadius: 14, backgroundColor: theme.colors.surface, elevation: 1 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    iconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: theme.colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1.5, color: theme.colors.primary },
    title: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: theme.colors.onSurface, marginTop: 1 },
    quoteRow: { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 6, marginBottom: 8 },
    quoteHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    sourceBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    sourceText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
    agentText: { fontSize: 10, color: theme.colors.onSurfaceVariant, fontFamily: 'Inter_500Medium' },
    quoteText: { fontSize: 12, color: theme.colors.onSurface, fontFamily: 'Inter_400Regular', lineHeight: 17, fontStyle: 'italic' },
  });
}
