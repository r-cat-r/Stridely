/**
 * Chat stack — conversations list + chat detail + new chat
 *
 * All chat navigation flows through this stack.
 * ConversationsList is always the root so back button works correctly.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConversationsListScreen } from '@/screens/chat/ConversationsListScreen';
import { ChatScreen } from '@/screens/chat/ChatScreen';
import { colors, typography } from '@/constants/theme';

export type ChatStackParamList = {
  ConversationsList: undefined;
  ChatDetail: { conversationId: string };
};

const Stack = createNativeStackNavigator<ChatStackParamList>();

export function ChatStack(): React.JSX.Element {
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
        name="ConversationsList"
        component={ConversationsListScreen}
        options={{ title: 'Conversations' }}
      />
      <Stack.Screen
        name="ChatDetail"
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
    </Stack.Navigator>
  );
}
