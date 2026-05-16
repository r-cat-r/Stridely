/**
 * Conversations list screen
 *
 * Shows all conversations with Instagram DM-style unread indicators.
 * FAB to start new chats with friends.
 */

import React, { useState, useCallback, useEffect } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import {
  getConversationsForUser,
  getMessages,
  createConversation,
  findConversationByParticipants,
  subscribeToConversations,
  getUnreadCount,
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
  unreadCount: number;
  lastMessageTime: number;
}

/** Relative time label like Instagram DM */
function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
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

  const enrichConversations = useCallback(
    async (list: Conversation[]): Promise<EnrichedConversation[]> => {
      // Deduplicate: keep only the most recent conversation per buddy
      const bestPerBuddy = new Map<string, Conversation>();
      for (const c of list) {
        const otherId = c.participantIds.find((id) => id !== userId) ?? '';
        const existing = bestPerBuddy.get(otherId);
        if (!existing || c.updatedAt > existing.updatedAt) {
          bestPerBuddy.set(otherId, c);
        }
      }
      const deduplicated = Array.from(bestPerBuddy.values());

      const results: EnrichedConversation[] = [];
      for (const c of deduplicated) {
        try {
          const otherId = c.participantIds.find((id) => id !== userId);
          const other = otherId ? await getUserProfile(otherId) : null;

          let lastText = c.lastMessage;
          if (!lastText) {
            try {
              const msgs = await getMessages(c.id, 1);
              lastText = msgs[0]?.text;
            } catch {
              // Skip gracefully
            }
          }

          let unread = 0;
          try {
            unread = userId ? await getUnreadCount(c.id, userId) : 0;
          } catch {
            // Skip unread count on failure
          }

          results.push({
            ...c,
            otherName: other?.displayName || other?.email || 'Unknown',
            otherPhoto: other?.photoURL ?? null,
            otherInitial: (other?.displayName?.[0] || other?.email?.[0] || '?').toUpperCase(),
            lastMessage: lastText,
            unreadCount: unread,
            lastMessageTime: c.updatedAt,
          });
        } catch {
          results.push({
            ...c,
            otherName: 'Unknown',
            otherPhoto: null,
            otherInitial: '?',
            lastMessage: c.lastMessage,
            unreadCount: 0,
            lastMessageTime: c.updatedAt,
          });
        }
      }
      return results;
    },
    [userId]
  );

  const load = useCallback(async (): Promise<void> => {
    if (!userId) return;
    try {
      const list = await getConversationsForUser(userId);
      setConversations(await enrichConversations(list));
    } catch (err) {
      console.error('[CONVERSATIONS] Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [enrichConversations, userId]);

  // Real-time subscription — debounced to avoid overwriting focus-triggered load
  useEffect(() => {
    if (!userId) return;
    let active = true;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const unsub = subscribeToConversations(userId, (list) => {
      if (!active) return;
      // Debounce: wait 1.5s before re-enriching so focus load takes priority
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        if (!active) return;
        try {
          setLoading(false);
          setConversations(await enrichConversations(list));
        } catch (err) {
          console.error('[CONVERSATIONS] Subscription error:', err);
        }
      }, 1500);
    });

    return () => {
      active = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      unsub();
    };
  }, [enrichConversations, userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openNewChat = useCallback(async () => {
    if (!userId) return;
    setShowNewChat(true);
    setLoadingFriends(true);
    try {
      const [received, sent, existingConvos] = await Promise.all([
        getInvitesForUser(userId),
        getSentInvites(userId),
        getConversationsForUser(userId),
      ]);

      // Collect IDs of buddies who already have a conversation
      const buddiesWithChat = new Set<string>();
      for (const c of existingConvos) {
        if (c.type === 'buddy') {
          const otherId = c.participantIds.find((id) => id !== userId);
          if (otherId) buddiesWithChat.add(otherId);
        }
      }

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
        // Skip buddies who already have a conversation
        if (buddiesWithChat.has(otherId)) continue;
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

      const existing = await findConversationByParticipants(userId, friendId, 'buddy');
      if (existing) {
        navigation.navigate('ChatDetail', { conversationId: existing.id });
        return;
      }

      const conv = await createConversation('buddy', [userId, friendId]);
      const friendProfile = friendProfiles.find((p) => p.id === friendId) ??
        (await getUserProfile(friendId));

      setConversations((prev) => [
        {
          ...conv,
          otherName: friendProfile?.displayName || friendProfile?.email || 'Unknown',
          otherPhoto: friendProfile?.photoURL ?? null,
          otherInitial: (friendProfile?.displayName?.[0] || friendProfile?.email?.[0] || '?').toUpperCase(),
          lastMessage: undefined,
          unreadCount: 0,
          lastMessageTime: conv.updatedAt,
        },
        ...prev,
      ]);
      navigation.navigate('ChatDetail', { conversationId: conv.id });
    },
    [userId, friendProfiles, navigation]
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
          <ConversationCard
            conversation={item}
            onPress={() =>
              navigation.navigate('ChatDetail', { conversationId: item.id })
            }
          />
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

/** Single conversation card with Instagram DM-style unread indicator */
function ConversationCard({
  conversation,
  onPress,
}: {
  conversation: EnrichedConversation;
  onPress: () => void;
}): React.JSX.Element {
  const hasUnread = conversation.unreadCount > 0;

  const previewText = (): string => {
    if (!hasUnread) {
      return conversation.lastMessage || 'No messages yet';
    }
    if (conversation.unreadCount === 1) {
      return conversation.lastMessage || 'New message';
    }
    return `${conversation.unreadCount} new messages`;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardRow}>
        {/* Avatar */}
        {conversation.otherPhoto ? (
          <Image
            source={{ uri: conversation.otherPhoto }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{conversation.otherInitial}</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.cardInfo}>
          <View style={styles.cardHeader}>
            <Text
              style={[styles.cardName, hasUnread && styles.cardNameUnread]}
              numberOfLines={1}
            >
              {conversation.otherName}
            </Text>
            <Text
              style={[
                styles.timeLabel,
                hasUnread && styles.timeLabelUnread,
              ]}
            >
              {formatRelativeTime(conversation.lastMessageTime)}
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text
              style={[
                styles.previewText,
                hasUnread && styles.previewTextUnread,
                !conversation.lastMessage && !hasUnread && styles.noMessage,
              ]}
              numberOfLines={1}
            >
              {previewText()}
            </Text>
            {hasUnread && <View style={styles.unreadDot} />}
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
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

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  cardInfo: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  cardName: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
    marginRight: 8,
    fontSize: 16,
  },
  cardNameUnread: {
    fontWeight: '700',
  },
  timeLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  timeLabelUnread: {
    color: colors.secondary,
    fontWeight: '600',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  previewTextUnread: {
    color: colors.text,
    fontWeight: '700',
  },
  noMessage: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.secondary,
  },

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
