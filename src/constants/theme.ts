/**
 * Design tokens — Stridely premium dark sports theme
 *
 * Palette:
 *   #0E3756 — deep navy (primary backgrounds, elevated surfaces)
 *   #192126 — dark charcoal (base background)
 *   #BBF246 — neon lime (primary accent, CTAs, active states)
 *   #FFFFFF — white (text, icons)
 */

export const colors = {
  // Brand / Accent
  primary: '#BBF246',
  primaryLight: '#D0F77A',
  primaryDark: '#9AD030',
  primaryGradientStart: '#D0F77A',
  primaryGradientEnd: '#BBF246',
  primaryMuted: 'rgba(187, 242, 70, 0.15)',

  // Secondary
  secondary: '#0E3756',
  secondaryLight: '#154A6F',
  accent: '#BBF246',
  accentLight: '#D0F77A',

  // Backgrounds (dark)
  background: '#192126',
  backgroundElevated: '#0E3756',
  surface: '#1E2A30',
  surfaceElevated: '#0E3756',
  surfaceLight: '#243238',

  // Text hierarchy
  text: '#FFFFFF',
  textSecondary: '#C8D6DC',
  textMuted: '#6B8A99',
  textOnPrimary: '#192126',

  // Borders & surfaces
  border: '#2A3E48',
  borderLight: '#1E2A30',
  divider: '#2A3E48',

  // Semantic
  error: '#FF6B6B',
  errorLight: 'rgba(255, 107, 107, 0.15)',
  success: '#BBF246',
  successLight: 'rgba(187, 242, 70, 0.15)',
  warning: '#FFD93D',
  warningLight: 'rgba(255, 217, 61, 0.15)',

  // Shadows & overlays
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowMedium: 'rgba(0, 0, 0, 0.4)',
  shadowDark: 'rgba(0, 0, 0, 0.6)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',

  // Card gradients
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#BBF246',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;
