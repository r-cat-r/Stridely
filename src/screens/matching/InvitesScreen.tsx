/**
 * Invites screen - view and respond to buddy invites
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Button } from 'react-native-paper';
import { getInvitesForUser, respondToInvite } from '@/services/inviteService';
import { createConversation } from '@/services/conversationService';
import { getUserProfile } from '@/services/userService';
import { useAuth } from '@/features/auth/AuthContext';
import type { BuddyInvite } from '@/types';

export function InvitesScreen(): React.JSX.Element {
  const { userId } = useAuth();
  const [invites, setInvites] = useState<BuddyInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const loadInvites = useCallback(async (): Promise<void> => {
    if (!userId) return;
    try {
      setError(null);
      const list = await getInvitesForUser(userId);
      setInvites(list.filter((i) => i.status === 'pending'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invites');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      if (__DEV__) console.log('[INVITES] No userId, skipping load');
      return;
    }
    if (__DEV__) console.log('[INVITES] Loading invites for:', userId);
    loadInvites();
  }, [userId, loadInvites]);

  const handleRespond = async (
    inviteId: string,
    accept: boolean
  ): Promise<void> => {
    if (!userId) return;
    setRespondingId(inviteId);
    try {
      await respondToInvite(inviteId, accept ? 'accepted' : 'rejected');
      if (accept) {
        const invite = invites.find((i) => i.id === inviteId);
        if (invite) {
          await createConversation('buddy', [invite.fromUserId, userId]);
        }
      }
      await loadInvites();
    } finally {
      setRespondingId(null);
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-red-600 font-bold mb-2">Error</Text>
        <Text className="text-slate-600 text-center mb-4">{error}</Text>
        <Button onPress={loadInvites}>Retry</Button>
      </View>
    );
  }

  return (
    <FlatList
      data={invites}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadInvites(); }} />
      }
      renderItem={({ item }) => (
        <InviteCard
          invite={item}
          onAccept={() => handleRespond(item.id, true)}
          onReject={() => handleRespond(item.id, false)}
          loading={respondingId === item.id}
        />
      )}
      ListEmptyComponent={
        <View className="p-8 items-center">
          <Text className="text-slate-500">No pending invites</Text>
        </View>
      }
    />
  );
}

function InviteCard({
  invite,
  onAccept,
  onReject,
  loading,
}: {
  invite: BuddyInvite;
  onAccept: () => void;
  onReject: () => void;
  loading: boolean;
}): React.JSX.Element {
  const [fromName, setFromName] = useState<string>('');

  useEffect(() => {
    getUserProfile(invite.fromUserId).then((p) => {
      setFromName(p?.displayName || p?.email || 'Someone');
    });
  }, [invite.fromUserId]);

  return (
    <View className="mx-4 my-2 p-4 bg-white rounded-lg border border-slate-200">
      <Text className="text-lg font-semibold text-slate-800">{fromName}</Text>
      <Text className="text-slate-600 mt-1">
        wants to be your buddy
        {invite.message ? `: "${invite.message}"` : ''}
      </Text>
      <View className="flex-row gap-2 mt-3">
        <Button
          mode="contained"
          onPress={onAccept}
          loading={loading}
          disabled={loading}
          compact
        >
          Accept
        </Button>
        <Button
          mode="outlined"
          onPress={onReject}
          disabled={loading}
          compact
        >
          Reject
        </Button>
      </View>
    </View>
  );
}
