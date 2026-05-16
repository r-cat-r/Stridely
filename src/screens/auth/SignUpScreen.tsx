/**
 * Sign up screen — premium dark auth with live password strength
 *
 * Layout:
 * 1. Back arrow + "Create an Account" title
 * 2. "Continue with Phone" CTA
 * 3. Divider
 * 4. Display name, Email, Password inputs
 * 5. Password strength indicator
 * 6. "Sign Up" lime accent button
 * 7. Login link + T&C footer
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
import { updateProfile } from 'firebase/auth';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { signUp } from '@/services/authService';
import {
  isValidEmail,
  getPasswordStrength,
  type PasswordRule,
} from '@/utils/validation';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props): React.JSX.Element {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = useMemo(() => isValidEmail(email), [email]);
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSignUp = async (): Promise<void> => {
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!emailValid) {
      setError('Please enter a valid email address (e.g. name@gmail.com)');
      return;
    }
    if (!passwordStrength.isValid) {
      setError('Please meet all password requirements');
      return;
    }

    setLoading(true);
    try {
      const { user } = await signUp(email.trim(), password);
      if (displayName.trim()) {
        await updateProfile(user, { displayName: displayName.trim() });
      }
      // AuthContext will detect the new user and route to onboarding
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign up failed';
      if (msg.includes('auth/email-already-in-use')) {
        setError('An account with this email already exists');
      } else if (msg.includes('auth/weak-password')) {
        setError('Password is too weak');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputTheme = {
    colors: {
      onSurfaceVariant: colors.textMuted,
      surface: colors.surface,
    },
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
        {/* Header */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Create an{'\n'}Account</Text>
        <Text style={styles.subtitle}>Join the community of athletes</Text>

        {/* Phone CTA */}
        <TouchableOpacity
          style={styles.phoneCta}
          onPress={() => navigation.navigate('PhoneAuth', { mode: 'signup' })}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="phone-outline" size={20} color={colors.text} />
          <Text style={styles.phoneCtaText}>Continue with Phone Number</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Display Name */}
        <TextInput
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          mode="outlined"
          left={<TextInput.Icon icon="account-outline" color={colors.textMuted} />}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          textColor={colors.text}
          style={styles.input}
          theme={inputTheme}
        />

        {/* Email */}
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
          theme={inputTheme}
        />

        {/* Password */}
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
          theme={inputTheme}
        />

        {/* Password Strength */}
        {password.length > 0 && (
          <View style={styles.strengthSection}>
            {/* Strength bar */}
            <View style={styles.strengthBarBg}>
              <View
                style={[
                  styles.strengthBar,
                  {
                    width:
                      passwordStrength.strength === 'weak'
                        ? '33%'
                        : passwordStrength.strength === 'fair'
                          ? '66%'
                          : '100%',
                    backgroundColor:
                      passwordStrength.strength === 'weak'
                        ? colors.error
                        : passwordStrength.strength === 'fair'
                          ? colors.warning
                          : colors.primary,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.strengthLabel,
                {
                  color:
                    passwordStrength.strength === 'weak'
                      ? colors.error
                      : passwordStrength.strength === 'fair'
                        ? colors.warning
                        : colors.primary,
                },
              ]}
            >
              {passwordStrength.strength === 'weak'
                ? 'Weak'
                : passwordStrength.strength === 'fair'
                  ? 'Fair'
                  : 'Strong'}
            </Text>

            {/* Individual rules */}
            {passwordStrength.rules.map((rule) => (
              <PasswordRuleRow key={rule.label} rule={rule} />
            ))}
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSignUp}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.submitText}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        {/* Login link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.linkRow}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>Already have an account? </Text>
          <Text style={styles.linkAction}>Log In</Text>
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

/** Individual password rule indicator */
function PasswordRuleRow({ rule }: { rule: PasswordRule }): React.JSX.Element {
  return (
    <View style={styles.ruleRow}>
      <MaterialCommunityIcons
        name={rule.met ? 'check-circle' : 'circle-outline'}
        size={16}
        color={rule.met ? colors.primary : colors.textMuted}
      />
      <Text style={[styles.ruleText, rule.met && styles.ruleTextMet]}>
        {rule.label}
      </Text>
    </View>
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

  // Header
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
    lineHeight: 44,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.textMuted,
    marginBottom: spacing['3xl'],
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

  // Password strength
  strengthSection: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  strengthBarBg: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xs + 2,
  },
  ruleText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  ruleTextMet: {
    color: colors.primary,
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