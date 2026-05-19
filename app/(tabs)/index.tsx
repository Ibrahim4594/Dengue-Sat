import React, { useCallback } from 'react';
import { ScrollView, Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { useCrisisStore } from '../../hooks/useCrisisStore';
import { ProvincePicker } from '../../components/ProvincePicker';
import { HeroDRICard } from '../../components/HeroDRICard';
import { ActionCard } from '../../components/ActionCard';
import { MessagePreviewCard } from '../../components/MessagePreviewCard';
import { EmptyHero } from '../../components/EmptyHero';
import { antigravity } from '../../lib/antigravity';
import { tapHaptic, successHaptic, errorHaptic } from '../../lib/haptics';

const EMPTY_CRISES: any[] = [];

export default function IntelligenceScreen() {
  const theme = useTheme();
  const isAnalyzing = useCrisisStore((s: any) => s.isAnalyzing);
  const currentLocation = useCrisisStore((s: any) => s.currentLocation);
  const finalSummary = useCrisisStore((s: any) => s.finalSummary);
  const activeCrises = useCrisisStore((s: any) => s.activeCrises) ?? EMPTY_CRISES;
  const hasResult = !!finalSummary || activeCrises.length > 0;

  const handleRunAnalysis = useCallback(async () => {
    tapHaptic();
    if (!currentLocation) {
      errorHaptic();
      Alert.alert('Location Required', 'Select a province, city, and district before running analysis.');
      return;
    }
    try {
      await antigravity.runFullPipeline();
      successHaptic();
    } catch (err: any) {
      errorHaptic();
      Alert.alert('Analysis Failed', String(err?.message ?? err));
    }
  }, [currentLocation]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={styles.scrollContent}>
      <ProvincePicker />

      {hasResult ? (
        <>
          <HeroDRICard />
          <ActionCard />
          <MessagePreviewCard />
        </>
      ) : (
        <EmptyHero />
      )}

      <View style={styles.scanBtnContainer}>
        {!isAnalyzing && currentLocation && (
          <MotiView
            from={{ opacity: 0.5, scale: 0.98 }}
            animate={{ opacity: 0, scale: 1.06 }}
            transition={{ type: 'timing', duration: 1800, loop: true, repeatReverse: false, easing: Easing.out(Easing.cubic) }}
            style={styles.scanBtnRing}
          />
        )}
        <TouchableOpacity onPress={handleRunAnalysis} disabled={isAnalyzing || !currentLocation} activeOpacity={0.85}>
          <LinearGradient
            colors={isAnalyzing ? ['#2D394D', '#141A26'] : ['#107BFF', '#0056B3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scanBtnGradient}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="shield-checkmark" size={20} color="white" />
            )}
            <Text style={styles.scanBtnText}>
              {isAnalyzing
                ? 'ANALYSIS IN PROGRESS…'
                : !currentLocation
                  ? 'CONFIGURE LOCATION'
                  : hasResult
                    ? 'RE-RUN SYSTEM SCAN'
                    : 'EXECUTE SYSTEM SCAN'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 12, paddingBottom: 120 },
  scanBtnContainer: { marginHorizontal: 12, marginTop: 16, position: 'relative' },
  scanBtnRing: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 18, borderWidth: 2, borderColor: '#107BFF' },
  scanBtnGradient: { paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 16, overflow: 'hidden', elevation: 8, shadowColor: '#107BFF', shadowOpacity: 0.4, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } },
  scanBtnText: { color: 'white', fontSize: 14, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1.5 },
});
