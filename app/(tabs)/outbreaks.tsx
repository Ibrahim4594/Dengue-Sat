import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Card, Text, Surface, Badge, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { MapTrifold, Warning, Buildings, ShieldCheck, Globe, Crosshair, Stack } from 'phosphor-react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { useCrisisStore } from '../../hooks/useCrisisStore';
import { cities } from '../../constants/cities';
import { fetchHospitals } from '../../lib/api/firebase-rtdb';
import { DARK_MAP_STYLE, LIGHT_MAP_STYLE } from '../../lib/map-style';
import { CrisisMarker } from '../../components/map/CrisisMarker';
import { HospitalMarker } from '../../components/map/HospitalMarker';
import { MapLegend } from '../../components/map/MapLegend';
import { MapControls } from '../../components/map/MapControls';
import { MapStatsBar } from '../../components/map/MapStatsBar';
import RecoveryScreen from './recovery';

// Platform-resolved shim — Metro picks native-map.web.ts on web, native-map.ts on native.
import { MapView, Marker, MapCircle, Heatmap, PROVIDER_GOOGLE } from '../../lib/native-map';

const SEVERITY_FILL: Record<string, string> = {
  CRITICAL: 'rgba(255, 92, 117, 0.20)',
  HIGH: 'rgba(255, 138, 0, 0.18)',
  MODERATE: 'rgba(255, 214, 0, 0.14)',
  LOW: 'rgba(0, 230, 118, 0.10)',
};
const SEVERITY_STROKE: Record<string, string> = {
  CRITICAL: '#FF5C75',
  HIGH: '#FF8A00',
  MODERATE: '#FFD600',
  LOW: '#00E676',
};

