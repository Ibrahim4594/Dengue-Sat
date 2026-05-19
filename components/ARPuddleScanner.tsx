// components/ARPuddleScanner.tsx
import React, { useState, useRef } from 'react';
import { View, StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { callVision } from '../lib/agent-client';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { v4 as uuid } from 'uuid';
import { SvgXml } from 'react-native-svg';
import { checklist } from '../assets/illustrations';

export function ARPuddleScanner() {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const currentLocation = useCrisisStore((s: any) => s.currentLocation);
  const addCitizenReport = useCrisisStore((s: any) => s.addCitizenReport);
  const selectedDistrict = (currentLocation as any)?.district ?? null;
  const styles = makeStyles(theme);

  if (!permission) return <Text>Loading…</Text>;
  if (!permission.granted) {
    return (
      <Surface style={styles.card}>
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <SvgXml xml={checklist} width={180} height={140} />
        </View>
        <Text style={styles.title}>Camera Permission Required</Text>
        <Text style={styles.body}>Scanner needs camera access to analyze breeding sites.</Text>
        <Pressable style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </Pressable>
      </Surface>
    );
  }

  const capture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
    setPhotoUri(photo.uri);
    setAnalyzing(true);
    try {
      const r = await callVision(
        (photo.base64 ?? '').replace(/^data:image\/\w+;base64,/, ''),
        'Citizen-captured potential breeding site',
        selectedDistrict ? { lat: selectedDistrict.lat, lng: selectedDistrict.lng, district: selectedDistrict.name } : {},
      );
      setResult(r);
      addCitizenReport({
        id: uuid(),
        timestamp: Date.now(),
        photoBase64: photo.base64,
        text: 'AR scanner capture',
        location: selectedDistrict ?? { lat: 0, lng: 0, district: 'unknown' },
        visionResult: { riskScore: r.riskScore, breedingLikelihood: r.breedingLikelihood, recommendation: r.recommendation },
        accepted: r.accepted ?? true,
      });
    } catch (e) {
      setResult({ error: String(e) });
    }
    setAnalyzing(false);
  };

  if (photoUri) {
    return (
      <View style={styles.resultContainer}>
        <Image source={{ uri: photoUri }} style={styles.preview} />
        {analyzing && <ActivityIndicator size="large" color={theme.colors.primary} />}
        {result && !analyzing && (
          <Surface style={styles.resultCard}>
            <Text style={styles.resultLabel}>BREEDING RISK</Text>
            <Text style={[styles.resultScore, { color: result.riskScore > 70 ? '#ef4444' : result.riskScore > 40 ? '#f59e0b' : '#10b981' }]}>
              {result.riskScore}/100
            </Text>
            <Text style={styles.resultLikelihood}>{result.breedingLikelihood?.toUpperCase()}</Text>
            <Text style={styles.resultRec}>{result.recommendation}</Text>
            <Pressable onPress={() => { setPhotoUri(null); setResult(null); }} style={styles.btn}>
              <Text style={styles.btnText}>Scan Again</Text>
            </Pressable>
          </Surface>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.overlay}>
          <Text style={styles.hint}>Point at puddles, garbage, standing water</Text>
        </View>
        <Pressable onPress={capture} style={styles.shutter}>
          <Ionicons name="radio-button-on" size={72} color="#fff" />
        </Pressable>
      </CameraView>
    </View>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    camera: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
    overlay: { position: 'absolute', top: 40, left: 0, right: 0, alignItems: 'center' },
    hint: { color: '#fff', fontSize: 14, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    shutter: { marginBottom: 40 },
    resultContainer: { flex: 1, padding: 16 },
    preview: { width: '100%', height: 280, borderRadius: 12 },
    resultCard: { padding: 16, marginTop: 16, borderRadius: 12, backgroundColor: theme.colors.surface, alignItems: 'center' },
    resultLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: theme.colors.onSurfaceVariant },
    resultScore: { fontSize: 48, fontWeight: '900', marginVertical: 4 },
    resultLikelihood: { fontSize: 14, fontWeight: '700', color: theme.colors.onSurface, marginBottom: 8 },
    resultRec: { fontSize: 14, color: theme.colors.onSurface, textAlign: 'center', lineHeight: 20 },
    card: { padding: 16, margin: 16, borderRadius: 12, backgroundColor: theme.colors.surface },
    title: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: theme.colors.onSurface },
    body: { fontSize: 14, color: theme.colors.onSurfaceVariant, marginBottom: 12 },
    btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: theme.colors.primary, alignItems: 'center', marginTop: 10 },
    btnText: { color: '#fff', fontWeight: '600' },
  });
}
