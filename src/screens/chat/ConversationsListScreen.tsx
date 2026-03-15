/**
 * Conversations list screen
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { getConversationsForUser, getMessages } from '@/services/conversationService';
import { getUserProfile } from '@/services/userService';
import { useAuth } from '@/features/auth/AuthContext';
import type { Conversation } from '@/types';

export function ConversationsListScreen({
  navigation,
}: {
  navigation: { navigate: (s: string, p: object) => void };
}): React.JSX.Element {
  const { userId } = useAuth();
  const [conversations, setConversations] = useState<
    Array<Conversation & { otherName?: string; lastMessage?: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (): Promise<void> => {
    if (!userId) return;
    try {
      const list = await getConversationsForUser(userId);
      const enriched = await Promise.all(
        list.map(async (c) => {
          const otherId = c.participantIds.find((id) => id !== userId);
          const other = otherId ? await getUserProfile(otherId) : null;
          const msgs = await getMessages(c.id, 1);
          const last = msgs[0];
          return {
            ...c,
            otherName: other?.displayName || other?.email || 'Unknown',
            lastMessage: last?.text,
          };
        })
      );
      setConversations(enriched);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [userId]);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          className="mx-4 my-2 p-4 bg-white rounded-lg border border-slate-200"
          onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
          activeOpacity={0.7}
        >
          <View className="flex-row justify-between">
            <Text className="font-semibold text-slate-800">{item.otherName}</Text>
            <Text className="text-xs text-slate-400 capitalize">{item.type}</Text>
          </View>
          {item.lastMessage && (
            <Text className="text-slate-600 mt-1" numberOfLines={1}>
              {item.lastMessage}
            </Text>
          )}
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View className="p-8 items-center">
          <Text className="text-slate-500">No conversations yet</Text>
        </View>
      }
    />
  );
}
