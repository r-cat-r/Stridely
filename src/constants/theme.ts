/**
 * Design tokens — Stridely premium sports theme
 *
 * Inspired by Strava orange + modern dark neutrals.
 * Provides gradients, shadows, and typography for a production-grade feel.
 */

export const colors = {
  // Brand
  primary: '#FC4C02',
  primaryLight: '#FF7A3D',
  primaryDark: '#D93D00',
  primaryGradientStart: '#FF6B35',
  primaryGradientEnd: '#FC4C02',

  // Accent
  secondary: '#0EA5E9',
  secondaryLight: '#38BDF8',
  accent: '#22C55E',
  accentLight: '#4ADE80',

  // Warm neutrals
  neutral: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  background: '#F1F5F9',

  // Text hierarchy
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textOnPrimary: '#FFFFFF',

  // Borders & shadows
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#E2E8F0',

  // Semantic
  error: '#EF4444',
  errorLight: '#FEE2E2',
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  // Shadows & overlays
  shadow: 'rgba(15, 23, 42, 0.06)',
  shadowMedium: 'rgba(15, 23, 42, 0.10)',
  shadowDark: 'rgba(15, 23, 42, 0.16)',
  overlay: 'rgba(15, 23, 42, 0.5)',
  overlayLight: 'rgba(15, 23, 42, 0.3)',

  // Card gradients (for LinearGradient usage)
  cardGradientStart: 'rgba(0, 0, 0, 0)',
  cardGradientEnd: 'rgba(0, 0, 0, 0.6)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
} as const;

export const borderRadius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999,
} as const;

export const typography = {
  // Display
  displayLarge: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  displayMedium: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.3 },

  // Headings
  h1: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.2 },
  h2: { fontSize: 20, fontWeight: '600' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },

  // Body
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },

  // Labels
  label: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.3 },
  labelSmall: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },

  // Caption
  caption: { fontSize: 12, fontWeight: '400' as const },
} as const;

export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
