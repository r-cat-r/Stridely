/**
 * Event activity card - Strava-style
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Event } from '@/types';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

export function EventCard({ event, onPress }: EventCardProps): React.JSX.Element {
  const sportIcon =
    event.sport === 'Cycling' ? 'bike' : event.sport === 'Swimming' ? 'swim' : 'run';
  const date = new Date(event.date);
  const dateStr = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={styles.sportBadge}>
          <MaterialCommunityIcons
            name={sportIcon as 'run' | 'bike' | 'swim'}
            size={16}
            color={colors.primary}
          />
          <Text style={styles.sportText}>{event.sport}</Text>
        </View>
        <Text style={styles.pace}>{event.pace}</Text>
      </View>
      <Text style={styles.title}>{event.title}</Text>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="map-marker" size={14} color={colors.textSecondary} />
          <Text style={styles.statText}>{event.distance} km</Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
          <Text style={styles.statText}>{dateStr}</Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.statText}>{timeStr}</Text>
        </View>
      </View>
      <Text style={styles.location} numberOfLines={1}>
        {event.location}
      </Text>
      <View style={styles.footer}>
        <View style={styles.participants}>
          <MaterialCommunityIcons name="account-group" size={14} color={colors.textMuted} />
          <Text style={styles.participantCount}>
            {event.participantIds.length} joined
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sportText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  pace: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  location: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
