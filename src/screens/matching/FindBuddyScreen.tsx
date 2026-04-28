/**
 * Find Buddy - swipe-based athlete discovery
 *
 * Filters out users who already have pending/accepted invites
 * to prevent them from showing up again after swiping.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useAuth } from '@/features/auth/AuthContext';
import { discoverAthletes } from '@/services/matchingService';
import { sendInvite, getSentInvites } from '@/services/inviteService';
import { SwipeableCardStack } from '@/components/SwipeableCardStack';
import { ErrorView } from '@/components/ErrorView';
import type { DiscoveryMatch } from '@/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FindBuddyStackParamList } from '@/navigation/stacks/FindBuddyStack';

type Props = NativeStackScreenProps<FindBuddyStackParamList, 'FindBuddyList'>;

export function FindBuddyScreen({ navigation }: Props): React.JSX.Element {
  const { userId, profile } = useAuth();
  const [matches, setMatches] = useState<DiscoveryMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Track invited user IDs to filter them from results
  const invitedIdsRef = useRef<Set<string>>(new Set());

  const radius = profile?.searchRadiusKm ?? 5;
  const coordLat = profile?.coordinates?.latitude;
  const coordLng = profile?.coordinates?.longitude;
  const activeSportId = profile?.activeSportId;

  const loadMatches = useCallback(async (): Promise<void> => {
    if (!userId || !activeSportId || !coordLat || !coordLng) {
      setMatches([]);
      setLoading(false);
      return;
    }
    try {
      // Fetch matches and sent invites in parallel
      const [result, sentInvites] = await Promise.all([
        discoverAthletes(userId, radius),
        getSentInvites(userId),
      ]);

      // Build set of users we've already invited (pending or accepted)
      const alreadyInvited = new Set(
        sentInvites
          .filter((inv) => inv.status === 'pending' || inv.status === 'accepted')
          .map((inv) => inv.toUserId)
      );

      // Merge with locally-tracked invites from this session
      invitedIdsRef.current.forEach((id) => alreadyInvited.add(id));

      // Filter out already-invited users and self
      const filtered = result.filter(
        (m) => !alreadyInvited.has(m.user.id) && m.user.id !== userId
      );

      setMatches(filtered);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matches');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, activeSportId, coordLat, coordLng, radius]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const handleInvite = useCallback(
    async (match: DiscoveryMatch): Promise<void> => {
      if (!userId || !activeSportId) return;
      try {
        await sendInvite(userId, match.user.id, activeSportId);
        invitedIdsRef.current.add(match.user.id);
        setMatches((prev) => prev.filter((m) => m.user.id !== match.user.id));
      } catch (err) {
        console.error('[FIND_BUDDY] Invite error:', err);
      }
    },
    [userId, activeSportId]
  );

  const handleSkip = useCallback((match: DiscoveryMatch): void => {
    setMatches((prev) => prev.filter((m) => m.user.id !== match.user.id));
  }, []);

  const handleViewProfile = useCallback(
    (match: DiscoveryMatch): void => {
      navigation.navigate('UserDetail', { userId: match.user.id });
    },
    [navigation]
  );

  if (!profile?.activeSportId) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-center text-slate-600 mb-4">
          Set your active sport in Profile to discover athletes.
        </Text>
      </View>
    );
  }

  if (!profile?.coordinates) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-center text-slate-600">
          Enable location to find nearby athletes.
        </Text>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#FC4C02" />
        <Text className="mt-4 text-slate-600">Finding athletes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ErrorView
        message={error}
        onRetry={() => {
          setError(null);
          setLoading(true);
          loadMatches();
        }}
      />
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadMatches();
          }}
        />
      }
    >
      <View className="px-4 pt-2 pb-4">
        <Text className="text-sm text-slate-600 text-center">
          Swipe right to invite • Swipe left to skip
        </Text>
        <Text className="text-xs text-slate-500 text-center mt-1">
          {radius}km radius • {matches.length} athletes
        </Text>
      </View>
      <View style={{ flex: 1, minHeight: 520 }}>
        {matches.length > 0 ? (
          <SwipeableCardStack
            matches={matches}
            onInvite={handleInvite}
            onSkip={handleSkip}
            onViewProfile={handleViewProfile}
          />
        ) : (
          <View className="flex-1 items-center justify-center p-8">
            <Text className="text-center text-slate-600 mb-2">
              No athletes found in your area.
            </Text>
            <Text className="text-center text-slate-500 text-sm">
              Try increasing your search radius in Profile.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
