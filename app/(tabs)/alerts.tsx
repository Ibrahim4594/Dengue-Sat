import React, { useState, useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { Card, Text, SegmentedButtons, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useCrisisStore } from '../../hooks/useCrisisStore';
import { StakeholderType } from '../../lib/types';
import { UrduVoiceAlert } from '../../components/UrduVoiceAlert';

const FILTER_TABS = [
  { value: 'public' as const, label: 'Public', icon: 'people' },
  { value: 'hospitals' as const, label: 'Hospitals', icon: 'medkit' },
  { value: 'government' as const, label: 'Govt.', icon: 'business' },
  { value: 'media' as const, label: 'Media', icon: 'megaphone' },
];

export default function AlertsScreen() {
  const theme = useTheme();
  const { simulationResult } = useCrisisStore();
  const sim = useCrisisStore((s: any) => s.simulationResult);
  const sm = sim?.stakeholderNotifications?.[0];
  const [filter, setFilter] = useState<'public' | 'hospitals' | 'government' | 'media'>('public');

  const filteredAlerts = useMemo(() => {
    if (!simulationResult) return [];
    return simulationResult.stakeholderNotifications.filter((a) => a.type === filter);
  }, [simulationResult, filter]);

  const getUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case 'CRITICAL': return theme.colors.error;
      case 'HIGH': return theme.colors.tertiary;
      case 'MODERATE': return '#D4A800';
      default: return theme.colors.secondary;
    }
  };

  const getTypeMeta = (type: string) => {
    switch (type) {
      case 'public': return { icon: 'warning', subject: 'Public Safety Alert', subjectUrdu: 'عوامی حفاظتی الرٹ' };
      case 'hospitals': return { icon: 'medkit', subject: 'Hospital Preparedness', subjectUrdu: 'ہسپتال کی تیاری' };
      case 'government': return { icon: 'shield-checkmark', subject: 'Situation Report', subjectUrdu: 'صورتحال رپورٹ' };
      case 'media': return { icon: 'megaphone', subject: 'Press Briefing', subjectUrdu: 'پریس بریفنگ' };
      default: return { icon: 'information-circle', subject: 'Notification', subjectUrdu: 'اطلاع' };
    }
  };

  if (!simulationResult) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100, flexGrow: 1, justifyContent: 'center' }}
      >
        <Card mode="elevated" style={{ alignItems: 'center' }} contentStyle={{ padding: 32 }}>
          <Ionicons name="notifications-off-outline" size={48} color={theme.colors.onSurfaceVariant} />
          <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12, textAlign: 'center' }}>
            No alerts available
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
            Run pipeline from Intelligence dashboard first
          </Text>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
    >
      {sm && <UrduVoiceAlert urdu={sm.messageUrdu ?? sm.messageUr ?? ''} english={sm.message ?? sm.messageEn ?? ''} />}
      <SegmentedButtons
        value={filter}
        onValueChange={(v) => setFilter(v as typeof filter)}
        buttons={FILTER_TABS}
        style={{ marginBottom: 16 }}
      />

      {filteredAlerts.length === 0 ? (
        <Card mode="elevated" style={{ alignItems: 'center' }} contentStyle={{ padding: 24 }}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {`No ${FILTER_TABS.find((t) => t.value === filter)?.label ?? filter} alerts for this simulation`}
          </Text>
        </Card>
      ) : (
        filteredAlerts.map((alert, i) => {
          const meta = getTypeMeta(alert.type);
          const urgencyColor = getUrgencyColor(alert.urgency);

          return (
            <Card key={`${alert.type}-${i}`} mode="elevated" style={{ marginBottom: 14 }}>
              <Card.Content>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{
                      width: 34, height: 34, borderRadius: 17,
                      backgroundColor: theme.colors.primaryContainer,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ionicons name={meta.icon as any} size={17} color={theme.colors.primary} />
                    </View>
                    <View>
                      <Text variant="labelMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                        {meta.subject}
                      </Text>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {meta.subjectUrdu}
                      </Text>
                    </View>
                  </View>
                  <View style={{
                    backgroundColor: urgencyColor + '20',
                    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
                  }}>
                    <Text style={{ color: urgencyColor, fontSize: 10, fontWeight: '700' }}>
                      {alert.urgency}
                    </Text>
                  </View>
                </View>

                <View style={{
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: 16, borderBottomLeftRadius: 4,
                  padding: 18, marginBottom: 10, maxWidth: '100%',
                  borderWidth: 1, borderColor: theme.colors.outline,
                }}>
                  <Text style={{ fontSize: 18, color: theme.colors.onSurface, fontWeight: '700', marginBottom: 8, textAlign: 'right', writingDirection: 'rtl' }}>
                    {alert.messageUrdu}
                  </Text>
                  <View style={{ height: 1.5, backgroundColor: theme.colors.outline, marginBottom: 10, opacity: 0.5 }} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, lineHeight: 22, fontWeight: '500' }}>
                    {alert.message}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' }}>
                  <Ionicons name="time-outline" size={11} color={theme.colors.onSurfaceVariant} />
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {alert.timestamp}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}
