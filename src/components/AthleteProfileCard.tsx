/**
 * Athlete-style profile card — premium dark design
 *
 * Used on Profile, UserDetail, and anywhere a full profile display is needed.
 * Now supports sport-specific fields beyond just distance/pace.
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { UserProfile, SportsProfile } from '@/types';
import { getSportConfig } from '@/constants/sportConfig';
import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';

interface AthleteProfileCardProps {
  profile: UserProfile;
}

/** Build a display string for a sport profile's stats */
function buildSportStats(s: SportsProfile): string[] {
  const stats: string[] = [];
  if (s.distance) stats.push(`${s.distance} km`);
  if (s.pace) stats.push(s.pace);
  if (s.playStyle) stats.push(s.playStyle);
  if (s.position) stats.push(s.position);
  if (s.role) stats.push(s.role);
  if (s.gameStyle) stats.push(s.gameStyle);
  if (s.climbingType) stats.push(s.climbingType);
  if (s.grade) stats.push(s.grade);
  if (s.difficulty) stats.push(s.difficulty);
  if (s.distanceRange) stats.push(s.distanceRange);
  stats.push(s.skillLevel);
  stats.push(s.preferredTime);
  return stats;
}

/** Get the icon for a sport stat */
function getStatIcon(stat: string, sport: SportsProfile): string {
  if (stat === sport.skillLevel) return 'medal-outline';
  if (stat === sport.preferredTime) return 'clock-outline';
  if (stat === sport.pace) return 'speedometer';
  if (stat.includes('km') || stat === sport.distanceRange) return 'map-marker-distance';
  if (stat === sport.position || stat === sport.role) return 'account-outline';
  if (stat === sport.playStyle || stat === sport.gameStyle) return 'strategy';
  if (stat === sport.climbingType) return 'carabiner';
  if (stat === sport.grade) return 'chart-bar';
  if (stat === sport.difficulty) return 'signal-cellular-3';
  return 'information-outline';
}

export function AthleteProfileCard({ profile }: AthleteProfileCardProps): React.JSX.Element {
  const activeSport = profile.sportsProfiles.find((p) => p.id === profile.activeSportId);
  const allSports = profile.sportsProfiles;

  return (
    <View style={styles.container}>
      {/* Hero section */}
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
      {activeSport && (() => {
        const config = getSportConfig(activeSport.sport);
        const stats = buildSportStats(activeSport);
        return (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ACTIVE SPORT</Text>
            <View style={styles.sportCard}>
              <View style={styles.sportHeader}>
                <View style={styles.sportIconWrap}>
                  <MaterialCommunityIcons
                    name={(config?.icon || 'run') as any}
                    size={22}
                    color={colors.textOnPrimary}
                  />
                </View>
                <Text style={styles.sportName}>{activeSport.sport}</Text>
              </View>
              <View style={styles.stats}>
                {stats.map((stat) => (
                  <StatPill
                    key={stat}
                    icon={getStatIcon(stat, activeSport)}
                    label={stat}
                  />
                ))}
              </View>
            </View>
          </View>
        );
      })()}

      {/* Other sports */}
      {allSports.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>OTHER SPORTS</Text>
          {allSports
            .filter((s) => s.id !== profile.activeSportId)
            .map((s) => {
              const config = getSportConfig(s.sport);
              const summary = buildSportStats(s).join(' • ');
              return (
                <View key={s.id} style={styles.sportRow}>
                  <View style={styles.sportRowLeft}>
                    <MaterialCommunityIcons
                      name={(config?.icon || 'help-circle') as any}
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.sportRowText} numberOfLines={1}>
                      {s.sport}
                    </Text>
                  </View>
                  <View style={styles.skillBadge}>
                    <Text style={styles.skillBadgeText}>{s.skillLevel}</Text>
                  </View>
                </View>
              );
            })}
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
            <MaterialCommunityIcons name="crosshairs-gps" size={16} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.primary }]}>
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
    backgroundColor: colors.surfaceElevated,
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
    borderColor: colors.primary + '60',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    color: colors.primary,
    fontWeight: '800',
  },
  name: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  bio: {
    ...typography.body,
    color: colors.textSecondary,
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
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
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
    borderBottomColor: colors.border,
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
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  skillBadgeText: {
    ...typography.caption,
    color: colors.primary,
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
