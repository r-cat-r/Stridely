/**
 * Discovery card - stacked card for swipe UI
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { DiscoveryMatch } from '@/types';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface DiscoveryCardProps {
  match: DiscoveryMatch;
}

export function DiscoveryCard({ match }: DiscoveryCardProps): React.JSX.Element {
  const { user, compatibility, distanceKm } = match;
  const activeSport = user.sportsProfiles.find((p) => p.id === user.activeSportId);

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {user.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>
              {user.displayName?.[0] ?? user.email[0] ?? '?'}
            </Text>
          </View>
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{compatibility}%</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {user.displayName || user.email}
        </Text>
        {activeSport && (
          <Text style={styles.sport}>{activeSport.sport}</Text>
        )}
        <View style={styles.stats}>
          <Text style={styles.stat}>{activeSport?.distance ?? '-'} km</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.stat}>{activeSport?.pace ?? '-'}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.stat}>{distanceKm} km away</Text>
        </View>
        {activeSport && (
          <Text style={styles.skill}>{activeSport.skillLevel}</Text>
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
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
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 48,
    color: colors.textMuted,
  },
  badge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    padding: spacing.xl,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sport: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stat: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  dot: {
    marginHorizontal: spacing.sm,
    color: colors.textMuted,
    fontSize: 12,
  },
  skill: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'capitalize',
    marginBottom: spacing.sm,
  },
  bio: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
