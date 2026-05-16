/**
 * Root navigator — auth flow, onboarding, and main tabs
 *
 * Flow:
 * - Not authenticated → Login/SignUp/PhoneAuth
 * - Authenticated + needs onboarding → SportSelection/SportDetails
 * - Authenticated + onboarding complete → Main tabs
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LaunchScreen } from '@/screens/auth/LaunchScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { SignUpScreen } from '@/screens/auth/SignUpScreen';
import { PhoneAuthScreen } from '@/screens/auth/PhoneAuthScreen';
import { SportSelectionScreen } from '@/screens/auth/SportSelectionScreen';
import { SportDetailsScreen } from '@/screens/auth/SportDetailsScreen';
import { TermsOfServiceScreen } from '@/screens/auth/TermsOfServiceScreen';
import { PrivacyPolicyScreen } from '@/screens/auth/PrivacyPolicyScreen';
import { MainTabs } from './MainTabs';

export type RootStackParamList = {
  Launch: undefined;
  Login: undefined;
  SignUp: undefined;
  PhoneAuth: { mode: 'login' | 'signup' };
  SportSelection: undefined;
  SportDetails: { sport: string };
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  isAuthenticated: boolean;
  needsOnboarding: boolean;
}

export function RootNavigator({ isAuthenticated, needsOnboarding }: RootNavigatorProps): React.JSX.Element {
  const navKey = isAuthenticated
    ? needsOnboarding ? 'onboarding' : 'main'
    : 'auth';

  return (
    <Stack.Navigator
      key={navKey}
      screenOptions={{ headerShown: false }}
      initialRouteName={
        isAuthenticated
          ? needsOnboarding ? 'SportSelection' : 'Main'
          : 'Launch'
      }
    >
      {isAuthenticated ? (
        needsOnboarding ? (
          <>
            <Stack.Screen name="SportSelection" component={SportSelectionScreen} />
            <Stack.Screen name="SportDetails" component={SportDetailsScreen} />
            <Stack.Screen name="Main" component={MainTabs} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="SportSelection" component={SportSelectionScreen} />
            <Stack.Screen name="SportDetails" component={SportDetailsScreen} />
          </>
        )
      ) : (
        <>
          <Stack.Screen name="Launch" component={LaunchScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
          <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
