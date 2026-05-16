/**
 * Find Buddy - swipe-based athlete discovery
 *
 * Filters out users who already have pending/accepted invites
 * to prevent them from showing up again after swiping.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/AuthContext';
import { discoverAthletes } from '@/services/matchingService';
import { sendInvite, getSentInvites } from '@/services/inviteService';
import { getBlockedUserIds } from '@/services/blockService';
import { SwipeableCardStack } from '@/components/SwipeableCardStack';
import { ErrorView } from '@/components/ErrorView';
import { colors, spacing, typography } from '@/constants/theme';
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
      // Fetch matches, sent invites, and blocked users in parallel
      const [result, sentInvites, blockedIds] = await Promise.all([
        discoverAthletes(userId, radius),
        getSentInvites(userId),
        getBlockedUserIds(userId),
      ]);

      // Build set of users we've already invited (pending or accepted)
      const alreadyInvited = new Set(
        sentInvites
          .filter((inv) => inv.status === 'pending' || inv.status === 'accepted')
          .map((inv) => inv.toUserId)
      );

      // Build set of blocked users
      const blockedSet = new Set(blockedIds);

      // Merge with locally-tracked invites from this session
      invitedIdsRef.current.forEach((id) => alreadyInvited.add(id));

      // Filter out already-invited, blocked, and self
      const filtered = result.filter(
        (m) =>
          !alreadyInvited.has(m.user.id) &&
          !blockedSet.has(m.user.id) &&
          m.user.id !== userId
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
      <View style={styles.centered}>
        <View style={styles.emptyIconWrap}>
          <MaterialCommunityIcons name="dumbbell" size={40} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No active sport</Text>
        <Text style={styles.emptySubtitle}>
          Set your active sport in Profile to discover athletes.
        </Text>
      </View>
    );
  }

  if (!profile?.coordinates) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyIconWrap}>
          <MaterialCommunityIcons name="crosshairs-gps" size={40} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Location required</Text>
        <Text style={styles.emptySubtitle}>
          Enable location to find nearby athletes.
        </Text>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Finding athletes...</Text>
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
      style={styles.screen}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadMatches();
          }}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.headerInfo}>
        <Text style={styles.headerHint}>
          Swipe right to invite • Swipe left to skip
        </Text>
        <Text style={styles.headerStats}>
          {radius}km radius • {matches.length} athlete{matches.length !== 1 ? 's' : ''}
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
          <View style={styles.centered}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="account-search-outline" size={40} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No athletes found</Text>
            <Text style={styles.emptySubtitle}>
              Try increasing your search radius in Profile.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing['3xl'],
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
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
  headerInfo: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerHint: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  headerStats: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
});
