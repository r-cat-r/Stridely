/**
 * Create event screen — premium with pickers
 *
 * Uses dropdown menus for Sport, Pace, Style, Distance and
 * native date/time pickers for scheduling.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { createEvent } from '@/services/eventService';
import { useAuth } from '@/features/auth/AuthContext';
import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';
import type { EventsStackParamList } from '@/navigation/stacks/EventsStack';

type Props = NativeStackScreenProps<EventsStackParamList, 'CreateEvent'>;

const SPORT_OPTIONS = ['Running', 'Cycling', 'Swimming', 'Hiking', 'Walking', 'Trail Running'];
const DISTANCE_OPTIONS = ['1', '2', '3', '5', '7', '10', '15', '20', '25', '30', '42', '50', '100'];
const PACE_OPTIONS = ['Easy', 'Moderate', 'Tempo', 'Hard', 'Race Pace'];
const STYLE_OPTIONS = ['Casual', 'Training', 'Race', 'Social', 'Recovery', 'Long Run'];

export function CreateEventScreen({ navigation }: Props): React.JSX.Element {
  const { userId, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [sport, setSport] = useState(profile?.sportsProfiles?.[0]?.sport ?? '');
  const [distance, setDistance] = useState('');
  const [pace, setPace] = useState('');
  const [style, setStyle] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Picker modal state
  const [pickerField, setPickerField] = useState<string | null>(null);
  const [pickerOptions, setPickerOptions] = useState<string[]>([]);

  const dateStr = useMemo(
    () =>
      date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [date]
  );
  const timeStr = useMemo(
    () =>
      date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [date]
  );

  const openPicker = (field: string, options: string[]) => {
    setPickerField(field);
    setPickerOptions(options);
  };

  const selectOption = (value: string) => {
    switch (pickerField) {
      case 'sport':
        setSport(value);
        break;
      case 'distance':
        setDistance(value);
        break;
      case 'pace':
        setPace(value);
        break;
      case 'style':
        setStyle(value);
        break;
    }
    setPickerField(null);
  };

  const handleCreate = async (): Promise<void> => {
    if (!userId) return;
    setError(null);
    if (!title.trim()) { setError('Enter a title'); return; }
    if (!sport) { setError('Select a sport'); return; }
    const distNum = parseFloat(distance);
    if (isNaN(distNum) || distNum <= 0) { setError('Select distance'); return; }
    if (!pace) { setError('Select pace'); return; }
    if (!style) { setError('Select style'); return; }
    if (!location.trim()) { setError('Enter a location'); return; }

    setLoading(true);
    try {
      await createEvent(userId, {
        title: title.trim(),
        sport,
        distance: distNum,
        pace,
        style,
        date: date.getTime(),
        location: location.trim(),
        coordinates: profile?.coordinates ?? null,
      });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        {/* Title */}
        <TextInput
          label="Event Title"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          left={<TextInput.Icon icon="pencil-outline" />}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          style={styles.input}
        />

        {/* Sport dropdown */}
        <DropdownField
          label="Sport"
          value={sport}
          icon="run"
          onPress={() => openPicker('sport', SPORT_OPTIONS)}
        />

        {/* Distance dropdown */}
        <DropdownField
          label="Distance (km)"
          value={distance ? `${distance} km` : ''}
          icon="map-marker-distance"
          onPress={() => openPicker('distance', DISTANCE_OPTIONS)}
        />

        {/* Pace dropdown */}
        <DropdownField
          label="Pace"
          value={pace}
          icon="speedometer"
          onPress={() => openPicker('pace', PACE_OPTIONS)}
        />

        {/* Style dropdown */}
        <DropdownField
          label="Style"
          value={style}
          icon="tag-outline"
          onPress={() => openPicker('style', STYLE_OPTIONS)}
        />

        {/* Date picker */}
        <TouchableOpacity
          style={styles.pickerBtn}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
          <View style={styles.pickerInfo}>
            <Text style={styles.pickerLabel}>Date</Text>
            <Text style={styles.pickerValue}>{dateStr}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Time picker */}
        <TouchableOpacity
          style={styles.pickerBtn}
          onPress={() => setShowTimePicker(true)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
          <View style={styles.pickerInfo}>
            <Text style={styles.pickerLabel}>Time</Text>
            <Text style={styles.pickerValue}>{timeStr}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Location */}
        <TextInput
          label="Location"
          value={location}
          onChangeText={setLocation}
          mode="outlined"
          left={<TextInput.Icon icon="map-marker-outline" />}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          style={styles.input}
        />

        {/* Error */}
        {error && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Submit */}
        <Button
          mode="contained"
          onPress={handleCreate}
          loading={loading}
          disabled={loading}
          buttonColor={colors.primary}
          style={styles.submitBtn}
          contentStyle={{ paddingVertical: 6 }}
          labelStyle={{ ...typography.label, fontSize: 15 }}
        >
          Create Event
        </Button>
      </View>

      {/* Date/Time pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={(_, selected) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selected) {
              const next = new Date(date);
              next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
              setDate(next);
            }
          }}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selected) => {
            setShowTimePicker(Platform.OS === 'ios');
            if (selected) {
              const next = new Date(date);
              next.setHours(selected.getHours(), selected.getMinutes());
              setDate(next);
            }
          }}
        />
      )}

      {/* Dropdown modal */}
      <Modal
        visible={!!pickerField}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerField(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerField(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select {pickerField}
            </Text>
            <FlatList
              data={pickerOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected =
                  (pickerField === 'sport' && item === sport) ||
                  (pickerField === 'distance' && item === distance) ||
                  (pickerField === 'pace' && item === pace) ||
                  (pickerField === 'style' && item === style);
                return (
                  <TouchableOpacity
                    style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                    onPress={() => selectOption(item)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {pickerField === 'distance' ? `${item} km` : item}
                    </Text>
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

function DropdownField({
  label,
  value,
  icon,
  onPress,
}: {
  label: string;
  value: string;
  icon: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <TouchableOpacity
      style={styles.pickerBtn}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons name={icon as any} size={20} color={colors.primary} />
      <View style={styles.pickerInfo}>
        <Text style={styles.pickerLabel}>{label}</Text>
        <Text style={[styles.pickerValue, !value && styles.pickerPlaceholder]}>
          {value || `Select ${label.toLowerCase()}`}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.md,
  },
  input: { marginBottom: spacing.md, backgroundColor: colors.surface },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  pickerInfo: { flex: 1 },
  pickerLabel: { ...typography.caption, color: colors.textMuted, marginBottom: 2 },
  pickerValue: { ...typography.body, color: colors.text },
  pickerPlaceholder: { color: colors.textMuted },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.md,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.bodySmall, color: colors.error, flex: 1 },
  submitBtn: { borderRadius: borderRadius.md, marginTop: spacing.sm },

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
