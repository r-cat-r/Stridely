/**
 * Location hook - request permission and get coordinates
 */

import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import type { GeoCoordinates } from '@/types';

export function useLocation(): {
  coordinates: GeoCoordinates | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [coordinates, setCoordinates] = useState<GeoCoordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoordinates({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return { coordinates, loading, error, refresh: fetchLocation };
}
