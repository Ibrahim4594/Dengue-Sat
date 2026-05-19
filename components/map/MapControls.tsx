import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { Moon, Sun, Crosshair, StackSimple, Flame } from 'phosphor-react-native';

interface Props {
  mode: 'dark' | 'light';
  onToggleMode: () => void;
  onRecenter: () => void;
  layersOpen: boolean;
  onToggleLayers: () => void;
  heatmapOn: boolean;
  onToggleHeatmap: () => void;
}

export function MapControls({ mode, onToggleMode, onRecenter, layersOpen, onToggleLayers, heatmapOn, onToggleHeatmap }: Props) {
  const fabBg = mode === 'dark' ? 'rgba(11,15,23,0.92)' : 'rgba(255,255,255,0.96)';
  const border = mode === 'dark' ? '#232D3F' : '#DCE3EE';
  const iconColor = mode === 'dark' ? '#FFFFFF' : '#1A2536';

  return (
    <MotiView
      from={{ opacity: 0, translateX: 12 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={styles.stack}
    >
      <Pressable
        onPress={onToggleMode}
        style={[styles.fab, { backgroundColor: fabBg, borderColor: border }]}
        accessibilityRole="button"
        accessibilityLabel={mode === 'dark' ? 'Switch to light map' : 'Switch to dark map'}
      >
        {mode === 'dark'
          ? <Sun size={18} color="#FFD600" weight="fill" />
          : <Moon size={18} color="#107BFF" weight="fill" />}
      </Pressable>
      <Pressable onPress={onRecenter} style={[styles.fab, { backgroundColor: fabBg, borderColor: border }]} accessibilityRole="button" accessibilityLabel="Recenter map">
        <Crosshair size={18} color="#107BFF" weight="bold" />
      </Pressable>
      <Pressable onPress={onToggleLayers} style={[styles.fab, { backgroundColor: fabBg, borderWidth: layersOpen ? 2 : 1, borderColor: layersOpen ? '#107BFF' : border }]} accessibilityRole="button" accessibilityLabel={layersOpen ? 'Hide hospital markers' : 'Show hospital markers'}>
        <StackSimple size={18} color={iconColor} weight={layersOpen ? 'fill' : 'bold'} />
      </Pressable>
      <Pressable onPress={onToggleHeatmap} style={[styles.fab, { backgroundColor: fabBg, borderWidth: heatmapOn ? 2 : 1, borderColor: heatmapOn ? '#FF5C75' : border }]} accessibilityRole="button" accessibilityLabel={heatmapOn ? 'Hide heatmap' : 'Show heatmap'}>
        <Flame size={18} color={heatmapOn ? '#FF5C75' : iconColor} weight={heatmapOn ? 'fill' : 'bold'} />
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  stack: { position: 'absolute', right: 14, top: 14, gap: 10 },
  fab: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
});
