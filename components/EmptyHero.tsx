import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { MotiView } from 'moti';
import Svg, { Circle, Path, Defs, RadialGradient, Stop, G, Line, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { Easing } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const SIZE = Math.min(width - 48, 300);

export function EmptyHero() {
  return (
    <View style={styles.container}>
      <View style={[styles.radarBox, { width: SIZE, height: SIZE }]}>
        {/* Outer concentric pulse rings */}
        {[0, 1, 2].map(i => (
          <MotiView
            key={`pulse-${i}`}
            from={{ opacity: 0.5, scale: 0.45 }}
            animate={{ opacity: 0, scale: 1.05 }}
            transition={{ type: 'timing', duration: 2600, delay: i * 850, loop: true, repeatReverse: false, easing: Easing.out(Easing.cubic) }}
            style={[styles.pulse, { width: SIZE, height: SIZE, borderRadius: SIZE / 2 }]}
          />
        ))}

        {/* Static radar dish */}
        <Svg width={SIZE} height={SIZE} viewBox="0 0 300 300" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="rGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#107BFF" stopOpacity="0.18" />
              <Stop offset="65%" stopColor="#107BFF" stopOpacity="0.04" />
              <Stop offset="100%" stopColor="#107BFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Glow backdrop */}
          <Circle cx={150} cy={150} r={140} fill="url(#rGlow)" />

          {/* Concentric radar rings */}
          <Circle cx={150} cy={150} r={130} stroke="#1E2A3D" strokeWidth={1} fill="none" />
          <Circle cx={150} cy={150} r={100} stroke="#1E2A3D" strokeWidth={1} fill="none" strokeDasharray="3 4" />
          <Circle cx={150} cy={150} r={70} stroke="#1E2A3D" strokeWidth={1} fill="none" />
          <Circle cx={150} cy={150} r={40} stroke="#1E2A3D" strokeWidth={1} fill="none" strokeDasharray="3 4" />
          <Circle cx={150} cy={150} r={6} fill="#107BFF" />

          {/* Crosshair lines */}
          <Line x1={150} y1={20} x2={150} y2={280} stroke="#1E2A3D" strokeWidth={1} />
          <Line x1={20} y1={150} x2={280} y2={150} stroke="#1E2A3D" strokeWidth={1} />
          {/* Diagonal axes */}
          <Line x1={58} y1={58} x2={242} y2={242} stroke="#1E2A3D" strokeWidth={0.5} opacity={0.5} />
          <Line x1={242} y1={58} x2={58} y2={242} stroke="#1E2A3D" strokeWidth={0.5} opacity={0.5} />

          {/* Pakistan-shaped blob, low opacity */}
          <Path
            d="M 120 90 Q 140 82 158 92 Q 178 100 188 122 Q 196 138 192 158 Q 196 180 184 196 Q 168 215 145 218 Q 122 220 110 200 Q 100 184 102 162 Q 98 138 108 118 Q 112 102 120 90 Z"
            fill="#107BFF"
            fillOpacity={0.12}
            stroke="#107BFF"
            strokeWidth={1}
            strokeOpacity={0.55}
          />

          {/* Karachi-ish hotspot dot (red target) */}
          <Circle cx={140} cy={195} r={5} fill="#FF5C75" />
          <Circle cx={140} cy={195} r={11} stroke="#FF5C75" strokeWidth={1.4} fill="none" opacity={0.55} />
          <Circle cx={140} cy={195} r={18} stroke="#FF5C75" strokeWidth={0.8} fill="none" opacity={0.3} />
        </Svg>

        {/* Sweeping radar arm — rotating MotiView with gradient triangle */}
        <MotiView
          from={{ rotate: '0deg' }}
          animate={{ rotate: '360deg' }}
          transition={{ type: 'timing', duration: 4200, loop: true, repeatReverse: false, easing: Easing.linear }}
          style={[styles.sweepWrap, { width: SIZE, height: SIZE }]}
        >
          <Svg width={SIZE} height={SIZE} viewBox="0 0 300 300">
            <Defs>
              {/* Wake trail: wide sector fading behind the arm */}
              <SvgLinearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#00E5FF" stopOpacity="0.35" />
                <Stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
              </SvgLinearGradient>
            </Defs>
            {/* Fading wake trail — 90° sector behind the arm */}
            <Path
              d="M 150 150 L 280 150 A 130 130 0 0 0 150 20 Z"
              fill="url(#sweepGrad)"
            />
            {/* Radar arm — full reach to edge */}
            <Line x1={150} y1={150} x2={280} y2={150} stroke="#00E5FF" strokeWidth={2} strokeOpacity={0.95} />
            {/* Bright tip dot on arm end */}
            <Circle cx={280} cy={150} r={3} fill="#00E5FF" opacity={0.9} />
          </Svg>
        </MotiView>

        {/* Pulsing scan dot at hotspot independent of sweep */}
        <MotiView
          from={{ opacity: 0.4, scale: 0.8 }}
          animate={{ opacity: 0.9, scale: 1.4 }}
          transition={{ type: 'timing', duration: 1300, loop: true, repeatReverse: true, easing: Easing.inOut(Easing.quad) }}
          style={[styles.hotspot, { left: SIZE * 0.467 - 4, top: SIZE * 0.65 - 4 }]}
        />
      </View>

      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 200, type: 'timing', duration: 600 }}
      >
        <Text style={styles.title}>DengueSat CIRO</Text>
        <Text style={styles.subtitle}>Crisis Intelligence · Response Orchestrator</Text>
        <View style={styles.dotRow}>
          {[0, 1, 2, 3, 4].map(i => (
            <MotiView
              key={i}
              from={{ opacity: 0.18, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 800, delay: i * 160, loop: true, repeatReverse: true, easing: Easing.inOut(Easing.quad) }}
              style={styles.dot}
            />
          ))}
        </View>
        <Text style={styles.hint}>Pick province · city · district. Tap Execute. Scan completes in ~60s.</Text>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 8, paddingBottom: 24 },
  radarBox: { alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', borderWidth: 1, borderColor: '#107BFF' },
  sweepWrap: { position: 'absolute' },
  hotspot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5C75', shadowColor: '#FF5C75', shadowOpacity: 0.8, shadowRadius: 6 },
  title: { fontSize: 26, fontFamily: 'Sora_800ExtraBold', color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.5, marginTop: 12 },
  subtitle: { fontSize: 12, color: '#7A8BA6', textAlign: 'center', fontFamily: 'Inter_600SemiBold', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 6 },
  dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginTop: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#107BFF' },
  hint: { fontSize: 13, color: '#A0AEC0', textAlign: 'center', fontFamily: 'Inter_400Regular', marginTop: 16, paddingHorizontal: 24, lineHeight: 19 },
});
