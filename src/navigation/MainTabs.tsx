/**
 * Main tab navigator
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FindBuddyStack } from './stacks/FindBuddyStack';
import { EventsStack } from './stacks/EventsStack';
import { ChatStack } from './stacks/ChatStack';
import { ProfileStack } from './stacks/ProfileStack';
import { View, Text } from 'react-native';

export type MainTabParamList = {
  FindBuddy: undefined;
  Events: undefined;
  Chat: undefined;
  AICoach: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function AICoachPlaceholder(): React.JSX.Element {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Text className="text-lg text-slate-600">AI Coach - Coming soon</Text>
    </View>
  );
}

export function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FC4C02',
        tabBarInactiveTintColor: '#64748b',
      }}
    >
      <Tab.Screen
        name="FindBuddy"
        component={FindBuddyStack}
        options={{
          tabBarLabel: 'Find Buddy',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-search" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsStack}
        options={{
          tabBarLabel: 'Events',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatStack}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chat" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AICoach"
        component={AICoachPlaceholder}
        options={{
          tabBarLabel: 'AI Coach',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="robot" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
