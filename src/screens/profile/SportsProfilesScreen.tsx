/**
 * Sports profiles screen — premium dark card-based UI
 *
 * Features:
 * - Sport selection grid (reuses SportCard component)
 * - Sport-specific detail forms via ChipSelector
 * - Add/remove sports with dark themed cards
 * - Set active sport for matching
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/AuthContext';
import {
  addSportsProfile,
  updateUserProfile,
  removeSportsProfile,
} from '@/services/userService';
import { SportCard } from '@/components/SportCard';
import { ChipSelector } from '@/components/ChipSelector';
import { SPORTS, getSportConfig, getSportFields } from '@/constants/sportConfig';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import type { SportsProfile } from '@/types';

export function SportsProfilesScreen({
  navigation,
}: {
  navigation: { goBack: () => void };
}): React.JSX.Element {
  const { userId, profile, refreshProfile } = useAuth();
  const [adding, setAdding] = useState(false);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const profiles = profile?.sportsProfiles ?? [];
  const activeId = profile?.activeSportId;

  const setValue = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setAdding(false);
    setShowDetails(false);
    setSelectedSport(null);
    setValues({});
  }, []);

  const handleSelectSport = (sport: string) => {
    setSelectedSport(sport);
    setValues({});
  };

  const handleContinueToDetails = () => {
    if (selectedSport) {
      setShowDetails(true);
    }
  };

  const handleAdd = async (): Promise<void> => {
    if (!userId || !selectedSport) return;

    const allFields = getSportFields(selectedSport);
    const allFilled = allFields.every((field) => {
      if (field.type === 'number') {
        const num = parseFloat(values[field.key] || '');
        return !isNaN(num) && num > 0;
      }
      return !!values[field.key]?.trim();
    });

    if (!allFilled) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const profileData: Omit<SportsProfile, 'id'> = {
        sport: selectedSport,
        skillLevel: values.skillLevel || 'Beginner',
        preferredTime: values.preferredTime || 'Morning',
      };

      if (values.distance) profileData.distance = parseFloat(values.distance);
      if (values.pace) profileData.pace = values.pace;
      if (values.playStyle) profileData.playStyle = values.playStyle;
      if (values.position) profileData.position = values.position;
      if (values.gameStyle) profileData.gameStyle = values.gameStyle;
      if (values.role) profileData.role = values.role;
      if (values.climbingType) profileData.climbingType = values.climbingType;
      if (values.grade) profileData.grade = values.grade;
      if (values.difficulty) profileData.difficulty = values.difficulty;
      if (values.distanceRange) profileData.distanceRange = values.distanceRange;

      await addSportsProfile(userId, profileData);
      await refreshProfile();
      resetForm();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add sport');
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (profileId: string): Promise<void> => {
    if (!userId) return;
    await updateUserProfile(userId, { activeSportId: profileId });
    await refreshProfile();
  };

  const handleRemove = async (profileId: string): Promise<void> => {
    if (!userId) return;
    Alert.alert(
      'Remove Sport',
      'Are you sure you want to remove this sport profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeSportsProfile(userId, profileId);
            await refreshProfile();
          },
        },
      ]
    );
  };

  // ── Sport Selection (Step 1) ────────────────────────
  if (adding && !showDetails) {
    return (
      <View style={styles.screen}>
        <View style={styles.addHeader}>
          <TouchableOpacity onPress={resetForm} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.addTitle}>Choose a Sport</Text>
        </View>

        <FlatList
          key="sports-grid-2col"
          data={SPORTS}
          keyExtractor={(item) => item.name}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SportCard
              name={item.name}
              icon={item.icon}
              selected={selectedSport === item.name}
              onPress={() => handleSelectSport(item.name)}
            />
          )}
        />

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.continueBtn, !selectedSport && styles.continueBtnDisabled]}
            onPress={handleContinueToDetails}
            disabled={!selectedSport}
            activeOpacity={0.8}
          >
            <Text style={[styles.continueText, !selectedSport && styles.continueTextDisabled]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Sport Details (Step 2) ──────────────────────────
  if (adding && showDetails && selectedSport) {
    const allFields = getSportFields(selectedSport);
    const sportConfig = getSportConfig(selectedSport);
    const inputTheme = {
      colors: {
        onSurfaceVariant: colors.textMuted,
        surface: colors.surface,
      },
    };

    return (
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.detailsContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => setShowDetails(false)}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.sportHeaderCard}>
            <View style={styles.sportIconWrap}>
              <MaterialCommunityIcons
                name={(sportConfig?.icon || 'help-circle') as any}
                size={32}
                color={colors.primary}
              />
            </View>
            <Text style={styles.sportHeaderName}>{selectedSport}</Text>
          </View>

          <Text style={styles.detailsTitle}>Set up your profile</Text>

          {allFields.map((field) => {
            if (field.type === 'chips' && field.options) {
              return (
                <ChipSelector
                  key={field.key}
                  label={field.label}
                  options={field.options}
                  selected={values[field.key] || ''}
                  onSelect={(v) => setValue(field.key, v)}
                />
              );
            }
            if (field.type === 'number') {
              return (
                <TextInput
                  key={field.key}
                  label={field.label}
                  value={values[field.key] || ''}
                  onChangeText={(t) => setValue(field.key, t)}
                  keyboardType={field.keyboardType || 'decimal-pad'}
                  placeholder={field.placeholder}
                  mode="outlined"
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                  textColor={colors.text}
                  style={styles.input}
                  theme={inputTheme}
                />
              );
            }
            return (
              <TextInput
                key={field.key}
                label={field.label}
                value={values[field.key] || ''}
                onChangeText={(t) => setValue(field.key, t)}
                placeholder={field.placeholder}
                mode="outlined"
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                textColor={colors.text}
                style={styles.input}
                theme={inputTheme}
              />
            );
          })}
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.continueBtn, loading && styles.continueBtnDisabled]}
            onPress={handleAdd}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.continueText}>
              {loading ? 'Saving...' : 'Add Sport'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Profiles List ───────────────────────────────────
  return (
    <View style={styles.screen}>
      <View style={styles.listHeader}>
        <TouchableOpacity
          style={styles.addSportBtn}
          onPress={() => setAdding(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.textOnPrimary} />
          <Text style={styles.addSportText}>Add Sport</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        key="profiles-list-1col"
        data={profiles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const config = getSportConfig(item.sport);
          const isActive = activeId === item.id;

          return (
            <View style={[styles.profileCard, isActive && styles.profileCardActive]}>
              <View style={styles.profileCardHeader}>
                <View style={[styles.profileIconWrap, isActive && styles.profileIconWrapActive]}>
                  <MaterialCommunityIcons
                    name={(config?.icon || 'help-circle') as any}
                    size={24}
                    color={isActive ? colors.primary : colors.textSecondary}
                  />
                </View>
                <View style={styles.profileCardInfo}>
                  <Text style={styles.profileSportName}>{item.sport}</Text>
                  <Text style={styles.profileDetails}>
                    {item.skillLevel} • {item.preferredTime}
                    {item.distance ? ` • ${item.distance}km` : ''}
                    {item.pace ? ` • ${item.pace}` : ''}
                    {item.playStyle ? ` • ${item.playStyle}` : ''}
                    {item.position ? ` • ${item.position}` : ''}
                    {item.role ? ` • ${item.role}` : ''}
                  </Text>
                </View>
                {isActive && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                )}
              </View>

              <View style={styles.profileActions}>
                {!isActive && (
                  <TouchableOpacity
                    style={styles.setActiveBtn}
                    onPress={() => handleSetActive(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.setActiveText}>Set Active</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemove(item.id)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="dumbbell" size={40} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No sports profiles</Text>
            <Text style={styles.emptySubtitle}>Add a sport to start finding training partners</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // List view
  listHeader: {
    padding: spacing.lg,
  },
  addSportBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.glow,
  },
  addSportText: {
    ...typography.label,
    fontSize: 15,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },

  // Profile cards
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  profileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconWrapActive: {
    backgroundColor: 'rgba(187, 242, 70, 0.2)',
  },
  profileCardInfo: {
    flex: 1,
  },
  profileSportName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 2,
  },
  profileDetails: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  activeBadge: {
    backgroundColor: colors.primaryMuted,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  activeBadgeText: {
    ...typography.labelSmall,
    color: colors.primary,
    fontSize: 10,
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  setActiveBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  setActiveText: {
    ...typography.label,
    color: colors.primary,
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing['4xl'],
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Add flow — grid
  addHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTitle: {
    ...typography.h2,
    color: colors.text,
  },
  gridContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: 120,
  },

  // Add flow — details
  detailsContent: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: 140,
  },
  sportHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing['2xl'],
  },
  sportIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportHeaderName: {
    ...typography.h2,
    color: colors.text,
  },
  detailsTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  input: {
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.lg + 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  continueBtnDisabled: {
    backgroundColor: colors.surface,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueText: {
    ...typography.label,
    fontSize: 16,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  continueTextDisabled: {
    color: colors.textMuted,
  },
});
