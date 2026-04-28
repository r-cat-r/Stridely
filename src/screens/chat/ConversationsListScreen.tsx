/**
 * Conversations list screen
 *
 * Shows all conversations with a FAB to start new chats with friends.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  StyleSheet,
} from 'react-native';
import { FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getConversationsForUser,
  getMessages,
  createConversation,
} from '@/services/conversationService';
import { getInvitesForUser, getSentInvites } from '@/services/inviteService';
import { getUserProfile } from '@/services/userService';
import { useAuth } from '@/features/auth/AuthContext';
import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';
import type { Conversation, UserProfile } from '@/types';

interface EnrichedConversation extends Conversation {
  otherName: string;
  otherPhoto: string | null;
  lastMessage?: string;
  otherInitial: string;
}

export function ConversationsListScreen({
  navigation,
}: {
  navigation: { navigate: (s: string, p: object) => void };
}): React.JSX.Element {
  const { userId } = useAuth();
  const [conversations, setConversations] = useState<EnrichedConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [friendProfiles, setFriendProfiles] = useState<UserProfile[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const load = useCallback(async (): Promise<void> => {
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
            otherPhoto: other?.photoURL ?? null,
            otherInitial: (other?.displayName?.[0] || other?.email?.[0] || '?').toUpperCase(),
            lastMessage: last?.text,
          };
        })
      );
      setConversations(enriched);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const openNewChat = useCallback(async () => {
    if (!userId) return;
    setShowNewChat(true);
    setLoadingFriends(true);
    try {
      const [received, sent] = await Promise.all([
        getInvitesForUser(userId),
        getSentInvites(userId),
      ]);
      const acceptedInvites = [
        ...received.filter((i) => i.status === 'accepted'),
        ...sent.filter((i) => i.status === 'accepted'),
      ];
      const seen = new Set<string>();
      const profiles: UserProfile[] = [];
      for (const inv of acceptedInvites) {
        const otherId = inv.fromUserId === userId ? inv.toUserId : inv.fromUserId;
        if (seen.has(otherId)) continue;
        seen.add(otherId);
        const p = await getUserProfile(otherId);
        if (p) profiles.push(p);
      }
      setFriendProfiles(profiles);
    } finally {
      setLoadingFriends(false);
    }
  }, [userId]);

  const startChat = useCallback(
    async (friendId: string) => {
      if (!userId) return;
      setShowNewChat(false);
      // Check if conversation already exists
      const existing = conversations.find(
        (c) =>
          c.type === 'buddy' &&
          c.participantIds.includes(friendId) &&
          c.participantIds.includes(userId)
      );
      if (existing) {
        navigation.navigate('ChatDetail', { conversationId: existing.id });
        return;
      }
      const conv = await createConversation('buddy', [userId, friendId]);
      navigation.navigate('ChatDetail', { conversationId: conv.id });
    },
    [userId, conversations, navigation]
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          conversations.length === 0 ? styles.emptyContainer : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('ChatDetail', { conversationId: item.id })
            }
            activeOpacity={0.7}
          >
            <View style={styles.cardRow}>
              {item.otherPhoto ? (
                <Image
                  source={{ uri: item.otherPhoto }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>{item.otherInitial}</Text>
                </View>
              )}
              <View style={styles.cardInfo}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.otherName}
                  </Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{item.type}</Text>
                  </View>
                </View>
                {item.lastMessage ? (
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                ) : (
                  <Text style={styles.noMessage}>No messages yet</Text>
                )}
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={colors.textMuted}
              />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons
                name="chat-outline"
                size={56}
                color={colors.textMuted}
              />
            </View>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>
              Start a chat with one of your{'\n'}buddy connections
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        color={colors.textOnPrimary}
        onPress={openNewChat}
      />

      {/* New Chat modal */}
      <Modal
        visible={showNewChat}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNewChat(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Chat</Text>
              <TouchableOpacity onPress={() => setShowNewChat(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {loadingFriends ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : friendProfiles.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={styles.modalEmptyText}>
                  No connections yet. Accept buddy invites to start chatting.
                </Text>
              </View>
            ) : (
              <FlatList
                data={friendProfiles}
                keyExtractor={(p) => p.id}
                renderItem={({ item: p }) => {
                  const sport = p.sportsProfiles.find(
                    (s) => s.id === p.activeSportId
                  );
                  return (
                    <TouchableOpacity
                      style={styles.friendRow}
                      onPress={() => startChat(p.id)}
                      activeOpacity={0.7}
                    >
                      {p.photoURL ? (
                        <Image
                          source={{ uri: p.photoURL }}
                          style={styles.friendAvatar}
                        />
                      ) : (
                        <View
                          style={[
                            styles.friendAvatar,
                            styles.friendAvatarPlaceholder,
                          ]}
                        >
                          <Text style={styles.friendAvatarText}>
                            {(p.displayName?.[0] || '?').toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.friendName}>
                          {p.displayName || p.email}
                        </Text>
                        {sport && (
                          <Text style={styles.friendSport}>
                            {sport.sport} • {sport.distance}km
                          </Text>
                        )}
                      </View>
                      <MaterialCommunityIcons
                        name="chat-plus-outline"
                        size={22}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  );
                }}
              />
            )}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  list: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  emptyContainer: { flex: 1 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['4xl'],
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.sm },
  emptySubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  cardInfo: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cardName: { ...typography.h3, color: colors.text, flex: 1, marginRight: 8 },
  typeBadge: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  typeBadgeText: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  lastMessage: { ...typography.bodySmall, color: colors.textSecondary },
  noMessage: { ...typography.bodySmall, color: colors.textMuted, fontStyle: 'italic' },

  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: { ...typography.h2, color: colors.text },
  modalLoading: { padding: spacing['4xl'], alignItems: 'center' },
  modalEmpty: { padding: spacing['3xl'] },
  modalEmptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },

  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: spacing.md,
  },
  friendAvatarPlaceholder: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: { fontSize: 18, color: colors.textOnPrimary, fontWeight: '600' },
  friendName: { ...typography.h3, color: colors.text },
  friendSport: { ...typography.caption, color: colors.primary },
});
