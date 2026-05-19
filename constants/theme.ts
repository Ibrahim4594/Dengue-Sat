/**
 * DengueSat Design System — Climate Pulse Aesthetic
 * Trust-focused, data-forward theme with a clinical but approachable feel.
 */

export const colors = {
  // Backgrounds
  background: '#F6F8FA',      // Soft Gray
  surface: '#FFFFFF',         // Clean White
  surfaceSolid: '#F0F1F3',    // Solid surface (non-transparent)
  surfaceSecondary: '#E1E4E8',
  border: '#D1D5DA',
  borderGlow: 'rgba(11, 109, 246, 0.3)',
  
  // Primary Trust Colors
  primary: '#0B6DF6',         // Trust Blue
  primaryDim: 'rgba(11, 109, 246, 0.1)',
  secondary: '#2BB673',       // Teal Green
  secondaryDim: 'rgba(43, 182, 115, 0.1)',
  
  // Alert/Warning Colors
  accent: '#FF8A00',          // Alert Orange
  critical: '#E53935',        // Danger Red
  error: '#E53935',           // Danger Red (alias)
  warning: '#FFD33D',         // Caution Yellow
  info: '#0B6DF6',            // Trust Blue (alias)
  
  // Severity Levels
  severity: {
    critical: '#E53935',
    high: '#FF8A00',
    moderate: '#FFD33D',
    low: '#2BB673',
    info: '#0B6DF6',
  },

  // Text
  text: {
    primary: '#1F2328',       // High Contrast Dark
    secondary: '#424B57',     // Darker for visibility
    tertiary: '#6A737D',
    inverse: '#FFFFFF',
    link: '#0969DA',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadows = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  }),
} as const;

export function getSeverityColor(dri: number): string {
  if (dri > 75) return colors.severity.critical;
  if (dri > 50) return colors.severity.high;
  if (dri > 25) return colors.severity.moderate;
  return colors.severity.low;
}

export function getSeverityLabel(dri: number): string {
  if (dri > 75) return 'CRITICAL';
  if (dri > 50) return 'HIGH';
  if (dri > 25) return 'MODERATE';
  return 'LOW';
}

export const THEME = { colors, spacing, borderRadius, shadows };
