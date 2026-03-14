import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { APP_NAME, APP_TAGLINE } from '@/constants';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <View className="flex-1 items-center justify-center bg-white px-6">
          <Text className="text-3xl font-bold text-slate-800">{APP_NAME}</Text>
          <Text className="mt-2 text-center text-base text-slate-600">
            {APP_TAGLINE}
          </Text>
          <StatusBar style="auto" />
        </View>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
