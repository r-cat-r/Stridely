/**
 * Main tab navigator — premium bottom bar
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FindBuddyStack } from './stacks/FindBuddyStack';
import { EventsStack } from './stacks/EventsStack';
import { ChatStack } from './stacks/ChatStack';
import { ProfileStack } from './stacks/ProfileStack';
import { colors, spacing, typography } from '@/constants/theme';

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
    <View style={styles.placeholder}>
      <View style={styles.placeholderIcon}>
        <MaterialCommunityIcons name="robot-outline" size={48} color={colors.textMuted} />
      </View>
      <Text style={styles.placeholderTitle}>AI Coach</Text>
      <Text style={styles.placeholderSubtitle}>
        Personalized training recommendations{'\n'}coming soon
      </Text>
    </View>
  );
}

export function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          paddingTop: 4,
          height: 60,
          elevation: 8,
          shadowColor: colors.shadowDark,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
      }}
    >
      <Tab.Screen
        name="FindBuddy"
        component={FindBuddyStack}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="compass-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsStack}
        options={{
          tabBarLabel: 'Events',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-star" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatStack}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chat-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AICoach"
        component={AICoachPlaceholder}
        options={{
          tabBarLabel: 'Coach',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="robot-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['4xl'],
    backgroundColor: colors.background,
  },
  placeholderIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  placeholderTitle: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  placeholderSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
