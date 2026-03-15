/**
 * Chat stack
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConversationsListScreen } from '@/screens/chat/ConversationsListScreen';
import { ChatScreen } from '@/screens/chat/ChatScreen';

export type ChatStackParamList = {
  ConversationsList: undefined;
  Chat: { conversationId: string };
};

const Stack = createNativeStackNavigator<ChatStackParamList>();

export function ChatStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="ConversationsList"
        component={ConversationsListScreen}
        options={{ title: 'Conversations' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
    </Stack.Navigator>
  );
}
