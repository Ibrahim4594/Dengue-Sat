import React from 'react';
import { Surface, Text, DataTable, useTheme } from 'react-native-paper';

export const PITBGapAnalysis: React.FC = () => {
  const theme = useTheme();

  const rows = [
    ['Detection', 'Reactive (Manual)', 'Proactive (AI)'],
    ['Signals', 'Hospital Only', 'Multi-Source Fusion'],
    ['Verification', 'Human (Slow)', 'RecoveryGuard (Auto)'],
    ['UX', 'Internal/Govt', 'Public Health Hub'],
    ['ROI', 'Unknown', '93x Projected'],
  ];

  return (
    <Surface elevation={0} style={{ padding: 15, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.outline, marginBottom: 100 }}>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12, textAlign: 'center', letterSpacing: 1 }}>
        COMPARATIVE AUDIT: DENGUESAT VS DATS
      </Text>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title><Text variant="labelSmall" style={{ fontWeight: '700' }}>FEATURE</Text></DataTable.Title>
          <DataTable.Title><Text variant="labelSmall" style={{ fontWeight: '700' }}>PITB DATS</Text></DataTable.Title>
          <DataTable.Title><Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: '700' }}>DENGUESAT</Text></DataTable.Title>
        </DataTable.Header>
        {rows.map(([feature, dats, ds], i) => (
          <DataTable.Row key={i}>
            <DataTable.Cell><Text variant="labelSmall">{feature}</Text></DataTable.Cell>
            <DataTable.Cell><Text variant="labelSmall" style={{ color: theme.colors.error, opacity: 0.7 }}>{dats}</Text></DataTable.Cell>
            <DataTable.Cell><Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: '700' }}>{ds}</Text></DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
    </Surface>
  );
};
