import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { RootNavigator } from '@/navigation/RootNavigator';

function AppContent(): React.JSX.Element {
  const { userId, loading, error } = useAuth();

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-red-600 font-bold mb-2">Auth Error</Text>
        <Text className="text-slate-600 text-center">{error.message}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#FC4C02" />
        <Text className="mt-4 text-slate-600">Initializing...</Text>
      </View>
    );
  }

  return <RootNavigator isAuthenticated={!!userId} />;
}

export default function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider
        theme={{
          ...MD3LightTheme,
          colors: {
            ...MD3LightTheme.colors,
            primary: '#FC4C02',
            secondary: '#0EA5E9',
          },
        }}
      >
        <NavigationContainer>
          <AuthProvider>
            <AppContent />
            <StatusBar style="auto" />
          </AuthProvider>
        </NavigationContainer>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
