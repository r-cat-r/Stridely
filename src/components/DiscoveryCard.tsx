/**
 * Discovery card — premium stacked card for swipe UI
 *
 * Shows athlete photo/avatar, name, sport, stats, and compatibility badge.
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { DiscoveryMatch } from '@/types';
import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';

interface DiscoveryCardProps {
  match: DiscoveryMatch;
}

export function DiscoveryCard({ match }: DiscoveryCardProps): React.JSX.Element {
  const { user, compatibility, distanceKm } = match;
  const activeSport = user.sportsProfiles.find((p) => p.id === user.activeSportId);

  return (
    <View style={styles.card}>
      {/* Image / Avatar */}
      <View style={styles.imageContainer}>
        {user.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>
              {(user.displayName?.[0] ?? user.email[0] ?? '?').toUpperCase()}
            </Text>
          </View>
        )}

        {/* Gradient overlay for text readability */}
        <View style={styles.imageOverlay} />

        {/* Compatibility badge */}
        <View style={styles.badge}>
          <MaterialCommunityIcons name="heart" size={12} color="#fff" />
          <Text style={styles.badgeText}>{compatibility}%</Text>
        </View>

        {/* Distance pill */}
        <View style={styles.distancePill}>
          <MaterialCommunityIcons name="map-marker" size={12} color={colors.textOnPrimary} />
          <Text style={styles.distanceText}>{distanceKm} km</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {user.displayName || user.email}
        </Text>

        {activeSport && (
          <View style={styles.sportRow}>
            <MaterialCommunityIcons
              name={
                activeSport.sport === 'Cycling'
                  ? 'bike'
                  : activeSport.sport === 'Swimming'
                    ? 'swim'
                    : 'run'
              }
              size={16}
              color={colors.primary}
            />
            <Text style={styles.sportName}>{activeSport.sport}</Text>
          </View>
        )}

        {activeSport && (
          <View style={styles.statsRow}>
            <StatChip
              icon="map-marker-distance"
              label={`${activeSport.distance}km`}
            />
            <StatChip icon="speedometer" label={activeSport.pace} />
            <StatChip icon="medal-outline" label={activeSport.skillLevel} />
          </View>
        )}

        {user.bio ? (
          <Text style={styles.bio} numberOfLines={2}>
            {user.bio}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function StatChip({
  icon,
  label,
}: {
  icon: string;
  label: string;
}): React.JSX.Element {
  return (
    <View style={styles.statChip}>
      <MaterialCommunityIcons
        name={icon as any}
        size={13}
        color={colors.textSecondary}
      />
      <Text style={styles.statChipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 4 / 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 56,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '800',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'transparent',
  },
  badge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  badgeText: {
    color: colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  distancePill: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.full,
  },
  distanceText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: spacing.lg,
  },
  name: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  sportName: {
    ...typography.label,
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  statChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  bio: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
