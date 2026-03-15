/**
 * Chat screen - unified conversation view
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { subscribeToMessages, sendMessage } from '@/services/conversationService';
import { getUserProfile } from '@/services/userService';
import { useAuth } from '@/features/auth/AuthContext';
import type { Message } from '@/types';
import type { ChatStackParamList } from '@/navigation/stacks/ChatStack';

type Props = NativeStackScreenProps<ChatStackParamList, 'Chat'>;

export function ChatScreen({ route }: Props): React.JSX.Element {
  const { conversationId } = route.params;
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const unsub = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
    });
    return unsub;
  }, [conversationId]);

  const handleSend = async (): Promise<void> => {
    const text = input.trim();
    if (!text || !userId || sending) return;
    setInput('');
    setSending(true);
    try {
      await sendMessage(conversationId, userId, text);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        renderItem={({ item }) => (
          <MessageBubble message={item} isMe={item.senderId === userId} />
        )}
      />
      <View className="flex-row items-center p-2 border-t border-slate-200 bg-white">
        <TextInput
          className="flex-1 mx-2 py-2 px-3 bg-slate-100 rounded-full"
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!input.trim() || sending}
          className="bg-sky-500 rounded-full p-3"
        >
          <Text className="text-white font-medium">Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({
  message,
  isMe,
}: {
  message: Message;
  isMe: boolean;
}): React.JSX.Element {
  const [senderName, setSenderName] = useState('');

  useEffect(() => {
    getUserProfile(message.senderId).then((p) =>
      setSenderName(p?.displayName || p?.email || 'Unknown')
    );
  }, [message.senderId]);

  const time = new Date(message.timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View
      className={`mx-4 my-1 p-3 rounded-2xl max-w-[80%] ${
        isMe ? 'self-end bg-sky-500' : 'self-start bg-slate-200'
      }`}
    >
      {!isMe && (
        <Text className="text-xs text-slate-500 mb-1">{senderName}</Text>
      )}
      <Text className={isMe ? 'text-white' : 'text-slate-800'}>{message.text}</Text>
      <Text
        className={`text-xs mt-1 ${isMe ? 'text-sky-100' : 'text-slate-500'}`}
      >
        {time}
      </Text>
    </View>
  );
}
