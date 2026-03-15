/**
 * Events stack
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EventsListScreen } from '@/screens/events/EventsListScreen';
import { EventDetailScreen } from '@/screens/events/EventDetailScreen';
import { CreateEventScreen } from '@/screens/events/CreateEventScreen';

export type EventsStackParamList = {
  EventsList: undefined;
  EventDetail: { eventId: string };
  CreateEvent: undefined;
};

const Stack = createNativeStackNavigator<EventsStackParamList>();

export function EventsStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="EventsList"
        component={EventsListScreen}
        options={{ title: 'Events' }}
      />
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{ title: 'Event' }}
      />
      <Stack.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{ title: 'Create Event' }}
      />
    </Stack.Navigator>
  );
}
