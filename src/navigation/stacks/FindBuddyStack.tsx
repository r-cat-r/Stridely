/**
 * Find Buddy stack — discovery, profile, invites, friends
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FindBuddyScreen } from '@/screens/matching/FindBuddyScreen';
import { UserDetailScreen } from '@/screens/matching/UserDetailScreen';
import { InvitesScreen } from '@/screens/matching/InvitesScreen';
import { FriendsScreen } from '@/screens/matching/FriendsScreen';
import { colors, spacing, typography } from '@/constants/theme';

export type FindBuddyStackParamList = {
  FindBuddyList: undefined;
  UserDetail: { userId: string };
  Invites: undefined;
  Friends: undefined;
};

const Stack = createNativeStackNavigator<FindBuddyStackParamList>();

export function FindBuddyStack(): React.JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { ...typography.h3, color: colors.text },
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen
        name="FindBuddyList"
        component={FindBuddyScreen}
        options={({ navigation }) => ({
          title: 'Discover',
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Friends')}
                style={styles.headerBtn}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={22}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Invites')}
                style={styles.headerBtn}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="email-outline"
                  size={22}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="UserDetail"
        component={UserDetailScreen}
        options={{ title: 'Athlete' }}
      />
      <Stack.Screen
        name="Invites"
        component={InvitesScreen}
        options={{ title: 'Invites' }}
      />
      <Stack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ title: 'My Connections' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerBtn: {
    padding: spacing.xs,
  },
});
