/**
 * Phone Auth screen — 2-step OTP flow
 *
 * Step 1: Phone number entry with +91 prefix
 * Step 2: 6-digit OTP verification with resend cooldown
 *
 * Supports both login and signup modes.
 * Uses Firebase JS SDK RecaptchaVerifier (web platform).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  sendPhoneOTP,
  verifyPhoneOTP,
  resetRecaptcha,
  type ConfirmationResult,
} from '@/services/authService';
import { isValidPhone } from '@/utils/validation';
import { OTPInput } from '@/components/OTPInput';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'PhoneAuth'>;

const RESEND_COOLDOWN = 60; // seconds
const MAX_RESEND_ATTEMPTS = 3;

export function PhoneAuthScreen({ navigation, route }: Props): React.JSX.Element {
  const { mode } = route.params;

  // Step management
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP state
  const confirmRef = useRef<ConfirmationResult | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Clean up reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      resetRecaptcha();
    };
  }, []);

  const getFullPhone = useCallback((): string => {
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    return `+91${cleaned}`;
  }, [phone]);

  const handleSendOTP = async (): Promise<void> => {
    setError(null);
    const fullPhone = getFullPhone();

    if (!isValidPhone(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const confirmation = await sendPhoneOTP(fullPhone);
      confirmRef.current = confirmation;
      setStep('otp');
      setResendTimer(RESEND_COOLDOWN);
      setResendAttempts((a) => a + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP';
      if (msg.includes('web')) {
        setError('Phone OTP is currently available on web only. Please use email login on mobile.');
      } else if (msg.includes('too-many-requests')) {
        setError('Too many attempts. Please try again later.');
      } else if (msg.includes('invalid-phone-number')) {
        setError('Invalid phone number. Please check and try again.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (code: string): Promise<void> => {
    if (!confirmRef.current) {
      setError('Session expired. Please request a new OTP.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await verifyPhoneOTP(confirmRef.current, code);
      // AuthContext will handle the state change automatically
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      if (msg.includes('invalid-verification-code')) {
        setError('Invalid OTP. Please check and try again.');
      } else if (msg.includes('code-expired')) {
        setError('OTP has expired. Please request a new one.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async (): Promise<void> => {
    if (resendTimer > 0 || resendAttempts >= MAX_RESEND_ATTEMPTS) return;

    resetRecaptcha();
    setStep('phone');
    // User can re-trigger from phone step
    setError(null);
  };

  // ── Phone Entry Step ──────────────────────────────────
  if (step === 'phone') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.screen}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.iconHero}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="phone-message-outline" size={32} color={colors.primary} />
            </View>
          </View>

          <Text style={styles.title}>
            {mode === 'login' ? 'Sign in with\nPhone' : 'Sign up with\nPhone'}
          </Text>
          <Text style={styles.subtitle}>
            We'll send you a verification code via SMS
          </Text>

          {/* Phone input */}
          <View style={styles.phoneInputRow}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              value={phone}
              onChangeText={(t) => { setPhone(t); setError(null); }}
              keyboardType="phone-pad"
              mode="outlined"
              placeholder="Enter phone number"
              maxLength={10}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
              style={styles.phoneInput}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textMuted,
                  surface: colors.surface,
                },
              }}
            />
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorBanner}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Send OTP button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSendOTP}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.submitText}>
              {loading ? 'Sending...' : 'Send OTP'}
            </Text>
          </TouchableOpacity>

          {/* reCAPTCHA container (invisible, web only) */}
          {Platform.OS === 'web' && (
            <View nativeID="recaptcha-container" style={styles.recaptchaContainer} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── OTP Verification Step ─────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => { setStep('phone'); setError(null); }}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.iconHero}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="shield-check-outline" size={32} color={colors.primary} />
          </View>
        </View>

        <Text style={styles.title}>Verify your{'\n'}number</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.phoneHighlight}>{getFullPhone()}</Text>
        </Text>

        {/* OTP Input */}
        <OTPInput
          length={6}
          onComplete={handleVerifyOTP}
          disabled={loading}
        />

        {/* Error */}
        {error && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Loading indicator */}
        {loading && (
          <Text style={styles.verifyingText}>Verifying...</Text>
        )}

        {/* Resend section */}
        <View style={styles.resendSection}>
          {resendTimer > 0 ? (
            <Text style={styles.resendTimer}>
              Resend code in {resendTimer}s
            </Text>
          ) : resendAttempts >= MAX_RESEND_ATTEMPTS ? (
            <Text style={styles.resendExhausted}>
              Maximum resend attempts reached
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResendOTP} activeOpacity={0.7}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: 60,
    paddingBottom: spacing['4xl'],
  },

  // Back
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },

  // Icon hero
  iconHero: {
    marginBottom: spacing['2xl'],
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
    lineHeight: 42,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.textMuted,
    marginBottom: spacing['3xl'],
    lineHeight: 24,
  },
  phoneHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Phone input
  phoneInputRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  countryCode: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
    height: 56,
  },
  countryCodeText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.md,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    flex: 1,
  },

  // Submit
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.lg + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...shadows.glow,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    ...typography.label,
    fontSize: 16,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },

  // Verifying
  verifyingText: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  // Resend
  resendSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  resendTimer: {
    ...typography.body,
    color: colors.textMuted,
  },
  resendLink: {
    ...typography.label,
    color: colors.primary,
    fontSize: 15,
  },
  resendExhausted: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  // reCAPTCHA
  recaptchaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    opacity: 0,
  },
});
