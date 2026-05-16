/**
 * Events list — premium with filter bar
 *
 * Supports filtering by Sport, Pace, Style, and Date.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { getAllUpcomingEvents } from '@/services/eventService';
import { EventCard } from '@/components/EventCard';
import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';
import type { Event } from '@/types';
import type { EventsStackParamList } from '@/navigation/stacks/EventsStack';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventsList'>;

const SPORT_FILTER = ['All', 'Running', 'Cycling', 'Swimming', 'Hiking', 'Walking', 'Trail Running'];
const PACE_FILTER = ['All', 'Easy', 'Moderate', 'Tempo', 'Hard', 'Race Pace'];
const STYLE_FILTER = ['All', 'Casual', 'Training', 'Race', 'Social', 'Recovery'];
const DATE_FILTER = ['All', 'Today', 'This Week', 'This Month', 'Next 3 Months'];

interface Filters {
  sport: string;
  pace: string;
  style: string;
  dateRange: string;
}

export function EventsListScreen({ navigation }: Props): React.JSX.Element {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    sport: 'All',
    pace: 'All',
    style: 'All',
    dateRange: 'All',
  });
  const [filterField, setFilterField] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<string[]>([]);

  const load = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const list = await getAllUpcomingEvents();
      setEvents(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredEvents = useMemo(() => {
    let result = events;

    if (filters.sport !== 'All') {
      result = result.filter((e) => e.sport === filters.sport);
    }
    if (filters.pace !== 'All') {
      result = result.filter((e) => e.pace === filters.pace);
    }
    if (filters.style !== 'All') {
      result = result.filter((e) => e.style === filters.style);
    }
    if (filters.dateRange !== 'All') {
      const now = new Date();
      const end = new Date();
      switch (filters.dateRange) {
        case 'Today':
          end.setHours(23, 59, 59, 999);
          break;
        case 'This Week':
          end.setDate(end.getDate() + (7 - end.getDay()));
          break;
        case 'This Month':
          end.setMonth(end.getMonth() + 1, 0);
          break;
        case 'Next 3 Months':
          end.setMonth(end.getMonth() + 3);
          break;
      }
      result = result.filter(
        (e) => e.date >= now.getTime() && e.date <= end.getTime()
      );
    }

    return result;
  }, [events, filters]);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((v) => v !== 'All').length,
    [filters]
  );

  const openFilter = (field: string, options: string[]) => {
    setFilterField(field);
    setFilterOptions(options);
  };

  const selectFilter = (value: string) => {
    switch (filterField) {
      case 'sport': setFilters((f) => ({ ...f, sport: value })); break;
      case 'pace': setFilters((f) => ({ ...f, pace: value })); break;
      case 'style': setFilters((f) => ({ ...f, style: value })); break;
      case 'dateRange': setFilters((f) => ({ ...f, dateRange: value })); break;
    }
    setFilterField(null);
  };

  const currentFilterValue = filterField
    ? filters[filterField as keyof Filters]
    : '';

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Filter bar */}
      <View style={styles.filterBar}>
        <FilterChip
          label="Sport"
          value={filters.sport}
          onPress={() => openFilter('sport', SPORT_FILTER)}
        />
        <FilterChip
          label="Pace"
          value={filters.pace}
          onPress={() => openFilter('pace', PACE_FILTER)}
        />
        <FilterChip
          label="Style"
          value={filters.style}
          onPress={() => openFilter('style', STYLE_FILTER)}
        />
        <FilterChip
          label="Date"
          value={filters.dateRange}
          onPress={() => openFilter('dateRange', DATE_FILTER)}
        />
        {activeFilterCount > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() =>
              setFilters({ sport: 'All', pace: 'All', style: 'All', dateRange: 'All' })
            }
          >
            <MaterialCommunityIcons name="close-circle" size={16} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Results count */}
      <View style={styles.countBar}>
        <Text style={styles.countText}>
          {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorState}>
          <Text style={styles.errorTitle}>Error loading events</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            filteredEvents.length === 0 ? styles.emptyContainer : styles.list
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <MaterialCommunityIcons
                  name="calendar-blank-outline"
                  size={56}
                  color={colors.textMuted}
                />
              </View>
              <Text style={styles.emptyTitle}>No events found</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilterCount > 0
                  ? 'Try adjusting your filters'
                  : 'Create an event to find training buddies'}
              </Text>
            </View>
          }
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        color={colors.textOnPrimary}
        onPress={() => navigation.navigate('CreateEvent')}
      />

      {/* Filter modal */}
      <Modal
        visible={!!filterField}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterField(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterField(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Filter by {filterField === 'dateRange' ? 'Date' : filterField}
            </Text>
            <FlatList
              data={filterOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = item === currentFilterValue;
                return (
                  <TouchableOpacity
                    style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                    onPress={() => selectFilter(item)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.optionText, isSelected && styles.optionTextSelected]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function FilterChip({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}): React.JSX.Element {
  const isActive = value !== 'All';
  return (
    <TouchableOpacity
      style={[styles.chip, isActive && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
        {isActive ? value : label}
      </Text>
      <MaterialCommunityIcons
        name="chevron-down"
        size={14}
        color={isActive ? colors.textOnPrimary : colors.textMuted}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: 0,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: colors.textOnPrimary },
  clearBtn: { padding: spacing.xs },
  countBar: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  countText: { ...typography.label, color: colors.textMuted },
  list: { paddingBottom: spacing['4xl'] + 16 },
  emptyContainer: { flex: 1 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['4xl'],
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.sm },
  emptySubtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['4xl'],
  },
  errorTitle: { ...typography.h2, color: colors.error, marginBottom: spacing.sm },
  errorMsg: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  retryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  retryText: { ...typography.label, color: colors.textOnPrimary },

  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing['3xl'],
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    maxHeight: '60%',
    overflow: 'hidden',
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    textTransform: 'capitalize',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  optionRowSelected: { backgroundColor: colors.borderLight },
  optionText: { ...typography.body, color: colors.text },
  optionTextSelected: { color: colors.primary, fontWeight: '600' },
});
