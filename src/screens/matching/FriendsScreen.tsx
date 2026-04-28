/**
 * Friends screen - shows accepted buddy connections
 *
 * Each friend card shows profile info with actions:
 * - View Profile → navigate to UserDetail
 * - Chat → find/create conversation and navigate
 * - Remove → delete the buddy invite
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
  Alert,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getInvitesForUser, getSentInvites, deleteInvite } from '@/services/inviteService';
import { getUserProfile } from '@/services/userService';
import {
  getConversationsForUser,
  createConversation,
} from '@/services/conversationService';
import { useAuth } from '@/features/auth/AuthContext';
import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';
import type { UserProfile, BuddyInvite } from '@/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FindBuddyStackParamList } from '@/navigation/stacks/FindBuddyStack';

type Props = NativeStackScreenProps<FindBuddyStackParamList, 'Friends'>;

interface Friend {
  profile: UserProfile;
  invite: BuddyInvite;
  conversationId: string | null;
}

export function FriendsScreen({ navigation }: Props): React.JSX.Element {
  const { userId } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFriends = useCallback(async (): Promise<void> => {
    if (!userId) return;
    try {
      const [received, sent, conversations] = await Promise.all([
        getInvitesForUser(userId),
        getSentInvites(userId),
        getConversationsForUser(userId),
      ]);

      const acceptedInvites = [
        ...received.filter((i) => i.status === 'accepted'),
        ...sent.filter((i) => i.status === 'accepted'),
      ];

      // Deduplicate by other user's ID
      const seen = new Set<string>();
      const uniqueInvites: BuddyInvite[] = [];
      for (const inv of acceptedInvites) {
        const otherId = inv.fromUserId === userId ? inv.toUserId : inv.fromUserId;
        if (!seen.has(otherId)) {
          seen.add(otherId);
          uniqueInvites.push(inv);
        }
      }

      const buddyConversations = conversations.filter((c) => c.type === 'buddy');
      const friendsList: Friend[] = [];

      for (const inv of uniqueInvites) {
        const otherId = inv.fromUserId === userId ? inv.toUserId : inv.fromUserId;
        const profile = await getUserProfile(otherId);
        if (!profile) continue;
        const conv = buddyConversations.find(
          (c) =>
            c.participantIds.includes(otherId) &&
            c.participantIds.includes(userId)
        );
        friendsList.push({ profile, invite: inv, conversationId: conv?.id ?? null });
      }

      setFriends(friendsList);
    } catch (err) {
      console.error('[FRIENDS] Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const handleViewProfile = useCallback(
    (friendUserId: string) => {
      navigation.navigate('UserDetail', { userId: friendUserId });
    },
    [navigation]
  );

  const handleChat = useCallback(
    async (friend: Friend) => {
      if (!userId) return;
      let conversationId = friend.conversationId;
      if (!conversationId) {
        // Create a new buddy conversation
        const conv = await createConversation('buddy', [userId, friend.profile.id]);
        conversationId = conv.id;
      }
      // Navigate to the Chat tab and into the chat detail
      navigation.getParent()?.navigate('Chat', {
        screen: 'ChatDetail',
        params: { conversationId },
      });
    },
    [userId, navigation]
  );

  const handleRemove = useCallback(
    (friend: Friend) => {
      Alert.alert(
        'Remove Connection',
        `Remove ${friend.profile.displayName || 'this athlete'} from your connections?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteInvite(friend.invite.id);
                setFriends((prev) =>
                  prev.filter((f) => f.profile.id !== friend.profile.id)
                );
              } catch (err) {
                console.error('[FRIENDS] Remove error:', err);
              }
            },
          },
        ]
      );
    },
    []
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
        data={friends}
        keyExtractor={(item) => item.profile.id}
        contentContainerStyle={
          friends.length === 0 ? styles.emptyContainer : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadFriends();
            }}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => (
          <FriendCard
            friend={item}
            onViewProfile={() => handleViewProfile(item.profile.id)}
            onChat={() => handleChat(item)}
            onRemove={() => handleRemove(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={56}
                color={colors.textMuted}
              />
            </View>
            <Text style={styles.emptyTitle}>No connections yet</Text>
            <Text style={styles.emptySubtitle}>
              Accept or send buddy invites to connect{'\n'}with athletes near you
            </Text>
          </View>
        }
      />
    </View>
  );
}

interface FriendCardProps {
  friend: Friend;
  onViewProfile: () => void;
  onChat: () => void;
  onRemove: () => void;
}

function FriendCard({
  friend,
  onViewProfile,
  onChat,
  onRemove,
}: FriendCardProps): React.JSX.Element {
  const { profile } = friend;
  const activeSport = profile.sportsProfiles.find(
    (p) => p.id === profile.activeSportId
  );

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onViewProfile}
      activeOpacity={0.85}
    >
      <View style={styles.cardContent}>
        {/* Avatar */}
        {profile.photoURL ? (
          <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {profile.displayName?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {profile.displayName || profile.email}
          </Text>
          {activeSport && (
            <View style={styles.sportRow}>
              <MaterialCommunityIcons
                name={
                  activeSport.sport === 'Cycling'
                    ? 'bike'
                    : activeSport.sport === 'Swimming'
                      ? 'swim'
                      : 'run'
                }
                size={14}
                color={colors.primary}
              />
              <Text style={styles.sportText}>
                {activeSport.sport} • {activeSport.distance}km
              </Text>
            </View>
          )}
          {profile.bio ? (
            <Text style={styles.bio} numberOfLines={1}>
              {profile.bio}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.chatBtn]}
          onPress={onChat}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="chat-outline" size={18} color={colors.secondary} />
          <Text style={[styles.actionText, { color: colors.secondary }]}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.removeBtn]}
          onPress={onRemove}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="account-remove-outline" size={18} color={colors.error} />
          <Text style={[styles.actionText, { color: colors.error }]}>Remove</Text>
        </TouchableOpacity>
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
  },
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.md,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: spacing.lg,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 2,
  },
  sportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  sportText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  bio: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: 6,
  },
  chatBtn: {
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
  },
  removeBtn: {},
  actionText: {
    ...typography.label,
  },
});