export default function OutbreaksScreen() {
  const [mode, setMode] = useState<'map' | 'recovery'>('map');
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('dark');
  const [showHospitals, setShowHospitals] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const mapRef = React.useRef<any>(null);
  const theme = useTheme();
  const { activeCrises, selectedCity } = useCrisisStore();
  const currentLocation = useCrisisStore((s: any) => s.currentLocation);
  const fusedSignal = useCrisisStore((s: any) => s.fusedSignal);
  const currentCity = cities.find(c => c.id === selectedCity);

  const [liveHospitals, setLiveHospitals] = useState<any[]>([]);

  // Auto-fit camera to crises + hospitals when data arrives.
  useEffect(() => {
    if (!mapRef.current) return;
    const coords = [
      ...activeCrises.map((c: any) => ({ latitude: c.location.latitude, longitude: c.location.longitude })),
      ...liveHospitals.map((h: any) => ({ latitude: h.lat, longitude: h.lng })),
    ].filter(c => typeof c.latitude === 'number' && typeof c.longitude === 'number');
    if (coords.length === 0) return;
    const t = setTimeout(() => {
      try {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 90, right: 80, bottom: 220, left: 80 },
          animated: true,
        });
      } catch (e) {
        console.warn('[outbreaks] fitToCoordinates failed', e);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [activeCrises.length, liveHospitals.length]);
  useEffect(() => {
    const cityId = currentLocation?.city?.id ?? selectedCity ?? 'karachi';
    let cancelled = false;
    (async () => {
      try {
        const hospitals = await fetchHospitals(cityId);
        if (cancelled || !Array.isArray(hospitals)) return;
        const filtered = hospitals.filter(h => h && typeof h.lat === 'number' && typeof h.lng === 'number');
        setLiveHospitals(filtered);
      } catch (e) {
        console.warn('[outbreaks] fetchHospitals failed', e);
      }
    })();
    return () => { cancelled = true; };
  }, [currentLocation?.city?.id, selectedCity]);

  const cityCoord = currentLocation
    ? { latitude: currentLocation.city.lat, longitude: currentLocation.city.lng }
    : currentCity
    ? { latitude: currentCity.latitude, longitude: currentCity.longitude }
    : { latitude: 24.8607, longitude: 67.0011 };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flexDirection: 'row', backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.outline }}>
        <TouchableOpacity
          onPress={() => setMode('map')}
          style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomColor: mode === 'map' ? theme.colors.primary : 'transparent', borderBottomWidth: mode === 'map' ? 2 : 0 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Globe size={16} color={mode === 'map' ? theme.colors.primary : theme.colors.onSurfaceVariant} weight={mode === 'map' ? 'fill' : 'bold'} />
            <Text style={{ fontWeight: '700', fontSize: 12, letterSpacing: 1, color: mode === 'map' ? theme.colors.primary : theme.colors.onSurfaceVariant }}>LIVE MAP</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMode('recovery')}
          style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomColor: mode === 'recovery' ? theme.colors.primary : 'transparent', borderBottomWidth: mode === 'recovery' ? 2 : 0 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} color={mode === 'recovery' ? theme.colors.primary : theme.colors.onSurfaceVariant} weight={mode === 'recovery' ? 'fill' : 'bold'} />
            <Text style={{ fontWeight: '700', fontSize: 12, letterSpacing: 1, color: mode === 'recovery' ? theme.colors.primary : theme.colors.onSurfaceVariant }}>RECOVERY</Text>
          </View>
        </TouchableOpacity>
      </View>

      {mode === 'recovery' ? (
        <RecoveryScreen />
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: mapTheme === 'dark' ? '#0B0F17' : '#F4F6FA' }}>
            <View style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
              {MapView && (
                <MapView
                  ref={mapRef}
                  provider={PROVIDER_GOOGLE}
                  customMapStyle={mapTheme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
                  style={{ flex: 1 }}
                  initialRegion={{
                    latitude: cityCoord.latitude,
                    longitude: cityCoord.longitude,
                    latitudeDelta: 0.15,
                    longitudeDelta: 0.15,
                  }}
                  showsUserLocation={false}
                  showsCompass={false}
                  showsScale={false}
                  showsPointsOfInterest={false}
                  toolbarEnabled={false}
                >
                  <Marker
                    coordinate={cityCoord}
                    title={currentLocation?.city?.name ?? currentCity?.name ?? 'Karachi'}
                    description={currentLocation?.province?.name ?? currentCity?.province ?? 'Sindh'}
                    pinColor={theme.colors.primary}
                  />
                  {showHeatmap && activeCrises.length > 0 && (
                    <Heatmap
                      points={activeCrises.map((c: any) => ({
                        latitude: c.location.latitude,
                        longitude: c.location.longitude,
                        weight: Math.max(1, (c.dri?.score ?? 0) / 10),
                      }))}
                      radius={50}
                      opacity={0.75}
                      gradient={{
                        colors: ['#107BFF', '#00E676', '#FFD600', '#FF8A00', '#FF5C75'],
                        startPoints: [0.1, 0.3, 0.5, 0.7, 0.9],
                        colorMapSize: 256,
                      }}
                    />
                  )}
                  {showHospitals && liveHospitals.map((h: any, i: number) => (
                    <HospitalMarker
                      key={`hospital-${h.id ?? i}`}
                      latitude={h.lat}
                      longitude={h.lng}
                      name={h.name ?? `Hospital ${i + 1}`}
                      beds={h.totalBeds}
                      admissions={h.dengueAdmissions24h}
                      platelets={h.platelets}
                    />
                  ))}
                  {activeCrises.map((crisis, idx) => {
                    const sev = String(crisis.dri?.severity ?? 'MODERATE').toUpperCase();
                    return (
                      <React.Fragment key={`crisis-${crisis.id ?? idx}`}>
                        <MapCircle
                          center={{ latitude: crisis.location.latitude, longitude: crisis.location.longitude }}
                          radius={(crisis.location.radiusKm ?? 3) * 1000}
                          fillColor={SEVERITY_FILL[sev] ?? SEVERITY_FILL.MODERATE}
                          strokeColor={SEVERITY_STROKE[sev] ?? SEVERITY_STROKE.MODERATE}
                          strokeWidth={2}
                        />
                        <CrisisMarker
                          latitude={crisis.location.latitude}
                          longitude={crisis.location.longitude}
                          severity={sev}
                          driScore={crisis.dri?.score ?? 0}
                          district={crisis.location.district ?? '—'}
                          populationAtRisk={crisis.populationAtRisk ?? 0}
                          reasoning={crisis.dri?.reasoning}
                        />
                      </React.Fragment>
                    );
                  })}
                </MapView>
              )}
            </View>

            <MapStatsBar
              city={currentLocation?.city?.name ?? currentCity?.name ?? 'Karachi'}
              district={currentLocation?.district?.name ?? '—'}
              crisisCount={activeCrises.length}
              hospitalCount={liveHospitals.length}
              isDark={mapTheme === 'dark'}
            />
            <MapLegend crisisCount={activeCrises.length} hospitalCount={liveHospitals.length} />
            <MapControls
              mode={mapTheme}
              onToggleMode={() => setMapTheme(t => t === 'dark' ? 'light' : 'dark')}
              onRecenter={() => mapRef.current?.animateToRegion({
                latitude: cityCoord.latitude,
                longitude: cityCoord.longitude,
                latitudeDelta: 0.15,
                longitudeDelta: 0.15,
              }, 600)}
              layersOpen={showHospitals}
              onToggleLayers={() => setShowHospitals(s => !s)}
              heatmapOn={showHeatmap}
              onToggleHeatmap={() => setShowHeatmap(s => !s)}
            />

          </View>

          {fusedSignal && (
            <Surface style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }} elevation={4}>
              <View style={{ width: 40, height: 4, backgroundColor: theme.colors.outlineVariant, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text variant="titleMedium" style={{ fontSize: 16 }}>Live Environmental Read</Text>
                <Badge style={{ backgroundColor: theme.colors.secondaryContainer }} size={20}>LIVE</Badge>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Card mode="elevated" style={{ marginRight: 24 }} contentStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                  <Text variant="labelSmall" style={{ fontSize: 8, color: theme.colors.onSurfaceVariant, marginBottom: 2 }}>PRECIPITATION</Text>
                  <Text variant="headlineSmall" style={{ fontSize: 16, fontWeight: '800' }}>
                    {(fusedSignal.weather?.precipitation ?? 0).toFixed(1)}mm
                  </Text>
                </Card>
                <Card mode="elevated" style={{ marginRight: 24 }} contentStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                  <Text variant="labelSmall" style={{ fontSize: 8, color: theme.colors.onSurfaceVariant, marginBottom: 2 }}>HUMIDITY</Text>
                  <Text variant="headlineSmall" style={{ fontSize: 16, fontWeight: '800' }}>
                    {(fusedSignal.weather?.humidity ?? 0).toFixed(0)}%
                  </Text>
                </Card>
                <Card mode="elevated" style={{ marginRight: 24 }} contentStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                  <Text variant="labelSmall" style={{ fontSize: 8, color: theme.colors.onSurfaceVariant, marginBottom: 2 }}>TEMP</Text>
                  <Text variant="headlineSmall" style={{ fontSize: 16, fontWeight: '800' }}>
                    {(fusedSignal.weather?.temperature ?? 0).toFixed(0)}°C
                  </Text>
                </Card>
              </ScrollView>
            </Surface>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, marginBottom: 16, borderRadius: 12, elevation: 1 },
  bannerTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  bannerBody: { fontSize: 12, lineHeight: 17 },
  card: { padding: 14, marginBottom: 12, borderRadius: 12, elevation: 1 },
  cardLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 4 },
  cardTitle: { fontSize: 18, fontFamily: 'Sora_700Bold', marginBottom: 2 },
  cardSub: { fontSize: 13, marginBottom: 6 },
  cardCoord: { fontSize: 11, fontFamily: 'monospace' },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', letterSpacing: 0.5, marginTop: 14, marginBottom: 8 },
  empty: { padding: 20, borderRadius: 12, alignItems: 'center' },
  emptyText: { fontSize: 13, textAlign: 'center' },
  crisisCard: { padding: 12, marginBottom: 8, borderRadius: 10, elevation: 1 },
  crisisHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  crisisType: { flex: 1, fontSize: 14, fontFamily: 'Inter_700Bold' },
  driBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  driText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_800ExtraBold' },
  crisisLoc: { fontSize: 12 },
  hospitalCard: { padding: 12, borderRadius: 12, elevation: 1, gap: 10 },
  hospitalRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hospitalName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  hospitalUrdu: { fontSize: 12 },
  hospitalStat: { fontSize: 12, fontFamily: 'Inter_500Medium' },
});
