/**
 * Find Buddy - athlete discovery and compatibility scoring
 */

import { collection, getDocs } from 'firebase/firestore';
import { firestore } from './firebase';
import { getUserProfile } from './userService';
import { timestampToMs } from '@/utils/firestore';
import { haversineKm } from '@/utils/geo';
import type { UserProfile, SportsProfile, GeoCoordinates, DiscoveryMatch } from '@/types';

const USERS_COLLECTION = 'users';

function fromFirestore(data: Record<string, unknown>): UserProfile {
  const raw = data as Record<string, unknown>;
  return {
    ...raw,
    createdAt: timestampToMs(raw.createdAt),
    updatedAt: timestampToMs(raw.updatedAt),
  } as UserProfile;
}

/**
 * Compute compatibility percentage (0-100) based on:
 * - Pace similarity
 * - Distance similarity
 * - Skill level match
 * - Time preference match
 * - Location proximity (closer = slightly better)
 */
function computeCompatibility(
  myProfile: SportsProfile,
  theirProfile: SportsProfile,
  distanceKm: number,
  searchRadiusKm: number
): number {
  let score = 0;
  let weights = 0;

  // Pace similarity (0-25)
  const paceMatch = myProfile.pace === theirProfile.pace ? 1 : 0.5;
  score += paceMatch * 25;
  weights += 25;

  // Distance similarity (0-25) - within 20% of each other
  const distRatio = Math.min(myProfile.distance, theirProfile.distance) /
    Math.max(myProfile.distance, theirProfile.distance) || 1;
  const distScore = distRatio >= 0.8 ? 1 : distRatio;
  score += distScore * 25;
  weights += 25;

  // Skill level (0-25)
  const skillMatch = myProfile.skillLevel === theirProfile.skillLevel ? 1 : 0.5;
  score += skillMatch * 25;
  weights += 25;

  // Time preference (0-15)
  const timeMatch = myProfile.preferredTime === theirProfile.preferredTime ? 1 : 0.3;
  score += timeMatch * 15;
  weights += 15;

  // Proximity bonus (0-10) - closer within radius = better
  const proximityScore = Math.max(0, 1 - distanceKm / searchRadiusKm);
  score += proximityScore * 10;
  weights += 10;

  return Math.round((score / weights) * 100);
}

export async function discoverAthletes(
  userId: string,
  searchRadiusKm: 3 | 5 | 10 | 20
): Promise<DiscoveryMatch[]> {
  const myProfile = await getUserProfile(userId);
  if (!myProfile?.coordinates || !myProfile.activeSportId) {
    return [];
  }

  const activeProfile = myProfile.sportsProfiles.find(
    (p) => p.id === myProfile.activeSportId
  );
  if (!activeProfile) return [];

  const usersRef = collection(firestore(), USERS_COLLECTION);
  const snap = await getDocs(usersRef);

  const matches: DiscoveryMatch[] = [];

  for (const d of snap.docs) {
    const otherId = d.id;
    if (otherId === userId) continue;

    const data = d.data() as Record<string, unknown>;
    const other = fromFirestore(data);

    if (!other.coordinates || !other.activeSportId) continue;

    const distanceKm = haversineKm(myProfile.coordinates, other.coordinates);
    if (distanceKm > searchRadiusKm) continue;

    const theirActive = other.sportsProfiles.find(
      (p) => p.id === other.activeSportId
    );
    if (!theirActive || theirActive.sport !== activeProfile.sport) continue;

    const compatibility = computeCompatibility(
      activeProfile,
      theirActive,
      distanceKm,
      searchRadiusKm
    );

    matches.push({
      user: other,
      compatibility,
      distanceKm: Math.round(distanceKm * 10) / 10,
    });
  }

  matches.sort((a, b) => b.compatibility - a.compatibility);
  return matches;
}
