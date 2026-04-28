/**
 * Profile screen - athlete-style
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '@/features/auth/AuthContext';
import { useLocation } from '@/hooks/useLocation';
import { updateUserProfile } from '@/services/userService';
import { seedDemoData } from '@/services/demoSeedService';
import { AthleteProfileCard } from '@/components/AthleteProfileCard';
import type { ProfileStackParamList } from '@/navigation/stacks/ProfileStack';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props): React.JSX.Element {
  const { userId, profile, loading, error, refreshProfile, signOut } = useAuth();
  const { coordinates, loading: locLoading, refresh } = useLocation();
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (
      coordinates &&
      userId &&
      (profile?.coordinates?.latitude !== coordinates.latitude ||
        profile?.coordinates?.longitude !== coordinates.longitude)
    ) {
      updateUserProfile(userId, { coordinates }).then(refreshProfile);
    }
  }, [coordinates, userId, profile?.coordinates, refreshProfile]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text className="text-slate-600">Loading...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-slate-50">
        <Text className="text-slate-600 mb-4">Profile not found</Text>
        <Button mode="contained" onPress={refreshProfile} buttonColor="#FC4C02">
          Create Profile
        </Button>
      </View>
    );
  }

  if (profile.sportsProfiles.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-slate-50">
        <Text className="text-slate-600 mb-4">No sports profiles yet</Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('SportsProfiles')}
          buttonColor="#FC4C02"
        >
          Create Sports Profile
        </Button>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50">
      {error && (
        <View className="mx-4 mt-4 p-3 bg-red-100 rounded-lg">
          <Text className="text-red-700">{error.message}</Text>
        </View>
      )}
      <AthleteProfileCard profile={profile} />
      <View className="px-4 pb-8">
        {locLoading ? (
          <Text className="text-slate-500 mb-4">Getting location...</Text>
        ) : coordinates ? (
          <View className="flex-row items-center mb-4">
            <Text className="text-slate-500">Location enabled</Text>
          </View>
        ) : (
          <Button mode="outlined" onPress={refresh} style={{ marginBottom: 16 }}>
            Enable location
          </Button>
        )}
        <Button
          mode="contained"
          onPress={() => navigation.navigate('EditProfile')}
          buttonColor="#FC4C02"
          style={{ marginBottom: 12 }}
        >
          Edit profile
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('SportsProfiles')}
          style={{ marginBottom: 12 }}
        >
          Sports profiles
        </Button>
        {__DEV__ && coordinates && (
          <Button
            mode="outlined"
            onPress={async () => {
              if (!userId || !coordinates) return;
              setSeeding(true);
              try {
                await seedDemoData(userId, coordinates, profile?.sportsProfiles?.find((s) => s.id === profile?.activeSportId)?.sport);
                await refreshProfile();
              } finally {
                setSeeding(false);
              }
            }}
            loading={seeding}
            disabled={seeding}
            style={{ marginBottom: 12 }}
          >
            Seed demo data (dev)
          </Button>
        )}
        <Button mode="text" onPress={signOut} textColor="#ef4444">
          Sign out
        </Button>
      </View>
    </ScrollView>
  );
}
