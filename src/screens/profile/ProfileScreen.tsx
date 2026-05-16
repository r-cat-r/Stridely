/**
 * Profile screen — premium dark athlete style
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '@/features/auth/AuthContext';
import { useLocation } from '@/hooks/useLocation';
import { updateUserProfile } from '@/services/userService';
import { seedDemoData, clearDemoData } from '@/services/demoSeedService';
import { AthleteProfileCard } from '@/components/AthleteProfileCard';
import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';
import type { ProfileStackParamList } from '@/navigation/stacks/ProfileStack';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;

export function ProfileScreen({ navigation }: Props): React.JSX.Element {
  const { userId, profile, loading, error, refreshProfile, signOut } = useAuth();
  const { coordinates, loading: locLoading, refresh } = useLocation();
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (
      coordinates &&
      userId &&
      (profile?.coordinates?.latitude !== coordinates.latitude ||
        profile?.coordinates?.longitude !== coordinates.longitude)
    ) {
      updateUserProfile(userId, { coordinates }).then(() => refreshProfile());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates?.latitude, coordinates?.longitude, userId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyIconWrap}>
          <MaterialCommunityIcons name="account-plus-outline" size={48} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Welcome to Stridely</Text>
        <Text style={styles.emptySubtitle}>Create your profile to get started</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={refreshProfile}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Create Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (profile.sportsProfiles.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyIconWrap}>
          <MaterialCommunityIcons name="run-fast" size={48} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Add Your Sport</Text>
        <Text style={styles.emptySubtitle}>
          Tell us about your sport to find{'\n'}compatible training partners
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('SportsProfiles')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Create Sports Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasCoordinates = !!profile.coordinates;

  const handleSeed = async (): Promise<void> => {
    if (!userId || !profile.coordinates) return;
    setSeeding(true);
    try {
      const activeSport = profile.sportsProfiles.find(
        (s) => s.id === profile.activeSportId
      )?.sport;
      await seedDemoData(userId, profile.coordinates, activeSport);
      await refreshProfile();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to seed');
    } finally {
      setSeeding(false);
    }
  };

  const handleClearDemo = async (): Promise<void> => {
    setClearing(true);
    try {
      await clearDemoData();
      await refreshProfile();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to clear');
    } finally {
      setClearing(false);
    }
  };

  return (
    <ScrollView style={styles.screen}>
      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle" size={18} color={colors.error} />
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      )}

      <AthleteProfileCard profile={profile} />

      <View style={styles.actionsSection}>
        {/* Location status */}
        {locLoading ? (
          <View style={styles.statusRow}>
            <MaterialCommunityIcons name="loading" size={18} color={colors.textMuted} />
            <Text style={styles.statusText}>Getting location...</Text>
          </View>
        ) : coordinates || hasCoordinates ? (
          <View style={styles.statusRow}>
            <MaterialCommunityIcons name="crosshairs-gps" size={18} color={colors.primary} />
            <Text style={[styles.statusText, { color: colors.primary }]}>Location active</Text>
          </View>
        ) : (
          <ActionButton
            icon="crosshairs-gps"
            label="Enable Location"
            onPress={refresh}
            color={colors.secondary}
          />
        )}

        <ActionButton
          icon="pencil-outline"
          label="Edit Profile"
          onPress={() => navigation.navigate('EditProfile')}
          color={colors.primary}
          filled
        />

        <ActionButton
          icon="dumbbell"
          label="Sports Profiles"
          onPress={() => navigation.navigate('SportsProfiles')}
          color={colors.textSecondary}
        />

        {__DEV__ && hasCoordinates && (
          <View style={styles.devSection}>
            <Text style={styles.devLabel}>Developer Tools</Text>
            <View style={styles.devRow}>
              <ActionButton
                icon="database-plus-outline"
                label="Seed Data"
                onPress={handleSeed}
                color={colors.textSecondary}
                loading={seeding}
                disabled={seeding || clearing}
                compact
              />
              <ActionButton
                icon="database-remove-outline"
                label="Clear Data"
                onPress={handleClearDemo}
                color={colors.error}
                loading={clearing}
                disabled={seeding || clearing}
                compact
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={signOut}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="logout" size={18} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  color,
  filled,
  loading,
  disabled,
  compact,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
  filled?: boolean;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
}): React.JSX.Element {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        actionStyles.btn,
        filled && { backgroundColor: color },
        !filled && { borderWidth: 1.5, borderColor: color + '40' },
        compact && { flex: 1 },
        disabled && { opacity: 0.5 },
      ]}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={18}
        color={filled ? colors.textOnPrimary : color}
      />
      <Text style={[actionStyles.label, { color: filled ? colors.textOnPrimary : color }]}>
        {loading ? 'Loading...' : label}
      </Text>
    </TouchableOpacity>
  );
}

const actionStyles = StyleSheet.create({
  btn: {
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    fontSize: 14,
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['4xl'],
    backgroundColor: colors.background,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing['3xl'],
    marginTop: spacing.xl,
    ...shadows.glow,
  },
  primaryBtnText: {
    ...typography.label,
    fontSize: 15,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    flex: 1,
  },
  actionsSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  statusText: {
    ...typography.label,
    color: colors.textMuted,
  },
  devSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  devLabel: {
    ...typography.labelSmall,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  devRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  signOutText: {
    ...typography.label,
    color: colors.error,
    fontSize: 14,
  },
});
