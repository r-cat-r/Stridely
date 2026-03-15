/**
 * Events list screen - activity cards
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Button } from 'react-native-paper';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { getAllUpcomingEvents } from '@/services/eventService';
import { EventCard } from '@/components/EventCard';
import type { Event } from '@/types';
import type { EventsStackParamList } from '@/navigation/stacks/EventsStack';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventsList'>;

export function EventsListScreen({ navigation }: Props): React.JSX.Element {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    try {
      const list = await getAllUpcomingEvents();
      setEvents(list);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#FC4C02" />
        <Text className="mt-4 text-slate-600">Loading events...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <View className="p-4 border-b border-slate-200 bg-white">
        <Button
          mode="contained"
          onPress={() => navigation.navigate('CreateEvent')}
          buttonColor="#FC4C02"
        >
          Create Event
        </Button>
      </View>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 8 }}
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
          <EventCard
            event={item}
            onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View className="p-12 items-center">
            <Text className="text-slate-600 text-center mb-2">No upcoming events</Text>
            <Text className="text-slate-500 text-sm text-center">
              Create an event to find training buddies
            </Text>
          </View>
        }
      />
    </View>
  );
}
