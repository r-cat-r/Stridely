/**
 * Login screen — premium dark auth
 *
 * Layout:
 * 1. Hero heading on dark background
 * 2. "Continue with Phone" CTA
 * 3. Divider
 * 4. Email + Password inputs
 * 5. "Log In" lime accent button
 * 6. Sign up link + T&C footer
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { signIn } from '@/services/authService';
import { isValidEmail } from '@/utils/validation';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = useMemo(() => isValidEmail(email), [email]);

  const handleLogin = async (): Promise<void> => {
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!emailValid) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        setError('Invalid email or password');
      } else if (msg.includes('auth/user-not-found')) {
        setError('No account found with this email');
      } else if (msg.includes('auth/too-many-requests')) {
        setError('Too many attempts. Please try again later');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.logoRow}>
            <View style={styles.logoWrap}>
              <MaterialCommunityIcons name="run-fast" size={24} color={colors.textOnPrimary} />
            </View>
            <Text style={styles.logoText}>Stridely</Text>
          </View>
          <Text style={styles.heroTitle}>Welcome{'\n'}back</Text>
          <Text style={styles.heroSubtitle}>Sign in to find your training partners</Text>
        </View>

        {/* Phone CTA */}
        <TouchableOpacity
          style={styles.phoneCta}
          onPress={() => navigation.navigate('PhoneAuth', { mode: 'login' })}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="phone-outline" size={20} color={colors.text} />
          <Text style={styles.phoneCtaText}>Continue with Phone Number</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or sign in with email</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email Input */}
        <TextInput
          label="Email address"
          value={email}
          onChangeText={(t) => { setEmail(t); setError(null); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          mode="outlined"
          left={<TextInput.Icon icon="email-outline" color={colors.textMuted} />}
          right={
            email.length > 0 ? (
              <TextInput.Icon
                icon={emailValid ? 'check-circle' : 'alert-circle-outline'}
                color={emailValid ? colors.primary : colors.error}
              />
            ) : undefined
          }
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          textColor={colors.text}
          style={styles.input}
          theme={{
            colors: {
              onSurfaceVariant: colors.textMuted,
              surface: colors.surface,
            },
          }}
        />

        {/* Password Input */}
        <TextInput
          label="Password"
          value={password}
          onChangeText={(t) => { setPassword(t); setError(null); }}
          secureTextEntry={!showPassword}
          autoComplete="password"
          mode="outlined"
          left={<TextInput.Icon icon="lock-outline" color={colors.textMuted} />}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              color={colors.textMuted}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          textColor={colors.text}
          style={styles.input}
          theme={{
            colors: {
              onSurfaceVariant: colors.textMuted,
              surface: colors.surface,
            },
          }}
        />

        {/* Error */}
        {error && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Log In Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <Text style={styles.submitText}>Signing in...</Text>
          ) : (
            <Text style={styles.submitText}>Log In</Text>
          )}
        </TouchableOpacity>

        {/* Sign Up Link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('SignUp')}
          style={styles.linkRow}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>Don't have an account? </Text>
          <Text style={styles.linkAction}>Sign Up</Text>
        </TouchableOpacity>

        {/* Terms footer */}
        <View style={styles.termsFooter}>
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text
              style={styles.termsLink}
              onPress={() => navigation.navigate('TermsOfService')}
            >
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text
              style={styles.termsLink}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              Privacy Policy
            </Text>
            .
          </Text>
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
    paddingTop: 80,
    paddingBottom: spacing['4xl'],
  },

  // Hero
  heroSection: {
    marginBottom: spacing['3xl'],
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    ...typography.h2,
    color: colors.text,
    letterSpacing: -0.5,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
    lineHeight: 48,
    marginBottom: spacing.md,
  },
  heroSubtitle: {
    ...typography.bodyLarge,
    color: colors.textMuted,
  },

  // Phone CTA
  phoneCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg + 2,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  phoneCtaText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    fontWeight: '500',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textMuted,
    marginHorizontal: spacing.lg,
  },

  // Inputs
  input: {
    marginBottom: spacing.md,
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
    marginTop: spacing.sm,
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

  // Links
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  linkText: {
    ...typography.body,
    color: colors.textMuted,
  },
  linkAction: {
    ...typography.label,
    color: colors.primary,
    fontSize: 15,
  },

  // Terms
  termsFooter: {
    paddingTop: spacing.lg,
  },
  termsText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
