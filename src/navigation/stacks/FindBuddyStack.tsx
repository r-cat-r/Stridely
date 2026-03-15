/**
 * Find Buddy stack
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Button } from 'react-native-paper';
import { FindBuddyScreen } from '@/screens/matching/FindBuddyScreen';
import { UserDetailScreen } from '@/screens/matching/UserDetailScreen';
import { InvitesScreen } from '@/screens/matching/InvitesScreen';

export type FindBuddyStackParamList = {
  FindBuddyList: undefined;
  UserDetail: { userId: string };
  Invites: undefined;
};

const Stack = createNativeStackNavigator<FindBuddyStackParamList>();

export function FindBuddyStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="FindBuddyList"
        component={FindBuddyScreen}
        options={({ navigation }) => ({
          title: 'Find Buddy',
          headerRight: () => (
            <Button
              onPress={() => navigation.navigate('Invites')}
              compact
            >
              Invites
            </Button>
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
    </Stack.Navigator>
  );
}
