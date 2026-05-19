import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { CaretRight, MapPin, Hospital, Virus, Bed } from 'phosphor-react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { PROVINCES } from '../constants/provinces';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { Province, City } from '../lib/types';
import { selectionHaptic, successHaptic } from '../lib/haptics';
import { fetchHospitals } from '../lib/api/firebase-rtdb';

type Step = 'province' | 'city' | 'district';

type CityLive = { admissions: number; beds: number; platelets: number; hospitalCount: number };

export function ProvincePicker() {
  const theme = useTheme();
  const currentLocation = useCrisisStore((s: any) => s.currentLocation);
  const setLocation = useCrisisStore((s: any) => s.setLocation);

  const sheetRef = useRef<BottomSheetModal>(null);
  const [step, setStep] = useState<Step>('province');
  const [pendingProvince, setPendingProvince] = useState<Province | null>(null);
  const [pendingCity, setPendingCity] = useState<City | null>(null);
  const [liveByCity, setLiveByCity] = useState<Record<string, CityLive>>({});
  const [loadingLive, setLoadingLive] = useState(false);

  const snapPoints = useMemo(() => ['60%', '92%'], []);
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const liveCacheRef = useRef<Record<string, Record<string, CityLive>>>({});

  const open = useCallback(() => {
    selectionHaptic();
    setStep('province');
    setPendingProvince(currentLocation?.province ?? null);
    setPendingCity(currentLocation?.city ?? null);
    sheetRef.current?.present();
  }, [currentLocation]);

  const close = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />,
    [],
  );

  // Live fetch hospital aggregates from Firebase RTDB — deferred + cached + only when on city step.
  useEffect(() => {
    if (!pendingProvince || step !== 'city') return;
    const provId = pendingProvince.id;
    const cached = liveCacheRef.current[provId];
    if (cached) {
      setLiveByCity(cached);
      setLoadingLive(false);
      return;
    }
    let cancelled = false;
    setLiveByCity({});
    setLoadingLive(true);
    // Defer past current frame so sheet animation finishes first — kills UI stutter.
    const handle = setTimeout(async () => {
      const results: Record<string, CityLive> = {};
      await Promise.all(
        pendingProvince.cities.map(async (c) => {
          try {
            const hospitals = await fetchHospitals(c.id);
            if (!Array.isArray(hospitals) || hospitals.length === 0) return;
            const agg = hospitals.reduce(
              (acc: CityLive, h: any) => ({
                admissions: acc.admissions + (h.dengueAdmissions24h ?? 0),
                beds: acc.beds + (h.totalBeds ?? 0),
                platelets: acc.platelets + (h.platelets ?? 0),
                hospitalCount: acc.hospitalCount + 1,
              }),
              { admissions: 0, beds: 0, platelets: 0, hospitalCount: 0 },
            );
            results[c.id] = agg;
          } catch (e) {
            console.warn('[ProvincePicker] live fetch failed for', c.id, e);
          }
        }),
      );
      if (!cancelled) {
        liveCacheRef.current[provId] = results;
        setLiveByCity(results);
        setLoadingLive(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [pendingProvince, step]);

  return (
    <>
      <Pressable onPress={open}>
        <Surface style={styles.summarySurface}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconBox}>
              <MapPin size={18} color={theme.colors.primary} weight="duotone" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>LOCATION</Text>
              {currentLocation ? (
                <>
                  <Text style={styles.summaryValue}>
                    {currentLocation.province.name} → {currentLocation.city.name} → {currentLocation.district.name}
                  </Text>
                  <Text style={styles.summaryValueUrdu}>
                    {currentLocation.district.nameUrdu}
                  </Text>
                </>
              ) : (
                <Text style={[styles.summaryValue, { color: theme.colors.onSurfaceVariant }]}>
                  Tap to select province / city / district
                </Text>
              )}
            </View>
            <CaretRight size={16} color={theme.colors.onSurfaceVariant} weight="bold" />
          </View>
        </Surface>
      </Pressable>

      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: theme.colors.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.outline }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          {step === 'province' && (
            <>
              <Text style={styles.sheetTitle}>Select Province</Text>
              <Text style={styles.sheetSub}>Pakistan — live data from Firebase RTDB</Text>
              {PROVINCES.map(p => (
                <Pressable
                  key={p.id}
                  onPress={() => { selectionHaptic(); setPendingProvince(p); setStep('city'); }}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowEng}>{p.name}</Text>
                    <Text style={styles.rowUrdu}>{p.nameUrdu}</Text>
                  </View>
                  <Text style={styles.rowCount}>{p.cities.length} cities</Text>
                  <CaretRight size={14} color={theme.colors.onSurfaceVariant} />
                </Pressable>
              ))}
            </>
          )}

          {step === 'city' && pendingProvince && (
            <>
              <Pressable onPress={() => { selectionHaptic(); setStep('province'); }} style={styles.backRow}>
                <CaretRight size={14} color={theme.colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />
                <Text style={styles.backText}>{pendingProvince.name}</Text>
              </Pressable>
              <View style={styles.titleRow}>
                <Text style={styles.sheetTitle}>Select City</Text>
                {loadingLive ? (
                  <View style={styles.liveBadge}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                ) : (
                  <View style={[styles.liveBadge, { backgroundColor: theme.colors.secondaryContainer }]}>
                    <View style={[styles.liveDot, { backgroundColor: theme.colors.secondary }]} />
                    <Text style={styles.liveBadgeText}>LIVE • RTDB</Text>
                  </View>
                )}
              </View>
              {pendingProvince.cities.map(c => {
                const live = liveByCity[c.id];
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => { selectionHaptic(); setPendingCity(c); setStep('district'); }}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowEng}>{c.name}</Text>
                      <Text style={styles.rowUrdu}>{c.nameUrdu}</Text>
                      {live && (
                        <View style={styles.liveStatsRow}>
                          <View style={styles.liveStatRow}>
                            <Hospital size={11} color={theme.colors.onSurfaceVariant} weight="bold" />
                            <Text style={styles.liveStat}>{live.hospitalCount}</Text>
                          </View>
                          <View style={styles.liveStatRow}>
                            <Virus size={11} color="#FF5C75" weight="bold" />
                            <Text style={[styles.liveStat, { color: '#FF5C75' }]}>{live.admissions} cases</Text>
                          </View>
                          <View style={styles.liveStatRow}>
                            <Bed size={11} color={theme.colors.onSurfaceVariant} weight="bold" />
                            <Text style={styles.liveStat}>{live.beds}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                    <Text style={styles.rowCount}>{c.population.toLocaleString()}</Text>
                    <CaretRight size={14} color={theme.colors.onSurfaceVariant} />
                  </Pressable>
                );
              })}
            </>
          )}

          {step === 'district' && pendingProvince && pendingCity && (
            <>
              <Pressable onPress={() => { selectionHaptic(); setStep('city'); }} style={styles.backRow}>
                <CaretRight size={14} color={theme.colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />
                <Text style={styles.backText}>{pendingCity.name}</Text>
              </Pressable>
              <Text style={styles.sheetTitle}>Select District</Text>
              {liveByCity[pendingCity.id] && (
                <Text style={styles.cityLiveStat}>
                  Live: {liveByCity[pendingCity.id].admissions} active dengue admissions across {liveByCity[pendingCity.id].hospitalCount} hospitals
                </Text>
              )}
              {pendingCity.districts.map(d => (
                <Pressable
                  key={d.id}
                  onPress={() => {
                    successHaptic();
                    setLocation({ province: pendingProvince, city: pendingCity, district: d });
                    close();
                  }}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowEng}>{d.name}</Text>
                    <Text style={styles.rowUrdu}>{d.nameUrdu}</Text>
                  </View>
                  <Text style={styles.rowCount}>{d.population.toLocaleString()}</Text>
                </Pressable>
              ))}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    summarySurface: { padding: 16, marginHorizontal: 12, marginVertical: 8, borderRadius: 18, backgroundColor: theme.colors.surface, elevation: 6, borderWidth: 1, borderColor: theme.colors.outline, shadowColor: theme.colors.primary, shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    summaryIconBox: { width: 46, height: 46, borderRadius: 14, backgroundColor: theme.colors.primaryContainer, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.primary + '40' },
    summaryLabel: { fontSize: 11, fontWeight: '800', color: theme.colors.onSurface, letterSpacing: 1.2, marginBottom: 4 },
    summaryValue: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },
    summaryValueUrdu: { fontSize: 13, fontWeight: '500', color: theme.colors.onSurfaceVariant, marginTop: 4 },

    sheetContent: { paddingHorizontal: 20, paddingBottom: 60 },
    sheetTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.onSurface, marginBottom: 6 },
    sheetSub: { fontSize: 14, color: theme.colors.onSurfaceVariant, marginBottom: 20, fontWeight: '500' },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: theme.colors.primaryContainer },
    liveBadgeText: { fontSize: 10, fontWeight: '900', color: theme.colors.primary, letterSpacing: 1 },
    liveDot: { width: 6, height: 6, borderRadius: 3 },
    liveStatsRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
    liveStatRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    liveStat: { fontSize: 11, fontWeight: '700', color: theme.colors.onSurfaceVariant },
    cityLiveStat: { fontSize: 12, color: theme.colors.secondary, fontWeight: '600', marginBottom: 14, fontStyle: 'italic' },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderRadius: 14, gap: 14, marginBottom: 10, backgroundColor: theme.colors.surfaceVariant, borderWidth: 1, borderColor: theme.colors.outline },
    rowPressed: { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primary },
    rowEng: { fontSize: 17, fontWeight: '700', color: theme.colors.onSurface },
    rowUrdu: { fontSize: 14, color: theme.colors.onSurfaceVariant, marginTop: 4, fontWeight: '500' },
    rowCount: { fontSize: 12, color: theme.colors.primary, fontWeight: '700' },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingVertical: 6 },
    backText: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },
  });
}
