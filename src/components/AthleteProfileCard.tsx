/**
 * Athlete-style profile card — premium design
 *
 * Used on Profile, UserDetail, and anywhere a full profile display is needed.
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { UserProfile } from '@/types';
import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';

interface AthleteProfileCardProps {
  profile: UserProfile;
}

export function AthleteProfileCard({ profile }: AthleteProfileCardProps): React.JSX.Element {
  const activeSport = profile.sportsProfiles.find((p) => p.id === profile.activeSportId);
  const allSports = profile.sportsProfiles;

  return (
    <View style={styles.container}>
      {/* Hero section with gradient-like background */}
      <View style={styles.heroBg}>
        <View style={styles.hero}>
          <View style={styles.avatarRing}>
            {profile.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {(profile.displayName?.[0] ?? profile.email[0] ?? '?').toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{profile.displayName || profile.email}</Text>
          {profile.bio ? (
            <Text style={styles.bio} numberOfLines={3}>
              {profile.bio}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Active sport section */}
      {activeSport && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACTIVE SPORT</Text>
          <View style={styles.sportCard}>
            <View style={styles.sportHeader}>
              <View style={styles.sportIconWrap}>
                <MaterialCommunityIcons
                  name={
                    (activeSport.sport === 'Cycling'
                      ? 'bike'
                      : activeSport.sport === 'Swimming'
                        ? 'swim'
                        : 'run') as 'run'
                  }
                  size={22}
                  color={colors.textOnPrimary}
                />
              </View>
              <Text style={styles.sportName}>{activeSport.sport}</Text>
            </View>
            <View style={styles.stats}>
              <StatPill icon="map-marker-distance" label={`${activeSport.distance} km`} />
              <StatPill icon="speedometer" label={activeSport.pace} />
              <StatPill icon="medal-outline" label={activeSport.skillLevel} />
              <StatPill icon="clock-outline" label={activeSport.preferredTime} />
            </View>
          </View>
        </View>
      )}

      {/* Other sports */}
      {allSports.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>OTHER SPORTS</Text>
          {allSports
            .filter((s) => s.id !== profile.activeSportId)
            .map((s) => (
              <View key={s.id} style={styles.sportRow}>
                <View style={styles.sportRowLeft}>
                  <MaterialCommunityIcons
                    name={
                      s.sport === 'Cycling'
                        ? 'bike'
                        : s.sport === 'Swimming'
                          ? 'swim'
                          : 'run'
                    }
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.sportRowText}>
                    {s.sport} • {s.distance}km • {s.pace}
                  </Text>
                </View>
                <View style={styles.skillBadge}>
                  <Text style={styles.skillBadgeText}>{s.skillLevel}</Text>
                </View>
              </View>
            ))}
        </View>
      )}

      {/* Meta info */}
      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="map-marker-radius" size={16} color={colors.textMuted} />
          <Text style={styles.metaText}>
            Search radius: {profile.searchRadiusKm} km
          </Text>
        </View>
        {profile.coordinates && (
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="crosshairs-gps" size={16} color={colors.accent} />
            <Text style={[styles.metaText, { color: colors.accent }]}>
              Location active
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function StatPill({
  icon,
  label,
}: {
  icon: string;
  label: string;
}): React.JSX.Element {
  return (
    <View style={styles.statPill}>
      <MaterialCommunityIcons name={icon as any} size={14} color={colors.textSecondary} />
      <Text style={styles.statPillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    margin: spacing.lg,
    ...shadows.md,
  },
  heroBg: {
    backgroundColor: colors.primary,
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    paddingTop: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 58,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    color: colors.textOnPrimary,
    fontWeight: '800',
  },
  name: {
    ...typography.h1,
    color: colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  bio: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.labelSmall,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  sportCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  sportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.md,
  },
  sportIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportName: {
    ...typography.h2,
    color: colors.primary,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  statPillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sportRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sportRowText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  skillBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  skillBadgeText: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  meta: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
