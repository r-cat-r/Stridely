/**
 * Profile stack — dark themed headers
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { EditProfileScreen } from '@/screens/profile/EditProfileScreen';
import { SportsProfilesScreen } from '@/screens/profile/SportsProfilesScreen';
import { colors, typography } from '@/constants/theme';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  SportsProfiles: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack(): React.JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text, fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen
        name="SportsProfiles"
        component={SportsProfilesScreen}
        options={{ title: 'Sports Profiles' }}
      />
    </Stack.Navigator>
  );
}
