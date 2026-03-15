/**
 * Athlete-style profile card
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { UserProfile } from '@/types';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface AthleteProfileCardProps {
  profile: UserProfile;
  showActions?: boolean;
}

export function AthleteProfileCard({ profile, showActions = false }: AthleteProfileCardProps): React.JSX.Element {
  const activeSport = profile.sportsProfiles.find((p) => p.id === profile.activeSportId);
  const allSports = profile.sportsProfiles;

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.avatarContainer}>
          {profile.photoURL ? (
            <Image source={{ uri: profile.photoURL }} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {profile.displayName?.[0] ?? profile.email[0] ?? '?'}
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

      {activeSport && (
        <View style={styles.activeSport}>
          <Text style={styles.sectionLabel}>Active sport</Text>
          <View style={styles.sportCard}>
            <View style={styles.sportHeader}>
              <MaterialCommunityIcons
                name={
                  (activeSport.sport === 'Cycling'
                    ? 'bike'
                    : activeSport.sport === 'Swimming'
                      ? 'swim'
                      : 'run') as 'run'
                }
                size={20}
                color={colors.primary}
              />
              <Text style={styles.sportName}>{activeSport.sport}</Text>
            </View>
            <View style={styles.stats}>
              <StatPill icon="map-marker" label={`${activeSport.distance} km`} />
              <StatPill icon="speedometer" label={activeSport.pace} />
              <StatPill icon="medal" label={activeSport.skillLevel} />
              <StatPill icon="clock-outline" label={activeSport.preferredTime} />
            </View>
          </View>
        </View>
      )}

      {allSports.length > 1 && (
        <View style={styles.allSports}>
          <Text style={styles.sectionLabel}>All sports</Text>
          {allSports
            .filter((s) => s.id !== profile.activeSportId)
            .map((s) => (
              <View key={s.id} style={styles.sportRow}>
                <Text style={styles.sportRowText}>
                  {s.sport} • {s.distance}km • {s.pace}
                </Text>
                <Text style={styles.sportRowSkill}>{s.skillLevel}</Text>
              </View>
            ))}
        </View>
      )}

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="map-marker-radius" size={16} color={colors.textMuted} />
          <Text style={styles.metaText}>
            Search radius: {profile.searchRadiusKm} km
          </Text>
        </View>
      </View>
    </View>
  );
}

function StatPill({
  icon,
  label,
}: {
  icon: 'map-marker' | 'speedometer' | 'medal' | 'clock-outline';
  label: string;
}): React.JSX.Element {
  return (
    <View style={styles.statPill}>
      <MaterialCommunityIcons name={icon} size={14} color={colors.textSecondary} />
      <Text style={styles.statPillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    margin: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    color: colors.textMuted,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  bio: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  activeSport: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  sportCard: {
    backgroundColor: colors.neutral,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  sportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  sportName: {
    fontSize: 18,
    fontWeight: '600',
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
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statPillText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  allSports: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  sportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sportRowText: {
    fontSize: 14,
    color: colors.text,
  },
  sportRowSkill: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  meta: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
