/**
 * Sport Selection screen — post-signup onboarding
 *
 * Strava-inspired grid of sports with dark cards.
 * User selects ONE sport at a time, then proceeds to fill details.
 * After saving, they're prompted to add more or finish.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { SportCard } from '@/components/SportCard';
import { SPORTS } from '@/constants/sportConfig';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'SportSelection'>;

export function SportSelectionScreen({ navigation }: Props): React.JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = (): void => {
    if (!selected) return;
    navigation.navigate('SportDetails', { sport: selected });
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          What types of{'\n'}activities do you{'\n'}like to do?
        </Text>
        <Text style={styles.subtitle}>
          Choose your primary sport to set up your athlete profile. You can add more later.
        </Text>
      </View>

      {/* Sport Grid */}
      <FlatList
        data={SPORTS}
        keyExtractor={(item) => item.name}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SportCard
            name={item.name}
            icon={item.icon}
            selected={selected === item.name}
            onPress={() => setSelected(item.name)}
          />
        )}
      />

      {/* Continue Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!selected}
          activeOpacity={0.8}
        >
          <Text style={[styles.continueText, !selected && styles.continueTextDisabled]}>
            Continue
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={selected ? colors.textOnPrimary : colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: 60,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 22,
  },
  gridContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.lg + 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadows.glow,
  },
  continueBtnDisabled: {
    backgroundColor: colors.surface,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueText: {
    ...typography.label,
    fontSize: 16,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  continueTextDisabled: {
    color: colors.textMuted,
  },
});
