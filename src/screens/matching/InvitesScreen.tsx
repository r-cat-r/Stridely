/**
 * Invites screen — view and respond to buddy invites
 *
 * Premium card design with accept/reject actions.
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
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getInvitesForUser, respondToInvite } from '@/services/inviteService';
import { createConversation } from '@/services/conversationService';
import { getUserProfile } from '@/services/userService';
import { useAuth } from '@/features/auth/AuthContext';
import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';
import type { BuddyInvite, UserProfile } from '@/types';

interface EnrichedInvite extends BuddyInvite {
  fromProfile: UserProfile | null;
}

export function InvitesScreen(): React.JSX.Element {
  const { userId } = useAuth();
  const [invites, setInvites] = useState<EnrichedInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const loadInvites = useCallback(async (): Promise<void> => {
    if (!userId) return;
    try {
      const list = await getInvitesForUser(userId);
      const pending = list.filter((i) => i.status === 'pending');
      const enriched = await Promise.all(
        pending.map(async (inv) => {
          const fromProfile = await getUserProfile(inv.fromUserId);
          return { ...inv, fromProfile };
        })
      );
      setInvites(enriched);
    } catch (err) {
      console.error('[INVITES] Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {invites.length > 0 && (
        <View style={styles.headerBar}>
          <Text style={styles.headerCount}>
            {invites.length} pending invite{invites.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <FlatList
        data={invites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          invites.length === 0 ? styles.emptyContainer : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadInvites();
            }}
            colors={[colors.primary]}
          />
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
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons
                name="email-open-outline"
                size={56}
                color={colors.textMuted}
              />
            </View>
            <Text style={styles.emptyTitle}>No pending invites</Text>
            <Text style={styles.emptySubtitle}>
              When someone wants to train with{'\n'}you, their invite will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

function InviteCard({
  invite,
  onAccept,
  onReject,
  loading,
}: {
  invite: EnrichedInvite;
  onAccept: () => void;
  onReject: () => void;
  loading: boolean;
}): React.JSX.Element {
  const profile = invite.fromProfile;
  const activeSport = profile?.sportsProfiles.find(
    (p) => p.id === profile.activeSportId
  );

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {/* Avatar */}
        {profile?.photoURL ? (
          <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {(profile?.displayName?.[0] || '?').toUpperCase()}
            </Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {profile?.displayName || profile?.email || 'Someone'}
          </Text>
          <Text style={styles.subtitle}>wants to be your training buddy</Text>
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
                {activeSport.sport} • {activeSport.distance}km • {activeSport.pace}
              </Text>
            </View>
          )}
          {invite.message && (
            <Text style={styles.inviteMessage} numberOfLines={2}>
              "{invite.message}"
            </Text>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={onReject}
          disabled={loading}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
          <Text style={[styles.actionText, { color: colors.textMuted }]}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.acceptBtn]}
          onPress={onAccept}
          disabled={loading}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="check" size={20} color={colors.accent} />
          <Text style={[styles.actionText, { color: colors.accent }]}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  headerBar: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  headerCount: { ...typography.label, color: colors.textMuted },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
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
  emptySubtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center' },

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
  info: { flex: 1 },
  name: { ...typography.h3, color: colors.text, marginBottom: 2 },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: 4 },
  sportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  sportText: { ...typography.caption, color: colors.primary, fontWeight: '500' },
  inviteMessage: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
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
    paddingVertical: spacing.md + 2,
    gap: 6,
  },
  rejectBtn: {
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
  },
  acceptBtn: {},
  actionText: { ...typography.label },
});
