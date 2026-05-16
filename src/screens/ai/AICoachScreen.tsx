/**
 * AI Coach screen — premium chat interface with Gemini
 *
 * Sports-focused AI coach with guardrails.
 * Chat-style interface with suggested prompts.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sendCoachMessage, type CoachMessage } from '@/services/aiCoachService';
import { useAuth } from '@/features/auth/AuthContext';
import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';

const SUGGESTIONS = [
  '🏃 Create a 5K training plan',
  '🚴 Cycling tips for beginners',
  '🏊 Improve my swim technique',
  '💪 Recovery after a long run',
  '🥗 Pre-race nutrition advice',
  '🎯 How to improve my pace',
];

export function AICoachScreen(): React.JSX.Element {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = useCallback(async (text: string): Promise<void> => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput('');

    const userMsg: CoachMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await sendCoachMessage(trimmed, messages);
      const coachMsg: CoachMessage = {
        id: `coach_${Date.now()}`,
        role: 'coach',
        text: response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, coachMsg]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '';
      const isQuota = errMsg.includes('rate-limited') || errMsg.includes('429') || errMsg.includes('quota');
      const errorMsg: CoachMessage = {
        id: `error_${Date.now()}`,
        role: 'coach',
        text: isQuota
          ? "I'm getting a lot of requests right now! Please wait 30 seconds and try again. ⏳"
          : `Sorry, something went wrong. Please try again! 🏃‍♂️`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages]);

  const firstName = profile?.displayName?.split(' ')[0] || 'Athlete';

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
        contentContainerStyle={
          messages.length === 0 ? styles.emptyContent : styles.messageContent
        }
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === 'user' ? styles.bubbleUser : styles.bubbleCoach,
            ]}
          >
            {item.role === 'coach' && (
              <View style={styles.coachHeader}>
                <View style={styles.coachIcon}>
                  <MaterialCommunityIcons name="robot-outline" size={14} color={colors.textOnPrimary} />
                </View>
                <Text style={styles.coachLabel}>Stridely Coach</Text>
              </View>
            )}
            <Text
              style={[
                styles.bubbleText,
                item.role === 'user' && styles.bubbleTextUser,
              ]}
            >
              {item.text}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.welcome}>
            <View style={styles.welcomeIconWrap}>
              <MaterialCommunityIcons name="robot-happy-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.welcomeTitle}>
              Hey {firstName}! 👋
            </Text>
            <Text style={styles.welcomeSubtitle}>
              I'm your AI sports coach. Ask me about training,{'\n'}
              nutrition, recovery, or race prep!
            </Text>

            {/* Suggestion chips */}
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.chip}
                  onPress={() => sendMessage(s)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
      />

      {/* Typing indicator */}
      {loading && (
        <View style={styles.typingBar}>
          <View style={styles.coachIcon}>
            <MaterialCommunityIcons name="robot-outline" size={12} color={colors.textOnPrimary} />
          </View>
          <Text style={styles.typingText}>Coach is thinking...</Text>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask your coach..."
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            editable={!loading}
          />
        </View>
        <TouchableOpacity
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          style={[
            styles.sendBtn,
            (!input.trim() || loading) && styles.sendBtnDisabled,
          ]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="send"
            size={20}
            color={!input.trim() || loading ? colors.textMuted : colors.textOnPrimary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messageList: { flex: 1 },
  messageContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  emptyContent: {
    flexGrow: 1,
  },

  // Welcome
  welcome: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  welcomeIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  welcomeTitle: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    maxWidth: 360,
  },
  chip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    ...shadows.sm,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },

  // Bubbles
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.xs,
  },
  bubbleCoach: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: borderRadius.xs,
    ...shadows.sm,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  coachIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  bubbleText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: colors.textOnPrimary,
  },

  // Typing indicator
  typingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  typingText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '500',
    flex: 1,
  },

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
  textInput: {
    ...typography.body,
    color: colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  sendBtnDisabled: {
    backgroundColor: colors.borderLight,
  },
});
