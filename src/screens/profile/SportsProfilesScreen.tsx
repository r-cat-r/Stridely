/**
 * Sports profiles screen - add/edit/select active sport
 */

import React, { useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { useAuth } from '@/features/auth/AuthContext';
import {
  addSportsProfile,
  updateUserProfile,
  removeSportsProfile,
} from '@/services/userService';
import type { SportsProfile } from '@/types';

const PACE_OPTIONS = ['Easy', 'Moderate', 'Tempo', 'Hard'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening'];

export function SportsProfilesScreen({
  navigation,
}: {
  navigation: { goBack: () => void };
}): React.JSX.Element {
  const { userId, profile, refreshProfile } = useAuth();
  const [adding, setAdding] = useState(false);
  const [sport, setSport] = useState('');
  const [distance, setDistance] = useState('');
  const [pace, setPace] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async (): Promise<void> => {
    if (!userId) return;
    const distNum = parseFloat(distance);
    if (!sport.trim() || isNaN(distNum) || distNum <= 0 || !pace || !skillLevel || !preferredTime) {
      return;
    }
    setLoading(true);
    try {
      await addSportsProfile(userId, {
        sport: sport.trim(),
        distance: distNum,
        pace,
        skillLevel,
        preferredTime,
      });
      await refreshProfile();
      setAdding(false);
      setSport('');
      setDistance('');
      setPace('');
      setSkillLevel('');
      setPreferredTime('');
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (profileId: string): Promise<void> => {
    if (!userId) return;
    await updateUserProfile(userId, { activeSportId: profileId });
    await refreshProfile();
  };

  const handleRemove = async (profileId: string): Promise<void> => {
    if (!userId) return;
    await removeSportsProfile(userId, profileId);
    await refreshProfile();
  };

  const profiles = profile?.sportsProfiles ?? [];
  const activeId = profile?.activeSportId;

  if (adding) {
    return (
      <AddSportsProfileForm
        sport={sport}
        setSport={setSport}
        distance={distance}
        setDistance={setDistance}
        pace={pace}
        setPace={setPace}
        skillLevel={skillLevel}
        setSkillLevel={setSkillLevel}
        preferredTime={preferredTime}
        setPreferredTime={setPreferredTime}
        onAdd={handleAdd}
        onCancel={() => setAdding(false)}
        loading={loading}
      />
    );
  }

  return (
    <View className="flex-1 p-4">
      <Button mode="contained" onPress={() => setAdding(true)} style={{ marginBottom: 16 }}>
        Add sport
      </Button>
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="p-4 mb-2 bg-slate-50 rounded-lg">
            <Text className="font-semibold text-slate-800">
              {item.sport} • {item.distance}km
            </Text>
            <Text className="text-slate-600 text-sm mt-1">
              {item.pace} • {item.skillLevel} • {item.preferredTime}
            </Text>
            <View className="flex-row gap-2 mt-2">
              <Button
                mode={activeId === item.id ? 'contained' : 'outlined'}
                compact
                onPress={() => handleSetActive(item.id)}
              >
                {activeId === item.id ? 'Active' : 'Set active'}
              </Button>
              <Button
                mode="text"
                compact
                textColor="#ef4444"
                onPress={() => handleRemove(item.id)}
              >
                Remove
              </Button>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-slate-500">No sports profiles. Add one to get started.</Text>
        }
      />
    </View>
  );
}

function AddSportsProfileForm({
  sport,
  setSport,
  distance,
  setDistance,
  pace,
  setPace,
  skillLevel,
  setSkillLevel,
  preferredTime,
  setPreferredTime,
  onAdd,
  onCancel,
  loading,
}: {
  sport: string;
  setSport: (s: string) => void;
  distance: string;
  setDistance: (s: string) => void;
  pace: string;
  setPace: (s: string) => void;
  skillLevel: string;
  setSkillLevel: (s: string) => void;
  preferredTime: string;
  setPreferredTime: (s: string) => void;
  onAdd: () => void;
  onCancel: () => void;
  loading: boolean;
}): React.JSX.Element {
  return (
    <View className="p-4">
      <TextInput
        label="Sport"
        value={sport}
        onChangeText={setSport}
        placeholder="Running, Cycling..."
        mode="outlined"
        style={{ marginBottom: 12 }}
      />
      <TextInput
        label="Distance (km)"
        value={distance}
        onChangeText={setDistance}
        keyboardType="decimal-pad"
        mode="outlined"
        style={{ marginBottom: 12 }}
      />
      <Text className="text-sm text-slate-600 mt-2">Pace</Text>
      <View className="flex-row flex-wrap gap-2 my-1">
        {PACE_OPTIONS.map((p) => (
          <Button
            key={p}
            mode={pace === p ? 'contained' : 'outlined'}
            compact
            onPress={() => setPace(p)}
          >
            {p}
          </Button>
        ))}
      </View>
      <Text className="text-sm text-slate-600 mt-2">Skill level</Text>
      <View className="flex-row flex-wrap gap-2 my-1">
        {SKILL_LEVELS.map((s) => (
          <Button
            key={s}
            mode={skillLevel === s ? 'contained' : 'outlined'}
            compact
            onPress={() => setSkillLevel(s)}
          >
            {s}
          </Button>
        ))}
      </View>
      <Text className="text-sm text-slate-600 mt-2">Preferred time</Text>
      <View className="flex-row flex-wrap gap-2 my-1">
        {TIME_OPTIONS.map((t) => (
          <Button
            key={t}
            mode={preferredTime === t ? 'contained' : 'outlined'}
            compact
            onPress={() => setPreferredTime(t)}
          >
            {t}
          </Button>
        ))}
      </View>
      <View className="flex-row gap-2 mt-4">
        <Button mode="contained" onPress={onAdd} loading={loading} disabled={loading}>
          Add
        </Button>
        <Button mode="outlined" onPress={onCancel} disabled={loading}>
          Cancel
        </Button>
      </View>
    </View>
  );
}
