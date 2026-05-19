// components/CitizenReportForm.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Image, ScrollView, TextInput } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { callVision } from '../lib/agent-client';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { v4 as uuid } from 'uuid';
import { SvgXml } from 'react-native-svg';
import { medicine } from '../assets/illustrations';

export function CitizenReportForm() {
  const theme = useTheme();
  const [image, setImage] = useState<{ uri: string; base64: string } | null>(null);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<any>(null);
  const currentLocation = useCrisisStore((s: any) => s.currentLocation);
  const addCitizenReport = useCrisisStore((s: any) => s.addCitizenReport);
  const selectedDistrict = (currentLocation as any)?.district ?? null;
  const styles = makeStyles(theme);

  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5, base64: true });
    if (r.canceled || !r.assets[0]) return;
    const base64 = r.assets[0].base64;
    if (!base64) {
      console.warn('[CitizenReportForm] picker returned no base64');
      setSubmitted({ error: 'Image format not supported. Try a JPG/PNG.' });
      return;
    }
    setImage({ uri: r.assets[0].uri, base64 });
  };

  const submit = async () => {
    if (!image || !text.trim()) return;
    setSubmitting(true);
    try {
      const r = await callVision((image.base64 ?? '').replace(/^data:image\/\w+;base64,/, ''), text, selectedDistrict ?? {});
      addCitizenReport({
        id: uuid(),
        timestamp: Date.now(),
        photoBase64: image.base64,
        text,
        location: selectedDistrict ?? { lat: 0, lng: 0, district: 'unknown' },
        visionResult: { riskScore: r.riskScore, breedingLikelihood: r.breedingLikelihood, recommendation: r.recommendation },
        accepted: r.accepted ?? true,
      });
      setSubmitted(r);
    } catch (e) {
      setSubmitted({ error: String(e) });
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <Surface style={styles.card}>
        <Text style={styles.title}>Report Submitted</Text>
        {submitted.error ? (
          <Text style={styles.body}>Error: {submitted.error}</Text>
        ) : (
          <>
            <Text style={styles.body}>Risk score: {submitted.riskScore}/100</Text>
            <Text style={styles.body}>Likelihood: {submitted.breedingLikelihood}</Text>
            <Text style={styles.body}>{submitted.recommendation}</Text>
          </>
        )}
        <Pressable onPress={() => { setImage(null); setText(''); setSubmitted(null); }} style={styles.btn}>
          <Text style={styles.btnText}>Submit Another</Text>
        </Pressable>
      </Surface>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={{ alignItems: 'center', paddingVertical: 12 }}>
        <SvgXml xml={medicine} width={200} height={150} />
      </View>
      <Surface style={styles.card}>
        <Text style={styles.title}>Report a Breeding Site</Text>
        <Text style={{ color: '#A0AEC0', fontSize: 13, marginBottom: 14, lineHeight: 19 }}>
          Spotted stagnant water or mosquitoes? Submit a photo and brief description. Antigravity Vision analyzes the image.
        </Text>
        <Pressable onPress={pickImage} style={styles.imagePicker}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.thumb} />
          ) : (
            <Text style={styles.imagePickerText}>📸 Tap to select photo</Text>
          )}
        </Pressable>
        <TextInput
          placeholder="Describe what you see (e.g., 'stagnant water in plot, mosquitoes everywhere')"
          value={text}
          onChangeText={setText}
          style={styles.input}
          multiline
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />
        <Pressable onPress={submit} disabled={!image || !text.trim() || submitting} style={[styles.btn, (!image || !text.trim() || submitting) && styles.btnDisabled]}>
          <Text style={styles.btnText}>{submitting ? 'Analyzing…' : 'Submit Report'}</Text>
        </Pressable>
      </Surface>
    </ScrollView>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1, padding: 12 },
    card: { padding: 16, borderRadius: 12, backgroundColor: theme.colors.surface, elevation: 1 },
    title: { fontSize: 18, fontWeight: '700', color: theme.colors.onSurface, marginBottom: 12 },
    body: { fontSize: 14, color: theme.colors.onSurface, marginBottom: 6 },
    imagePicker: { height: 180, borderRadius: 8, borderWidth: 2, borderColor: theme.colors.outline, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    imagePickerText: { color: theme.colors.onSurfaceVariant, fontSize: 14 },
    thumb: { width: '100%', height: '100%', borderRadius: 8 },
    input: { borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 8, padding: 10, minHeight: 80, color: theme.colors.onSurface, marginBottom: 12 },
    btn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: theme.colors.primary, alignItems: 'center' },
    btnDisabled: { opacity: 0.5 },
    btnText: { color: '#fff', fontWeight: '600' },
  });
}
