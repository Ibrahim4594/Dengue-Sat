/**
 * Climate Pulse → Material Design 3 Theme Bridge
 * Maps the DengueSat design tokens to react-native-paper's MD3 theme system.
 * Custom fonts: Inter (body) + Sora (display)
 */
import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { colors, borderRadius } from './theme';

const BODY = 'Inter_400Regular';
const BODY_MED = 'Inter_500Medium';
const BODY_SEMI = 'Inter_600SemiBold';
const BODY_BOLD = 'Inter_700Bold';
const BODY_EXTRA = 'Inter_800ExtraBold';
const DISPLAY = 'Sora_700Bold';
const DISPLAY_EXTRA = 'Sora_800ExtraBold';

const fontConfig = {
  displayLarge: { fontFamily: DISPLAY_EXTRA, fontSize: 48, letterSpacing: -1, lineHeight: 56 },
  displayMedium: { fontFamily: DISPLAY_EXTRA, fontSize: 40, letterSpacing: -0.5, lineHeight: 46 },
  displaySmall: { fontFamily: DISPLAY, fontSize: 36, letterSpacing: -0.5, lineHeight: 42 },
  headlineLarge: { fontFamily: DISPLAY, fontSize: 28, letterSpacing: -0.3, lineHeight: 34 },
  headlineMedium: { fontFamily: DISPLAY, fontSize: 24, letterSpacing: -0.3, lineHeight: 30 },
  headlineSmall: { fontFamily: BODY_BOLD, fontSize: 22, letterSpacing: -0.2, lineHeight: 28 },
  titleLarge: { fontFamily: BODY_BOLD, fontSize: 20, lineHeight: 26 },
  titleMedium: { fontFamily: BODY_SEMI, fontSize: 16, lineHeight: 22 },
  titleSmall: { fontFamily: BODY_SEMI, fontSize: 14, lineHeight: 20 },
  bodyLarge: { fontFamily: BODY, fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontFamily: BODY, fontSize: 14, lineHeight: 20 },
  bodySmall: { fontFamily: BODY, fontSize: 12, lineHeight: 16 },
  labelLarge: { fontFamily: BODY_SEMI, fontSize: 14, lineHeight: 20 },
  labelMedium: { fontFamily: BODY_SEMI, fontSize: 12, letterSpacing: 0.5, lineHeight: 16 },
  labelSmall: { fontFamily: BODY_SEMI, fontSize: 10, letterSpacing: 1, lineHeight: 14 },
};

const climatePulseColors = {
  primary: colors.primary,
  onPrimary: '#FFFFFF',
  primaryContainer: 'rgba(11, 109, 246, 0.12)',
  onPrimaryContainer: '#003A8C',

  secondary: colors.secondary,
  onSecondary: '#FFFFFF',
  secondaryContainer: 'rgba(43, 182, 115, 0.12)',
  onSecondaryContainer: '#0B5E34',

  tertiary: colors.accent,
  onTertiary: '#FFFFFF',
  tertiaryContainer: 'rgba(255, 138, 0, 0.12)',
  onTertiaryContainer: '#7A4200',

  error: colors.critical,
  onError: '#FFFFFF',
  errorContainer: 'rgba(229, 57, 53, 0.12)',
  onErrorContainer: '#7F0000',

  background: colors.background,
  onBackground: colors.text.primary,
  surface: colors.surface,
  onSurface: colors.text.primary,
  surfaceVariant: colors.surfaceSecondary,
  onSurfaceVariant: colors.text.secondary,
  outline: colors.border,

  elevation: {
    level0: 'transparent',
    level1: 'rgba(11, 109, 246, 0.03)',
    level2: 'rgba(11, 109, 246, 0.05)',
    level3: 'rgba(11, 109, 246, 0.07)',
    level4: 'rgba(11, 109, 246, 0.09)',
    level5: 'rgba(11, 109, 246, 0.11)',
  },
};

export const ClimatePulseLight = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, ...climatePulseColors },
  fonts: configureFonts({ config: fontConfig as any }),
  roundness: borderRadius.md,
};

// COMMAND CENTER — High-performance tactical aesthetic
export const ClimatePulseDark = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#007AFF',       // Vibrant Tactical Blue
    onPrimary: '#FFFFFF',
    primaryContainer: 'rgba(0, 122, 255, 0.15)',
    onPrimaryContainer: '#D1E9FF',

    secondary: '#00E676',     // Bright Signal Green
    onSecondary: '#00391C',
    secondaryContainer: 'rgba(0, 230, 118, 0.15)',
    onSecondaryContainer: '#C8FFD4',

    tertiary: '#FFD600',      // Alert Yellow
    onTertiary: '#322800',
    tertiaryContainer: 'rgba(255, 214, 0, 0.15)',
    onTertiaryContainer: '#FFF1A6',

    error: '#FF1744',         // Emergency Red
    onError: '#FFFFFF',
    errorContainer: 'rgba(255, 23, 68, 0.15)',
    onErrorContainer: '#FFDADE',

    background: '#040609',    // Pitch Black
    onBackground: '#FFFFFF',
    surface: '#0B0F17',       // Dark Steel Surface
    onSurface: '#FFFFFF',
    surfaceVariant: '#141A26',
    onSurfaceVariant: '#A0AEC0', // Crisp Steel Grey
    outline: '#232D3F',
    outlineVariant: '#2D394D',
  },
  fonts: configureFonts({ config: fontConfig as any }),
  roundness: 12,
};
