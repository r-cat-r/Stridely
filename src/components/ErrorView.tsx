/**
 * Reusable error view
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Button } from 'react-native-paper';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps): React.JSX.Element {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Text className="text-center text-red-600 mb-4">{message}</Text>
      {onRetry && (
        <Button mode="contained" onPress={onRetry}>
          Try again
        </Button>
      )}
    </View>
  );
}
