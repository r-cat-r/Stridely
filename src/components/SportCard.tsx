/**
 * SportCard — selectable sport card for grid layout
 *
 * Features:
 * - Icon + label in a dark elevated card
 * - Selected state with lime border and subtle glow
 * - Consistent sizing for 2-column grid
 */

import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';

interface SportCardProps {
  name: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}

export function SportCard({
  name,
  icon,
  selected,
  onPress,
}: SportCardProps): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.cardSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={28}
          color={selected ? colors.primary : colors.textSecondary}
        />
      </View>
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    margin: spacing.sm,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 110,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
    ...shadows.glow,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconWrapSelected: {
    backgroundColor: 'rgba(187, 242, 70, 0.2)',
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 14,
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
});
