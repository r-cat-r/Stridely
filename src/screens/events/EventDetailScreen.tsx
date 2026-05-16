/**
 * Event detail — premium card-based layout
 *
 * Hero header, info cards, participant badge, and action buttons.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  getEvent,
  requestToJoinEvent,
  approveEventRequest,
  rejectEventRequest,
  getEventRequests,
} from '@/services/eventService';
import { createConversation } from '@/services/conversationService';
import { doc } from 'firebase/firestore';
import { firestore } from '@/services/firebase';
import { getUserProfile } from '@/services/userService';
import type { Event, EventRequest } from '@/types';
import type { EventsStackParamList } from '@/navigation/stacks/EventsStack';
import { useAuth } from '@/features/auth/AuthContext';
import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventDetail'>;

/** Sport-specific icon mapping */
function getSportIcon(sport: string): string {
  switch (sport.toLowerCase()) {
    case 'cycling': return 'bike';
    case 'swimming': return 'swim';
    default: return 'run';
  }
}

export function EventDetailScreen({ route, navigation }: Props): React.JSX.Element {
  const { eventId } = route.params;
  const { userId } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [requests, setRequests] = useState<EventRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isCreator = userId === event?.creatorId;
  const isParticipant = event?.participantIds.includes(userId ?? '') ?? false;
  const hasRequested = requests.some((r) => r.userId === userId && r.status === 'pending');

  const load = async (): Promise<void> => {
    try {
      const [e, reqs] = await Promise.all([
        getEvent(eventId),
        getEventRequests(eventId),
      ]);
      setEvent(e ?? null);
      setRequests(reqs);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [eventId]);

  const handleRequestJoin = async (): Promise<void> => {
    if (!userId) return;
    setActionLoading(true);
    try {
      await requestToJoinEvent(eventId, userId);
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (requestId: string): Promise<void> => {
    setActionLoading(true);
    try {
      await approveEventRequest(eventId, requestId);
      const ev = await getEvent(eventId);
      if (ev && !ev.conversationId && ev.participantIds.length > 0) {
        const conv = await createConversation('event', ev.participantIds, eventId);
        const { updateDoc: fdUpdate, serverTimestamp } = await import('firebase/firestore');
        await fdUpdate(doc(firestore(), 'events', eventId), {
          conversationId: conv.id,
          updatedAt: serverTimestamp(),
        });
      }
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId: string): Promise<void> => {
    setActionLoading(true);
    try {
      await rejectEventRequest(requestId);
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (ts: number): string => {
    return new Date(ts).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (ts: number): string => {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="calendar-remove-outline" size={48} color={colors.textMuted} />
        <Text style={styles.notFoundText}>Event not found</Text>
      </View>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          colors={[colors.primary]}
        />
      }
    >
      {/* Hero header */}
      <View style={styles.hero}>
        <View style={styles.heroIconWrap}>
          <MaterialCommunityIcons
            name={getSportIcon(event.sport) as any}
            size={32}
            color={colors.textOnPrimary}
          />
        </View>
        <Text style={styles.heroTitle}>{event.title}</Text>
        <View style={styles.heroBadgeRow}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{event.sport}</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{event.style}</Text>
          </View>
          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="account-group" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.heroBadgeText}>{event.participantIds.length}</Text>
          </View>
        </View>
      </View>

      {/* Info cards */}
      <View style={styles.infoGrid}>
        <InfoCard
          icon="calendar-clock"
          label="Date"
          value={formatDate(event.date)}
          accent={colors.primary}
        />
        <InfoCard
          icon="clock-outline"
          label="Time"
          value={formatTime(event.date)}
          accent={colors.secondary}
        />
        <InfoCard
          icon="map-marker-outline"
          label="Location"
          value={event.location}
          accent={colors.accent}
        />
        <InfoCard
          icon="speedometer"
          label="Details"
          value={`${event.distance}km • ${event.pace}`}
          accent={colors.primaryLight}
        />
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        {!isParticipant && !hasRequested && !isCreator && (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={handleRequestJoin}
            disabled={actionLoading}
            activeOpacity={0.7}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <>
                <MaterialCommunityIcons name="hand-wave-outline" size={20} color={colors.textOnPrimary} />
                <Text style={styles.joinButtonText}>Request to Join</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {hasRequested && (
          <View style={styles.pendingBanner}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={colors.warning} />
            <Text style={styles.pendingText}>Your request is pending approval</Text>
          </View>
        )}

        {isParticipant && event.conversationId && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => {
              const tabNav = navigation.getParent();
              if (tabNav) {
                (tabNav as { navigate: (name: string, params?: object) => void }).navigate('Chat', {
                  screen: 'ChatDetail',
                  params: { conversationId: event.conversationId },
                  initial: false,
                });
              }
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chat-outline" size={20} color={colors.textOnPrimary} />
            <Text style={styles.chatButtonText}>Open Event Chat</Text>
          </TouchableOpacity>
        )}

        {isParticipant && (
          <View style={styles.participantBanner}>
            <MaterialCommunityIcons name="check-circle" size={20} color={colors.accent} />
            <Text style={styles.participantText}>You're in this event</Text>
          </View>
        )}
      </View>

      {/* Join requests (creator only) */}
      {isCreator && pendingRequests.length > 0 && (
        <View style={styles.requestsSection}>
          <Text style={styles.sectionTitle}>
            Join Requests ({pendingRequests.length})
          </Text>
          {pendingRequests.map((req) => (
            <RequestRow
              key={req.id}
              request={req}
              onApprove={() => handleApprove(req.id)}
              onReject={() => handleReject(req.id)}
              loading={actionLoading}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/** Info card component for event details */
function InfoCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  accent: string;
}): React.JSX.Element {
  return (
    <View style={styles.infoCard}>
      <View style={[styles.infoIconWrap, { backgroundColor: accent + '18' }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={accent} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

/** Request row for join requests */
function RequestRow({
  request,
  onApprove,
  onReject,
  loading,
}: {
  request: EventRequest;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}): React.JSX.Element {
  const [name, setName] = useState('Loading...');

  useEffect(() => {
    getUserProfile(request.userId).then((p) =>
      setName(p?.displayName || p?.email || 'User')
    );
  }, [request.userId]);

  return (
    <View style={styles.requestCard}>
      <View style={styles.requestInfo}>
        <View style={styles.requestAvatar}>
          <Text style={styles.requestAvatarText}>
            {name[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.requestName} numberOfLines={1}>{name}</Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.approveBtn}
          onPress={onApprove}
          disabled={loading}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="check" size={18} color={colors.textOnPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={onReject}
          disabled={loading}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="close" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
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
  notFoundText: {
    ...typography.body,
    color: colors.textMuted,
  },

  // Hero
  hero: {
    backgroundColor: colors.primary,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  heroBadgeText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },

  // Info cards grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.lg,
    gap: spacing.md,
  },
  infoCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },

  // Actions
  actions: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  joinButtonText: {
    ...typography.h3,
    color: colors.textOnPrimary,
    fontSize: 16,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  chatButtonText: {
    ...typography.h3,
    color: colors.textOnPrimary,
    fontSize: 16,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningLight,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  pendingText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  participantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successLight,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  participantText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },

  // Requests section
  requestsSection: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  requestAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestAvatarText: {
    fontSize: 16,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  requestName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  approveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
