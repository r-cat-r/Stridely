/**
 * User detail — athlete profile with smart CTA
 *
 * Shows appropriate action based on connection status:
 * - Not connected → "Send buddy invite"
 * - Invite pending (sent by me) → "Invite Sent" (disabled)
 * - Invite pending (sent to me) → "Accept Invite"
 * - Already connected → "Message" (navigates to chat)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { getUserProfile } from '@/services/userService';
import { sendInvite, getInvitesForUser, getSentInvites, respondToInvite } from '@/services/inviteService';
import {
  findConversationByParticipants,
  createConversation,
} from '@/services/conversationService';
import { AthleteProfileCard } from '@/components/AthleteProfileCard';
import type { UserProfile } from '@/types';
import type { FindBuddyStackParamList } from '@/navigation/stacks/FindBuddyStack';
import { useAuth } from '@/features/auth/AuthContext';
import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';

type Props = NativeStackScreenProps<FindBuddyStackParamList, 'UserDetail'>;

type ConnectionStatus = 'none' | 'invite_sent' | 'invite_received' | 'connected';

function formatLastActive(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Online now';
  if (mins < 60) return `Active ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Active yesterday';
  return `Active ${days}d ago`;
}

export function UserDetailScreen({ route, navigation }: Props): React.JSX.Element {
  const { userId } = route.params;
  const { userId: myId, profile: myProfile } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('none');
  const [inviteId, setInviteId] = useState<string | null>(null);

  const loadUser = useCallback(async (): Promise<void> => {
    if (!myId) return;
    try {
      const [profile, receivedInvites, sentInvites] = await Promise.all([
        getUserProfile(userId),
        getInvitesForUser(myId),
        getSentInvites(myId),
      ]);
      setUser(profile);

      // Determine connection status
      const accepted = [
        ...receivedInvites.filter((i) => i.status === 'accepted'),
        ...sentInvites.filter((i) => i.status === 'accepted'),
      ];
      const isConnected = accepted.some(
        (i) => i.fromUserId === userId || i.toUserId === userId
      );

      if (isConnected) {
        setConnectionStatus('connected');
      } else {
        const pendingSent = sentInvites.find(
          (i) => i.toUserId === userId && i.status === 'pending'
        );
        const pendingReceived = receivedInvites.find(
          (i) => i.fromUserId === userId && i.status === 'pending'
        );
        if (pendingSent) {
          setConnectionStatus('invite_sent');
          setInviteId(pendingSent.id);
        } else if (pendingReceived) {
          setConnectionStatus('invite_received');
          setInviteId(pendingReceived.id);
        } else {
          setConnectionStatus('none');
        }
      }
    } catch {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId, myId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleSendInvite = async (): Promise<void> => {
    if (!myId || !myProfile?.activeSportId || !user) return;
    setActionLoading(true);
    setError(null);
    try {
      await sendInvite(myId, userId, myProfile.activeSportId);
      setConnectionStatus('invite_sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptInvite = async (): Promise<void> => {
    if (!inviteId) return;
    setActionLoading(true);
    setError(null);
    try {
      await respondToInvite(inviteId, 'accepted');
      setConnectionStatus('connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessage = async (): Promise<void> => {
    if (!myId) return;
    setActionLoading(true);
    try {
      let conv = await findConversationByParticipants(myId, userId, 'buddy');
      if (!conv) {
        conv = await createConversation('buddy', [myId, userId]);
      }
      // Navigate to Chat tab with ChatDetail
      navigation.getParent()?.navigate('Chat', {
        screen: 'ChatDetail',
        params: { conversationId: conv.id },
        initial: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open chat');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="account-off-outline" size={48} color={colors.textMuted} />
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  const isOnline = Date.now() - user.lastActive < 60000;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <AthleteProfileCard profile={user} />

      {/* Last active / online indicator */}
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, isOnline && styles.statusDotOnline]} />
        <Text style={[styles.statusText, isOnline && styles.statusTextOnline]}>
          {formatLastActive(user.lastActive)}
        </Text>
      </View>

      {/* Error display */}
      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.error} />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* Smart CTA */}
      {myId !== userId && (
        <View style={styles.ctaContainer}>
          {connectionStatus === 'connected' && (
            <TouchableOpacity
              style={[styles.ctaButton, styles.ctaMessage]}
              onPress={handleMessage}
              disabled={actionLoading}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="chat-outline" size={20} color={colors.textOnPrimary} />
              <Text style={styles.ctaTextLight}>Message</Text>
            </TouchableOpacity>
          )}

          {connectionStatus === 'invite_sent' && (
            <View style={[styles.ctaButton, styles.ctaDisabled]}>
              <MaterialCommunityIcons name="check" size={20} color={colors.textMuted} />
              <Text style={styles.ctaTextMuted}>Invite Sent</Text>
            </View>
          )}

          {connectionStatus === 'invite_received' && (
            <TouchableOpacity
              style={[styles.ctaButton, styles.ctaAccept]}
              onPress={handleAcceptInvite}
              disabled={actionLoading}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="account-check-outline" size={20} color={colors.textOnPrimary} />
              <Text style={styles.ctaTextLight}>Accept Invite</Text>
            </TouchableOpacity>
          )}

          {connectionStatus === 'none' && myProfile?.activeSportId && (
            <TouchableOpacity
              style={[styles.ctaButton, styles.ctaInvite]}
              onPress={handleSendInvite}
              disabled={actionLoading}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="account-plus-outline" size={20} color={colors.textOnPrimary} />
              <Text style={styles.ctaTextLight}>Send Buddy Invite</Text>
            </TouchableOpacity>
          )}

          {actionLoading && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.ctaLoader}
            />
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing['4xl'],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.textMuted,
  },

  // Last active status
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  statusDotOnline: {
    backgroundColor: colors.accent,
  },
  statusText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '500',
  },
  statusTextOnline: {
    color: colors.accent,
    fontWeight: '600',
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.md,
  },
  errorBannerText: {
    ...typography.bodySmall,
    color: colors.error,
    flex: 1,
  },

  // CTA buttons
  ctaContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  ctaMessage: {
    backgroundColor: colors.primary,
  },
  ctaInvite: {
    backgroundColor: colors.accent,
  },
  ctaAccept: {
    backgroundColor: colors.primary,
  },
  ctaDisabled: {
    backgroundColor: colors.borderLight,
  },
  ctaTextLight: {
    ...typography.h3,
    color: colors.textOnPrimary,
    fontSize: 16,
  },
  ctaTextMuted: {
    ...typography.h3,
    color: colors.textMuted,
    fontSize: 16,
  },
  ctaLoader: {
    marginTop: spacing.sm,
  },
});
