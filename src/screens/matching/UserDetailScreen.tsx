/**
 * User detail - athlete profile and invite
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Button } from 'react-native-paper';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { getUserProfile } from '@/services/userService';
import { sendInvite } from '@/services/inviteService';
import { AthleteProfileCard } from '@/components/AthleteProfileCard';
import type { UserProfile } from '@/types';
import type { FindBuddyStackParamList } from '@/navigation/stacks/FindBuddyStack';
import { useAuth } from '@/features/auth/AuthContext';

type Props = NativeStackScreenProps<FindBuddyStackParamList, 'UserDetail'>;

export function UserDetailScreen({ route, navigation }: Props): React.JSX.Element {
  const { userId } = route.params;
  const { userId: myId, profile: myProfile } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async (): Promise<void> => {
    try {
      const p = await getUserProfile(userId);
      setUser(p);
    } catch {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleSendInvite = async (): Promise<void> => {
    if (!myId || !myProfile?.activeSportId || !user) return;
    setSending(true);
    setError(null);
    try {
      await sendInvite(myId, userId, myProfile.activeSportId);
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#FC4C02" />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-slate-50">
        <Text className="text-slate-600">User not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <AthleteProfileCard profile={user} />
      <View className="px-4 pb-8">
        {error && (
          <View className="mb-4 p-3 bg-red-100 rounded-lg">
            <Text className="text-red-700">{error}</Text>
          </View>
        )}
        {myId !== userId && myProfile?.activeSportId && (
          <Button
            mode="contained"
            onPress={handleSendInvite}
            loading={sending}
            disabled={sending}
            buttonColor="#22C55E"
          >
            Send buddy invite
          </Button>
        )}
      </View>
    </ScrollView>
  );
}
