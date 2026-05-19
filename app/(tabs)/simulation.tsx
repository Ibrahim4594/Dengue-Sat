import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { Card, Text, Button, Chip, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCrisisStore } from '../../hooks/useCrisisStore';
import { CounterfactualCard } from '../../components/CounterfactualCard';
import { ResourceAllocChart } from '../../components/ResourceAllocChart';
import { TradeoffTable } from '../../components/TradeoffTable';

type SimMetric = { key: 'dri' | 'hospitalOccupancy' | 'projectedCases' | 'projectedDeaths' | 'responseTime'; label: string };

const METRIC_LABELS: SimMetric[] = [
  { key: 'dri', label: 'DRI Score' },
  { key: 'hospitalOccupancy', label: 'Hospital Occup.' },
  { key: 'projectedCases', label: 'Proj. Cases' },
  { key: 'projectedDeaths', label: 'Proj. Deaths' },
  { key: 'responseTime', label: 'Response Time' },
];

export default function SimulationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { simulationResult, resourcePlan } = useCrisisStore();

  const totalAllocated = useMemo(() => {
    const allocs = resourcePlan?.allocations || [];
    return {
      ambulances: allocs.reduce((s, a) => s + a.ambulances, 0),
      fumigationTrucks: allocs.reduce((s, a) => s + a.fumigationTrucks, 0),
      hospitalBeds: allocs.reduce((s, a) => s + a.hospitalBeds, 0),
      medicalTeams: allocs.reduce((s, a) => s + a.medicalTeams, 0),
    };
  }, [resourcePlan]);

  const fmt = (key: string, value: number): string => {
    if (key === 'dri') return value.toFixed(1);
    if (key === 'responseTime') return `${value} min`;
    if (key === 'hospitalOccupancy') return `${value}%`;
    return value.toLocaleString();
  };

  if (!simulationResult) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100, flexGrow: 1, justifyContent: 'center' }}
      >
        <Card mode="elevated" style={{ alignItems: 'center' }} contentStyle={{ padding: 32 }}>
          <Ionicons name="flask-outline" size={48} color={theme.colors.onSurfaceVariant} />
          <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12, textAlign: 'center' }}>
            No simulation data available
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
            Run pipeline from Intelligence dashboard first
          </Text>
        </Card>
      </ScrollView>
    );
  }

  const { before, after, actions, livesSaved, casesReduced } = simulationResult;

  const actionStatusChip = (status: string) => {
    switch (status) {
      case 'completed': return { bg: theme.colors.secondaryContainer, color: theme.colors.secondary, label: 'DONE' };
      case 'in_progress': return { bg: theme.colors.tertiaryContainer, color: theme.colors.tertiary, label: 'ACTIVE' };
      default: return { bg: theme.colors.surfaceVariant, color: theme.colors.onSurfaceVariant, label: 'PENDING' };
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      <View style={{ height: 16 }} />
      <CounterfactualCard />
      <TradeoffTable />
      <ResourceAllocChart />
      <View style={{ paddingHorizontal: 16 }}>
      {/* Lives Saved KPI */}
      <Card mode="elevated" style={{ marginBottom: 16, borderLeftWidth: 4, borderLeftColor: theme.colors.secondary, backgroundColor: '#0B0F17' }}>
        <Card.Content style={{ alignItems: 'center' }}>
          <Text variant="labelMedium" style={{ color: theme.colors.secondary, letterSpacing: 1.5, fontWeight: '800' }}>
            LIVES PRESERVED
          </Text>
          <Text variant="displaySmall" style={{ color: theme.colors.secondary, fontWeight: '900', marginVertical: 4 }}>
            {livesSaved.toLocaleString()}
          </Text>
          <Text variant="bodySmall" style={{ color: '#A0AEC0', fontWeight: '600' }}>
            {casesReduced.toLocaleString()} CASES PREVENTED
          </Text>
        </Card.Content>
      </Card>

      {/* Before / After Split */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <Card mode="outlined" style={{ flex: 1 }}>
          <Card.Content style={{ padding: 12 }}>
            <View style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: theme.colors.onSurfaceVariant }}>BEFORE</Text>
            </View>
            {METRIC_LABELS.map((m, i) => (
              <View key={m.key} style={{ marginBottom: i < METRIC_LABELS.length - 1 ? 12 : 0 }}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 2 }}>{m.label}</Text>
                <Text variant="titleMedium" style={{ fontWeight: '700' }}>{fmt(m.key, before[m.key])}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card mode="outlined" style={{ flex: 1, borderColor: theme.colors.secondary }}>
          <Card.Content style={{ padding: 12 }}>
            <View style={{ backgroundColor: theme.colors.secondaryContainer, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: theme.colors.secondary }}>AFTER</Text>
            </View>
            {METRIC_LABELS.map((m, i) => (
              <View key={m.key} style={{ marginBottom: i < METRIC_LABELS.length - 1 ? 12 : 0 }}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 2 }}>{m.label}</Text>
                <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.secondary }}>{fmt(m.key, after[m.key])}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      </View>

      {/* Intervention Actions */}
      <Card mode="elevated" style={{ marginBottom: 16 }}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 14, fontWeight: '700' }}>Intervention Actions</Text>
          {actions.map((action, i) => {
            const chip = actionStatusChip(action.status);
            return (
              <View
                key={action.id}
                style={{
                  flexDirection: 'row', alignItems: 'flex-start',
                  paddingTop: i > 0 ? 12 : 0, paddingBottom: i < actions.length - 1 ? 12 : 0,
                  borderTopWidth: i > 0 ? 1 : 0, borderBottomWidth: i < actions.length - 1 ? 1 : 0,
                  borderColor: theme.colors.outline,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{action.description}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                    {action.descriptionUrdu}
                  </Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>{action.impact}</Text>
                </View>
                <Chip compact style={{ backgroundColor: chip.bg, marginLeft: 8 }} textStyle={{ color: chip.color, fontSize: 10, fontWeight: '700' }}>
                  {chip.label}
                </Chip>
              </View>
            );
          })}
        </Card.Content>
      </Card>

      {/* Resource Allocation */}
      {resourcePlan && (
        <Card mode="elevated" style={{ marginBottom: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 14, fontWeight: '700' }}>Resource Allocation</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <Chip style={{ backgroundColor: theme.colors.primaryContainer }} icon={() => <Ionicons name="medkit-outline" size={16} color={theme.colors.primary} />}>
                {`${totalAllocated.ambulances} Ambulances`}
              </Chip>
              <Chip style={{ backgroundColor: theme.colors.tertiaryContainer }} icon={() => <Ionicons name="car-outline" size={16} color={theme.colors.tertiary} />}>
                {`${totalAllocated.fumigationTrucks} Fumigation`}
              </Chip>
              <Chip style={{ backgroundColor: theme.colors.secondaryContainer }} icon={() => <Ionicons name="bed-outline" size={16} color={theme.colors.secondary} />}>
                {`${totalAllocated.hospitalBeds} Beds`}
              </Chip>
              <Chip style={{ backgroundColor: theme.colors.primaryContainer }} icon={() => <Ionicons name="people-outline" size={16} color={theme.colors.primary} />}>
                {`${totalAllocated.medicalTeams} Teams`}
              </Chip>
            </View>

            {resourcePlan.reserve && (
              <View>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>RESERVE POOL</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant, borderRadius: 8, padding: 10 }}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Ambulances</Text>
                    <Text variant="titleSmall" style={{ fontWeight: '700' }}>
                      {`${resourcePlan.reserve.ambulances.available}/${resourcePlan.reserve.ambulances.total}`}
                    </Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant, borderRadius: 8, padding: 10 }}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Beds</Text>
                    <Text variant="titleSmall" style={{ fontWeight: '700' }}>
                      {`${resourcePlan.reserve.hospitalBeds.available}/${resourcePlan.reserve.hospitalBeds.total}`}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <View style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant, borderRadius: 8, padding: 10 }}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Fumigation</Text>
                    <Text variant="titleSmall" style={{ fontWeight: '700' }}>
                      {`${resourcePlan.reserve.fumigationTrucks.available}/${resourcePlan.reserve.fumigationTrucks.total}`}
                    </Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant, borderRadius: 8, padding: 10 }}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Med Teams</Text>
                    <Text variant="titleSmall" style={{ fontWeight: '700' }}>
                      {`${resourcePlan.reserve.medicalTeams.available}/${resourcePlan.reserve.medicalTeams.total}`}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {resourcePlan.tradeoffs.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text variant="labelMedium" style={{ color: theme.colors.tertiary, marginBottom: 4 }}>Trade-offs</Text>
                {resourcePlan.tradeoffs.map((t: string, i: number) => (
                  <Text key={i} variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{`\u2022 ${t}`}</Text>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      <Button
        mode="contained"
        icon="people"
        onPress={() => router.push('/citizen')}
        contentStyle={{ paddingVertical: 10 }}
        style={{ borderRadius: 12, marginBottom: 40 }}
      >
        GO TO COMMUNITY HUB
      </Button>
      </View>
    </ScrollView>
  );
}
