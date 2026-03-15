/**
 * Event detail - view event, request to join, manage requests
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Button } from 'react-native-paper';
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
import type { Event, EventRequest } from '@/types';
import type { EventsStackParamList } from '@/navigation/stacks/EventsStack';
import { useAuth } from '@/features/auth/AuthContext';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventDetail'>;

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-slate-600">Event not found</Text>
      </View>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
      }
    >
      <View className="p-4">
        <Text className="text-2xl font-bold text-slate-800">{event.title}</Text>
        <View className="mt-4 space-y-2">
          <Text className="text-slate-600">{event.sport} • {event.distance}km • {event.pace}</Text>
          <Text className="text-slate-600">Style: {event.style}</Text>
          <Text className="text-slate-600">{formatDate(event.date)}</Text>
          <Text className="text-slate-600">{event.location}</Text>
        </View>

        {!isParticipant && !hasRequested && (
          <Button
            mode="contained"
            onPress={handleRequestJoin}
            loading={actionLoading}
            disabled={actionLoading}
            style={{ marginTop: 16 }}
          >
            Request to join
          </Button>
        )}
        {hasRequested && (
          <Text className="mt-4 text-slate-500">Request pending</Text>
        )}

        {isCreator && pendingRequests.length > 0 && (
          <View className="mt-6">
            <Text className="font-semibold text-slate-800 mb-2">Join requests</Text>
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

        {isParticipant && event.conversationId && (
          <Button
            mode="outlined"
            onPress={() => {
              const tabNav = navigation.getParent();
              if (tabNav) {
                (tabNav as { navigate: (name: string, params?: object) => void }).navigate('Chat', {
                  screen: 'Chat',
                  params: { conversationId: event.conversationId },
                });
              }
            }}
            style={{ marginTop: 16 }}
          >
            Open event chat
          </Button>
        )}
      </View>
    </ScrollView>
  );
}

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
  const [name, setName] = useState('');
  useEffect(() => {
    import('@/services/userService').then(({ getUserProfile }) =>
      getUserProfile(request.userId).then((p) => setName(p?.displayName || p?.email || 'User'))
    );
  }, [request.userId]);

  return (
    <View className="flex-row justify-between items-center p-3 bg-slate-50 rounded mb-2">
      <Text className="flex-1">{name}</Text>
      <View className="flex-row gap-2">
        <Button mode="contained" compact onPress={onApprove} disabled={loading}>
          Approve
        </Button>
        <Button mode="outlined" compact onPress={onReject} disabled={loading}>
          Reject
        </Button>
      </View>
    </View>
  );
}
