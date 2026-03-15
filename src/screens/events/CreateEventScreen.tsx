/**
 * Create event screen
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { createEvent } from '@/services/eventService';
import { useAuth } from '@/features/auth/AuthContext';
import type { EventsStackParamList } from '@/navigation/stacks/EventsStack';

type Props = NativeStackScreenProps<EventsStackParamList, 'CreateEvent'>;

const PACE_OPTIONS = ['Easy', 'Moderate', 'Tempo', 'Hard'];
const STYLE_OPTIONS = ['Casual', 'Training', 'Race', 'Social'];

export function CreateEventScreen({ navigation }: Props): React.JSX.Element {
  const { userId, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [sport, setSport] = useState(profile?.sportsProfiles?.[0]?.sport ?? '');
  const [distance, setDistance] = useState('');
  const [pace, setPace] = useState('');
  const [style, setStyle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (): Promise<void> => {
    if (!userId) return;
    setError(null);
    const distNum = parseFloat(distance);
    if (!title.trim()) {
      setError('Enter a title');
      return;
    }
    if (!sport.trim()) {
      setError('Enter a sport');
      return;
    }
    if (isNaN(distNum) || distNum <= 0) {
      setError('Enter valid distance');
      return;
    }
    if (!pace.trim()) {
      setError('Select pace');
      return;
    }
    if (!style.trim()) {
      setError('Select style');
      return;
    }
    const dateStr = date.trim() || new Date().toISOString().slice(0, 10);
    const timeStr = time.trim() || '09:00';
    const dateObj = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(dateObj.getTime())) {
      setError('Enter valid date and time');
      return;
    }
    if (!location.trim()) {
      setError('Enter location');
      return;
    }

    setLoading(true);
    try {
      await createEvent(userId, {
        title: title.trim(),
        sport: sport.trim(),
        distance: distNum,
        pace: pace.trim(),
        style: style.trim(),
        date: dateObj.getTime(),
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
    <ScrollView style={styles.container}>
      <TextInput
        label="Title"
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Sport"
        value={sport}
        onChangeText={setSport}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Distance (km)"
        value={distance}
        onChangeText={setDistance}
        keyboardType="decimal-pad"
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Pace (e.g. Easy, Moderate)"
        value={pace}
        onChangeText={setPace}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Style (e.g. Casual, Training)"
        value={style}
        onChangeText={setStyle}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
        placeholder="2025-03-15"
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Time (HH:MM)"
        value={time}
        onChangeText={setTime}
        placeholder="09:00"
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Location"
        value={location}
        onChangeText={setLocation}
        mode="outlined"
        style={styles.input}
      />
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
      <Button
        mode="contained"
        onPress={handleCreate}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Create Event
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: { marginBottom: 12 },
  button: { marginTop: 16 },
});
