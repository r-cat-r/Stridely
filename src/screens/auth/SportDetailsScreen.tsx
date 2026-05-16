/**
 * Sport Details screen — sport-specific form fields
 *
 * Renders dynamic fields based on sport category from sportConfig.
 * After saving, shows "Add more sports?" modal.
 * Works for both onboarding flow and existing profile management.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '@/features/auth/AuthContext';
import { addSportsProfile, updateUserProfile } from '@/services/userService';
import { getSportConfig, getSportFields, COMMON_FIELDS } from '@/constants/sportConfig';
import { ChipSelector } from '@/components/ChipSelector';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { SportsProfile } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SportDetails'>;

export function SportDetailsScreen({ navigation, route }: Props): React.JSX.Element {
  const { sport } = route.params;
  const { userId, refreshProfile, completeOnboarding } = useAuth();
  const sportConfig = getSportConfig(sport);
  const allFields = getSportFields(sport);

  // Dynamic form values
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const setValue = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isFormValid = useCallback((): boolean => {
    return allFields.every((field) => {
      if (field.type === 'number') {
        const num = parseFloat(values[field.key] || '');
        return !isNaN(num) && num > 0;
      }
      return !!values[field.key]?.trim();
    });
  }, [allFields, values]);

  const handleSave = async (): Promise<void> => {
    if (!userId || !isFormValid()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      // Build the sport profile from dynamic values
      const profileData: Omit<SportsProfile, 'id'> = {
        sport,
        skillLevel: values.skillLevel || 'Beginner',
        preferredTime: values.preferredTime || 'Morning',
      };

      // Map sport-specific fields
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

      const newProfile = await addSportsProfile(userId, profileData);

      // Set as active sport
      await updateUserProfile(userId, { activeSportId: newProfile.id });

      await refreshProfile();
      setShowModal(true);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMore = (): void => {
    setShowModal(false);
    navigation.navigate('SportSelection');
  };

  const handleDone = async (): Promise<void> => {
    setShowModal(false);
    await completeOnboarding();
    // Navigation will auto-redirect to Main via AuthContext
  };

  const inputTheme = {
    colors: {
      onSurfaceVariant: colors.textMuted,
      surface: colors.surface,
    },
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Sport header */}
        <View style={styles.sportHeader}>
          <View style={styles.sportIconWrap}>
            <MaterialCommunityIcons
              name={(sportConfig?.icon || 'help-circle') as any}
              size={36}
              color={colors.primary}
            />
          </View>
          <View style={styles.sportHeaderText}>
            <Text style={styles.sportName}>{sport}</Text>
            <Text style={styles.sportCategory}>
              {sportConfig?.category === 'endurance' ? 'Endurance Sport' :
               sportConfig?.category === 'racquet' ? 'Racquet Sport' :
               sportConfig?.category === 'team' ? 'Team Sport' :
               'Individual Sport'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Set up your profile</Text>
        <Text style={styles.sectionSubtitle}>
          Tell us about your {sport.toLowerCase()} preferences to find compatible partners
        </Text>

        {/* Dynamic fields */}
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

          // text input
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

      {/* Save Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.saveBtn,
            (!isFormValid() || loading) && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={!isFormValid() || loading}
          activeOpacity={0.8}
        >
          <Text style={styles.saveText}>
            {loading ? 'Saving...' : 'Save Profile'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* "Add More?" Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <MaterialCommunityIcons name="check-circle" size={48} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Profile Saved!</Text>
            <Text style={styles.modalSubtitle}>
              Your {sport} profile has been set up successfully.
            </Text>
            <Text style={styles.modalQuestion}>
              Would you like to set up more sport profiles?
            </Text>

            <TouchableOpacity
              style={styles.modalBtnPrimary}
              onPress={handleAddMore}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus" size={20} color={colors.textOnPrimary} />
              <Text style={styles.modalBtnPrimaryText}>Yes, add another</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalBtnSecondary}
              onPress={handleDone}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnSecondaryText}>No, I'm done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: 60,
    paddingBottom: 140,
  },

  // Back
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },

  // Sport header
  sportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing['2xl'],
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sportIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportHeaderText: {
    flex: 1,
  },
  sportName: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sportCategory: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },

  // Section
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing['2xl'],
    lineHeight: 22,
  },

  // Input
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
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.lg + 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  saveBtnDisabled: {
    backgroundColor: colors.surface,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveText: {
    ...typography.label,
    fontSize: 16,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing['3xl'],
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalIconWrap: {
    marginBottom: spacing.xl,
  },
  modalTitle: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalQuestion: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: spacing['2xl'],
  },
  modalBtnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['3xl'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    width: '100%',
    justifyContent: 'center',
    ...shadows.glow,
  },
  modalBtnPrimaryText: {
    ...typography.label,
    fontSize: 15,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  modalBtnSecondary: {
    borderRadius: borderRadius.full,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['3xl'],
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modalBtnSecondaryText: {
    ...typography.label,
    fontSize: 15,
    color: colors.textSecondary,
  },
});
