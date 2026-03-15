/**
 * Reusable loading view
 */

import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingViewProps {
  message?: string;
}

export function LoadingView({ message = 'Loading...' }: LoadingViewProps): React.JSX.Element {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <ActivityIndicator size="large" />
      {message && (
        <Text className="mt-4 text-slate-600">{message}</Text>
      )}
    </View>
  );
}
