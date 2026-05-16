import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { colors, typography, spacing } from '@/constants/theme';

const paperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    surface: colors.surface,
    background: colors.background,
    onSurface: colors.text,
    onBackground: colors.text,
    surfaceVariant: colors.surfaceLight,
    outline: colors.border,
  },
};

/** React Navigation dark theme */
const navigationTheme = {
  dark: true,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '800' as const },
  },
};

function AppContent(): React.JSX.Element {
  const { userId, loading, error, needsOnboarding } = useAuth();

  if (error) {
    return (
      <View style={styles.centeredScreen}>
        <Text style={styles.errorTitle}>Auth Error</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  return (
    <RootNavigator
      isAuthenticated={!!userId}
      needsOnboarding={needsOnboarding}
    />
  );
}

export default function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer theme={navigationTheme}>
          <AuthProvider>
            <AppContent />
            <StatusBar style="light" />
          </AuthProvider>
        </NavigationContainer>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  centeredScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing['3xl'],
  },
  errorTitle: {
    ...typography.h2,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
});
