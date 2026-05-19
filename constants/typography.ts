/**
 * DengueSat Typography System — Climate Pulse
 * Geometric sans baseline (Inter/SF Pro Text style)
 */

import { StyleSheet, Platform } from 'react-native';

export const fontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,     // 16sp baseline for mobile legibility
  xl: 18,
  xxl: 24,
  xxxl: 32,
  display: 40,
} as const;

export const typography = StyleSheet.create({
  // Headers
  h1: {
    fontSize: fontSizes.xxxl,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  h2: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  h3: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    lineHeight: 24,
  },

  // Body
  bodyLarge: {
    fontSize: fontSizes.lg,
    fontWeight: '400',
    lineHeight: 24,
  },
  body: {
    fontSize: fontSizes.md,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: '400',
    lineHeight: 16,
  },

  // Mono (for technical data)
  mono: {
    fontSize: fontSizes.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Labels & KPI
  kpi: {
    fontSize: fontSizes.xxl,
    fontWeight: '800',
    letterSpacing: -1,
  },
  label: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Urdu (for bilingual alerts)
  urdu: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 28,
    textAlign: 'right',
  },
});

export const TYPOGRAPHY = typography;
