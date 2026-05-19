import React, { useMemo } from 'react';
import { View, ScrollView, FlatList } from 'react-native';
import { Card, Text, List, Surface, Divider, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useCrisisStore } from '../../hooks/useCrisisStore';
import { SourceStatus, SourceName, TraceEvent } from '../../lib/types';
import { PITBCompare } from '../../components/PITBCompare';
import { SourceHealthBadge } from '../../components/SourceHealthBadge';

const SOURCE_META: Record<SourceName, { label: string; icon: string }> = {
  nasa: { label: 'NASA POWER', icon: 'cloudy' },
  hospital: { label: 'Hospital API', icon: 'medkit' },
  social: { label: 'Social Feed', icon: 'chatbubbles' },
  maps: { label: 'Map Services', icon: 'map' },
};

const SOURCE_ORDER: SourceName[] = ['nasa', 'hospital', 'social', 'maps'];

export default function RecoveryScreen() {
  const theme = useTheme();
  const { agentTraces, sourceHealth } = useCrisisStore();
  const extendedHealth = useCrisisStore((s: any) => s.extendedSourceHealth);

  const getStatusColor = (status: SourceStatus): string => {
    switch (status) {
      case 'live': return theme.colors.secondary;
      case 'cached': return theme.colors.tertiary;
      case 'failed': return theme.colors.error;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusLabel = (status: SourceStatus): string => {
    switch (status) {
      case 'live': return 'LIVE';
      case 'cached': return 'CACHED';
      case 'failed': return 'FAILED';
      default: return 'UNKNOWN';
    }
  };

  const getTraceColor = (type: TraceEvent['type']): string => {
    switch (type) {
      case 'error': return theme.colors.error;
      case 'decision': return theme.colors.tertiary;
      case 'reasoning': return theme.colors.primary;
      case 'false-positive': return '#D4A800';
      case 'success': return theme.colors.secondary;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const recentTraces = useMemo(() => {
    return agentTraces.slice(-40).reverse();
  }, [agentTraces]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 8 }}>
        <SourceHealthBadge name="NASA" status={extendedHealth?.nasa ?? 'live'} />
        <SourceHealthBadge name="OpenWx" status={extendedHealth?.openweather ?? 'live'} />
        <SourceHealthBadge name="Maps" status={extendedHealth?.maps ?? 'live'} />
        <SourceHealthBadge name="Firebase" status={extendedHealth?.firebase ?? 'live'} />
        <SourceHealthBadge name="Trends" status={extendedHealth?.trends ?? 'live'} />
        <SourceHealthBadge name="Social" status={extendedHealth?.social ?? 'live'} />
      </View>
      <PITBCompare />
      {/* Section 1: False Positive Handler */}
      <Text variant="titleMedium" style={{ fontWeight: '700', marginBottom: 12 }}>False Positive Recovery</Text>
      <Card mode="outlined" style={{ marginBottom: 20, borderColor: theme.colors.outline }}>
        <Card.Content>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <View style={{
              width: 26, height: 26, borderRadius: 13,
              backgroundColor: theme.colors.errorContainer,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: theme.colors.error, fontSize: 11, fontWeight: '700' }}>1</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" style={{ fontWeight: '700', color: theme.colors.onSurface }}>Signal Flagged: Water-main burst</Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600' }}>
                Social media reports detected by SignalFuse agent
              </Text>
            </View>
          </View>

          <View style={{ alignSelf: 'stretch', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="arrow-down" size={14} color={theme.colors.onSurfaceVariant} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <View style={{
              width: 26, height: 26, borderRadius: 13,
              backgroundColor: theme.colors.tertiaryContainer,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: theme.colors.tertiary, fontSize: 11, fontWeight: '700' }}>2</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" style={{ fontWeight: '700', color: theme.colors.onSurface }}>Reclassified: Infrastructure failure</Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600' }}>
                RecoveryGuard confirms non-dengue pattern match
              </Text>
            </View>
          </View>

          <View style={{ alignSelf: 'stretch', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="arrow-down" size={14} color={theme.colors.onSurfaceVariant} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{
              width: 26, height: 26, borderRadius: 13,
              backgroundColor: theme.colors.secondaryContainer,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: theme.colors.secondary, fontSize: 11, fontWeight: '700' }}>3</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" style={{ fontWeight: '700', color: theme.colors.secondary }}>
                Alert retracted — resources recalled
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600' }}>
                SeverityMind downgrades to ROUTINE protocol
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Section 2: API Status Dashboard */}
      <Text variant="titleMedium" style={{ fontWeight: '700', marginBottom: 12 }}>API Status Dashboard</Text>
      <Card mode="elevated" style={{ marginBottom: 20 }}>
        <Card.Content>
          {SOURCE_ORDER.map((src, i) => {
            const meta = SOURCE_META[src];
            const status: SourceStatus = sourceHealth[src] || 'live';
            const statusColor = getStatusColor(status);
            const statusLabel = getStatusLabel(status);

            return (
              <React.Fragment key={src}>
                {i > 0 && <Divider />}
                <List.Item
                  title={meta.label}
                  description={`Status: ${statusLabel}`}
                  left={() => (
                    <View style={{
                      width: 36, height: 36, borderRadius: 18,
                      backgroundColor: statusColor + '18',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ionicons name={meta.icon as any} size={18} color={statusColor} />
                    </View>
                  )}
                  right={() => (
                    <View style={{
                      backgroundColor: statusColor + '18',
                      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
                    }}>
                      <Text style={{ color: statusColor, fontSize: 10, fontWeight: '700' }}>{statusLabel}</Text>
                    </View>
                  )}
                />
              </React.Fragment>
            );
          })}
        </Card.Content>
      </Card>

      {/* Section 3: System Log */}
      <Text variant="titleMedium" style={{ fontWeight: '700', marginBottom: 12 }}>System Log</Text>
      <Surface style={{ borderRadius: 12, overflow: 'hidden' }} elevation={1}>
        {recentTraces.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>No log entries</Text>
          </View>
        ) : (
          recentTraces.map((trace, i) => {
            const traceColor = getTraceColor(trace.type);
            return (
              <React.Fragment key={`${trace.timestamp}-${i}`}>
                {i > 0 && <Divider />}
                <View style={{ flexDirection: 'row', padding: 12, gap: 10 }}>
                  <View style={{
                    backgroundColor: traceColor + '18',
                    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start',
                  }}>
                    <Text style={{ color: traceColor, fontSize: 9, fontWeight: '700' }}>{trace.type.toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodySmall" style={{ fontWeight: '500', marginBottom: 2 }}>
                      [{trace.agent}] {trace.message}
                    </Text>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {trace.timestamp}
                    </Text>
                  </View>
                </View>
              </React.Fragment>
            );
          })
        )}
      </Surface>
    </ScrollView>
  );
}
