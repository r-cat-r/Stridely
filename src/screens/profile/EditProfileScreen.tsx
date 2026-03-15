/**
 * Edit profile screen - photo, bio, search radius
 * Profile images are stored as base64 data URIs in Firestore.
 */

import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useAuth } from '@/features/auth/AuthContext';
import { updateUserProfile } from '@/services/userService';
import { pickAndEncodeProfileImage } from '@/utils/profileImage';

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
    <View style={styles.container}>
      <View style={styles.photoSection}>
        {profile?.photoURL ? (
          <Image
            source={{ uri: profile.photoURL }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {displayName[0] ?? profile?.email[0] ?? '?'}
            </Text>
          </View>
        )}
        <Button mode="outlined" onPress={handlePickImage} disabled={loading}>
          Change photo
        </Button>
      </View>
      <TextInput
        label="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Bio"
        value={bio}
        onChangeText={setBio}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
      />
      <View style={styles.radiusSection}>
        <Text style={styles.label}>Search radius (km)</Text>
        <View style={styles.radiusRow}>
          {RADII.map((r) => (
            <Button
              key={r}
              mode={searchRadiusKm === r ? 'contained' : 'outlined'}
              compact
              onPress={() => setSearchRadiusKm(r)}
            >
              {r}
            </Button>
          ))}
        </View>
      </View>
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
      <Button
        mode="contained"
        onPress={handleSave}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Save
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  photoSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarPlaceholder: {
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 32, color: '#94a3b8' },
  input: { marginBottom: 12 },
  radiusSection: { marginBottom: 16 },
  label: { marginBottom: 8, color: '#334155', fontWeight: '500' },
  radiusRow: { flexDirection: 'row', gap: 8 },
  button: { marginTop: 8 },
});
