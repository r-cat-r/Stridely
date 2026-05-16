/**
 * Edit profile screen - photo, bio, search radius
 * Profile images are stored as base64 data URIs in Firestore.
 * Updated for dark theme.
 */

import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/AuthContext';
import { updateUserProfile } from '@/services/userService';
import { pickAndEncodeProfileImage } from '@/utils/profileImage';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';

export function EditProfileScreen({
  navigation,
}: {
  navigation: { goBack: () => void };
}): React.JSX.Element {
  const { userId, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [searchRadiusKm, setSearchRadiusKm] = useState<3 | 5 | 10 | 20>(
    profile?.searchRadiusKm ?? 5
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const RADII: Array<3 | 5 | 10 | 20> = [3, 5, 10, 20];

  const inputTheme = {
    colors: {
      onSurfaceVariant: colors.textMuted,
      surface: colors.surface,
    },
  };

  const handleSave = async (): Promise<void> => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      await updateUserProfile(userId, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        searchRadiusKm,
      });
      await refreshProfile();
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async (): Promise<void> => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const dataUri = await pickAndEncodeProfileImage();
      if (dataUri) {
        await updateUserProfile(userId, { photoURL: dataUri });
        await refreshProfile();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Photo section */}
      <View style={styles.photoSection}>
        <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} disabled={loading}>
          <View style={styles.avatarWrap}>
            {profile?.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {displayName[0] ?? profile?.email[0] ?? '?'}
                </Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <MaterialCommunityIcons name="camera" size={14} color={colors.textOnPrimary} />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.changePhotoText}>Tap to change photo</Text>
      </View>

      {/* Inputs */}
      <TextInput
        label="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        mode="outlined"
        outlineColor={colors.border}
        activeOutlineColor={colors.primary}
        textColor={colors.text}
        style={styles.input}
        theme={inputTheme}
      />

      <TextInput
        label="Bio"
        value={bio}
        onChangeText={setBio}
        mode="outlined"
        multiline
        numberOfLines={3}
        outlineColor={colors.border}
        activeOutlineColor={colors.primary}
        textColor={colors.text}
        style={styles.input}
        theme={inputTheme}
      />

      {/* Search radius */}
      <Text style={styles.label}>Search radius (km)</Text>
      <View style={styles.radiusRow}>
        {RADII.map((r) => (
          <TouchableOpacity
            key={r}
            style={[
              styles.radiusChip,
              searchRadiusKm === r && styles.radiusChipSelected,
            ]}
            onPress={() => setSearchRadiusKm(r)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.radiusChipText,
                searchRadiusKm === r && styles.radiusChipTextSelected,
              ]}
            >
              {r} km
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.saveBtnText}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    color: colors.textMuted,
    fontWeight: '700',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  changePhotoText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  input: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  radiusChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  radiusChipSelected: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  radiusChipText: {
    ...typography.label,
    color: colors.textMuted,
  },
  radiusChipTextSelected: {
    color: colors.primary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.md,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    flex: 1,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.lg + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    ...shadows.glow,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    ...typography.label,
    fontSize: 16,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
});
