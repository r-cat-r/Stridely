/**
 * Chat screen — premium messaging with read receipts
 *
 * Header shows other person's name + avatar (tap to view profile).
 * Auto-marks messages as read when viewed.
 * Status ticks: ✓ sent (grey), ✓✓ delivered (grey), ✓✓ read (blue).
 */

import React, { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  subscribeToMessages,
  sendMessage,
  markMessagesAsRead,
  markMessagesAsDelivered,
  getConversation,
} from '@/services/conversationService';
import { getUserProfile } from '@/services/userService';
import { useAuth } from '@/features/auth/AuthContext';
import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';
import type { Message, MessageStatus, UserProfile } from '@/types';
import type { ChatStackParamList } from '@/navigation/stacks/ChatStack';

type Props = NativeStackScreenProps<ChatStackParamList, 'ChatDetail'>;

export function ChatScreen({ route, navigation }: Props): React.JSX.Element {
  const { conversationId } = route.params;
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Load the other user's profile for the header
  useEffect(() => {
    async function loadOtherUser() {
      if (!userId) return;
      try {
        const conv = await getConversation(conversationId);
        if (!conv) return;
        const otherId = conv.participantIds.find((id) => id !== userId);
        if (otherId) {
          const profile = await getUserProfile(otherId);
          setOtherUser(profile ?? null);
        }
      } catch (err) {
        console.error('[CHAT] Error loading other user:', err);
      }
    }
    loadOtherUser();
  }, [conversationId, userId]);

  // Set custom header with other user's name and photo
  useLayoutEffect(() => {
    if (!otherUser) return;

    const handleProfilePress = () => {
      // Navigate to FindBuddy tab → UserDetail
      navigation.getParent()?.navigate('FindBuddy', {
        screen: 'UserDetail',
        params: { userId: otherUser.id },
        initial: false,
      });
    };

    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          onPress={handleProfilePress}
          style={headerStyles.container}
          activeOpacity={0.7}
        >
          {otherUser.photoURL ? (
            <Image
              source={{ uri: otherUser.photoURL }}
              style={headerStyles.avatar}
            />
          ) : (
            <View style={[headerStyles.avatar, headerStyles.avatarPlaceholder]}>
              <Text style={headerStyles.avatarText}>
                {(otherUser.displayName?.[0] ?? otherUser.email?.[0] ?? '?').toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={headerStyles.name} numberOfLines={1}>
              {otherUser.displayName || otherUser.email || 'Unknown'}
            </Text>
            <Text style={headerStyles.subtitle}>Tap to view profile</Text>
          </View>
        </TouchableOpacity>
      ),
    });
  }, [otherUser, navigation]);

  useEffect(() => {
    const unsub = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
    });
    return unsub;
  }, [conversationId]);

  // Auto-mark messages as delivered then read when conversation is viewed
  useEffect(() => {
    if (!userId || messages.length === 0) return;
    const othersMessages = messages.filter((m) => m.senderId !== userId);
    if (othersMessages.length === 0) return;

    // Mark 'sent' → 'delivered' first, then mark as read
    const hasSent = othersMessages.some((m) => m.status === 'sent');
    const hasUnread = othersMessages.some((m) => !m.readBy?.includes(userId));

    if (hasSent) {
      markMessagesAsDelivered(conversationId, userId).catch(() => {});
    }
    if (hasUnread) {
      markMessagesAsRead(conversationId, userId).catch(() => {});
    }
  }, [messages, userId, conversationId]);

  const handleSend = useCallback(async (): Promise<void> => {
    const text = input.trim();
    if (!text || !userId || sending) return;
    setInput('');
    setSending(true);
    try {
      await sendMessage(conversationId, userId, text);
    } finally {
      setSending(false);
    }
  }, [input, userId, sending, conversationId]);

  /** Group consecutive messages by same sender for cleaner bubbles */
  const isFirstInGroup = (index: number): boolean => {
    if (index === 0) return true;
    return messages[index].senderId !== messages[index - 1].senderId;
  };

  const isLastInGroup = (index: number): boolean => {
    if (index === messages.length - 1) return true;
    return messages[index].senderId !== messages[index + 1].senderId;
  };

  /** Format date separator */
  const shouldShowDate = (index: number): boolean => {
    if (index === 0) return true;
    const curr = new Date(messages[index].timestamp).toDateString();
    const prev = new Date(messages[index - 1].timestamp).toDateString();
    return curr !== prev;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageContent}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        renderItem={({ item, index }) => (
          <View>
            {shouldShowDate(index) && (
              <View style={styles.dateSeparator}>
                <View style={styles.dateLine} />
                <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
                <View style={styles.dateLine} />
              </View>
            )}
            <MessageBubble
              message={item}
              isMe={item.senderId === userId}
              showSender={isFirstInGroup(index)}
              isTail={isLastInGroup(index)}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <MaterialCommunityIcons name="chat-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyChatText}>No messages yet. Say hi! 👋</Text>
          </View>
        }
      />

      {/* Input bar */}
      <View style={styles.inputBar}>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
          />
        </View>
        <TouchableOpacity
          onPress={handleSend}
          disabled={!input.trim() || sending}
          style={[
            styles.sendBtn,
            (!input.trim() || sending) && styles.sendBtnDisabled,
          ]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="send"
            size={20}
            color={!input.trim() || sending ? colors.textMuted : colors.textOnPrimary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/**
 * Status ticks — matches industry standard:
 * - sent → single grey check
 * - delivered → double grey checks
 * - read → double blue checks
 */
function StatusIcon({ status, isMe }: { status: MessageStatus; isMe: boolean }): React.JSX.Element | null {
  if (!isMe) return null;

  switch (status) {
    case 'read':
      return <MaterialCommunityIcons name="check-all" size={15} color="#0EA5E9" style={styles.tickIcon} />;
    case 'delivered':
      return <MaterialCommunityIcons name="check-all" size={15} color="rgba(148,163,184,0.8)" style={styles.tickIcon} />;
    case 'sent':
    default:
      return <MaterialCommunityIcons name="check" size={15} color="rgba(148,163,184,0.8)" style={styles.tickIcon} />;
  }
}

function MessageBubble({
  message,
  isMe,
  showSender,
  isTail,
}: {
  message: Message;
  isMe: boolean;
  showSender: boolean;
  isTail: boolean;
}): React.JSX.Element {
  const [senderName, setSenderName] = useState('');

  useEffect(() => {
    if (!isMe && showSender) {
      getUserProfile(message.senderId).then((p) =>
        setSenderName(p?.displayName || p?.email || 'Unknown')
      );
    }
  }, [message.senderId, isMe, showSender]);

  const time = new Date(message.timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View
      style={[
        styles.bubble,
        isMe ? styles.bubbleMe : styles.bubbleOther,
        isTail && isMe && styles.bubbleMeTail,
        isTail && !isMe && styles.bubbleOtherTail,
        !isTail && { marginBottom: 2 },
      ]}
    >
      {!isMe && showSender && senderName ? (
        <Text style={styles.senderName}>{senderName}</Text>
      ) : null}
      <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
        {message.text}
      </Text>
      <View style={styles.timeRow}>
        <Text style={[styles.timeText, isMe && styles.timeTextMe]}>{time}</Text>
        <StatusIcon status={message.status ?? 'sent'} isMe={isMe} />
      </View>
    </View>
  );
}

/** Styles for the custom header */
const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginLeft: -spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  name: {
    ...typography.label,
    color: colors.text,
    fontSize: 15,
    maxWidth: 180,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  messageList: { flex: 1 },
  messageContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['4xl'],
  },
  emptyChatText: { ...typography.body, color: colors.textMuted, marginTop: spacing.md },

  // Date separator
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  dateText: {
    ...typography.caption,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
    fontWeight: '600',
    fontSize: 11,
  },

  // Bubbles
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  bubbleMeTail: {
    borderBottomRightRadius: borderRadius.xs,
  },
  bubbleOtherTail: {
    borderBottomLeftRadius: borderRadius.xs,
  },
  senderName: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  messageText: { ...typography.body, color: colors.text },
  messageTextMe: { color: colors.textOnPrimary },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  timeText: { ...typography.caption, color: colors.textMuted, fontSize: 10 },
  timeTextMe: { color: 'rgba(255,255,255,0.7)' },
  tickIcon: { marginLeft: 3 },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    maxHeight: 120,
  },
  textInput: { ...typography.body, color: colors.text, maxHeight: 100 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  sendBtnDisabled: { backgroundColor: colors.borderLight },
});
