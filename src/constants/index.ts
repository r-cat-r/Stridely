/**
 * Application constants
 * Centralized configuration and static values
 */

export const APP_NAME = 'Stridely';
export const APP_TAGLINE = 'Find your pace. Find your people.';

export const SEARCH_RADIUS_OPTIONS = [3, 5, 10, 20] as const;
export type SearchRadiusKm = (typeof SEARCH_RADIUS_OPTIONS)[number];

export { colors, spacing, borderRadius, typography } from './theme';
