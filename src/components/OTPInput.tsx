/**
 * OTPInput — 6-digit OTP code entry
 *
 * Features:
 * - Individual styled input boxes per digit
 * - Auto-advance to next field on entry
 * - Backspace navigates to previous field
 * - Auto-submit when all 6 digits entered
 * - Dark themed with lime accent focus state
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
}

export function OTPInput({
  length = 6,
  onComplete,
  disabled = false,
}: OTPInputProps): React.JSX.Element {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<(TextInput | null)[]>([]);

  const handleChange = useCallback(
    (text: string, index: number) => {
      // Only accept digits
      const digit = text.replace(/[^0-9]/g, '').slice(-1);
      const newValues = [...values];
      newValues[index] = digit;
      setValues(newValues);

      if (digit && index < length - 1) {
        refs.current[index + 1]?.focus();
      }

      // Auto-submit when all digits entered
      if (digit && newValues.every((v) => v !== '')) {
        onComplete(newValues.join(''));
      }
    },
    [values, length, onComplete]
  );

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
      if (e.nativeEvent.key === 'Backspace' && !values[index] && index > 0) {
        const newValues = [...values];
        newValues[index - 1] = '';
        setValues(newValues);
        refs.current[index - 1]?.focus();
      }
    },
    [values]
  );

  /** Reset all fields (exposed via parent calling state reset) */
  const reset = useCallback(() => {
    setValues(Array(length).fill(''));
    refs.current[0]?.focus();
  }, [length]);

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, i) => (
        <TextInput
          key={i}
          ref={(ref) => {
            refs.current[i] = ref;
          }}
          style={[
            styles.box,
            values[i] ? styles.boxFilled : null,
          ]}
          value={values[i]}
          onChangeText={(text) => handleChange(text, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={1}
          editable={!disabled}
          selectTextOnFocus
          caretHidden
          autoComplete="one-time-code"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginVertical: spacing['2xl'],
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  boxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
});
