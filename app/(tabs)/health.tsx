import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Card, Text, Button, Chip, Switch, Divider, Badge, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useCrisisStore } from '../../hooks/useCrisisStore';
import { SYMPTOMS, checkSymptoms } from '../../lib/symptom-checker';
import { Symptom } from '../../lib/types';

/**
 * Health Hub — Climate Pulse
 * Clinical symptom assessment + Hospital connectivity
 */
export default function HealthScreen() {
  const theme = useTheme();
  const { fusedSignal, symptomCheckResult, setSymptomCheckResult, plateletAlertActive, setPlateletAlertActive } = useCrisisStore();
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);

  const toggleSymptom = (symptom: Symptom) => {
    const next = selectedSymptoms.includes(symptom)
      ? selectedSymptoms.filter(s => s !== symptom)
      : [...selectedSymptoms, symptom];
    setSelectedSymptoms(next);
  };

  const handleRunCheck = () => {
    const hospitals = fusedSignal?.hospital.data || [];
    const result = checkSymptoms(selectedSymptoms, hospitals);
    setSymptomCheckResult(result);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <View style={{ marginBottom: 20, marginTop: 10 }}>
        <Text variant="headlineSmall" style={{ fontSize: 22, marginBottom: 4 }}>Symptom Assessment</Text>
        <Text variant="bodyMedium" style={{ fontSize: 14, color: theme.colors.onSurfaceVariant }}>Clinical-grade rapid dengue screening based on local epidemiological data.</Text>
      </View>

      <Card mode="elevated" style={{ marginBottom: 20 }} contentStyle={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 }}>
          {SYMPTOMS.map((item) => (
            <View key={item.symptom} style={{ width: '48%', marginBottom: 12 }}>
              <Chip
                icon={() => <Text style={{ fontSize: 20 }}>{item.icon}</Text>}
                selected={selectedSymptoms.includes(item.symptom)}
                onPress={() => toggleSymptom(item.symptom)}
                style={{ width: '100%' }}
                showSelectedOverlay
              >
                {item.label}
              </Chip>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, marginLeft: 4, textAlign: 'left' }}>
                {item.labelUrdu}
              </Text>
            </View>
          ))}
        </View>

        <Button mode="contained" onPress={handleRunCheck} contentStyle={{ paddingVertical: 8 }} style={{ borderRadius: 8 }}>
          GENERATE CLINICAL REPORT
        </Button>
      </Card>

      {/* Assessment Results */}
      {symptomCheckResult && (
        <Card
          mode="outlined"
          style={{
            marginBottom: 20,
            borderLeftWidth: 4,
            borderLeftColor: symptomCheckResult.severity === 'severe' ? theme.colors.error : theme.colors.tertiary,
          }}
          contentStyle={{ padding: 16 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text variant="headlineSmall" style={{ fontSize: 18 }}>
              {symptomCheckResult.probability}% Probability
            </Text>
            <Badge style={{ backgroundColor: symptomCheckResult.severity === 'severe' ? theme.colors.error : theme.colors.tertiary }}>
              {symptomCheckResult.severity.toUpperCase()}
            </Badge>
          </View>

          <Text variant="bodyMedium" style={{ fontSize: 14, lineHeight: 20 }}>{symptomCheckResult.recommendation}</Text>
          <Divider style={{ marginVertical: 12 }} />
          <Text style={{ color: theme.colors.onSurface, fontSize: 16, lineHeight: 24, textAlign: 'right', marginTop: 8 }}>
            {symptomCheckResult.recommendationUrdu}
          </Text>

          <Text variant="bodySmall" style={{ fontSize: 10, color: theme.colors.onSurfaceVariant, marginTop: 12, textAlign: 'center', fontStyle: 'italic' }}>
            {symptomCheckResult.disclaimer}
          </Text>
        </Card>
      )}

      {/* Platelet Alert Toggle */}
      <Card mode="elevated" contentStyle={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primaryContainer, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
            <Ionicons name="notifications" size={20} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={{ fontSize: 14 }}>Emergency Platelet Sync</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Push alerts for blood bank scarcity.</Text>
          </View>
          <Switch value={plateletAlertActive} onValueChange={setPlateletAlertActive} />
        </View>
      </Card>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
