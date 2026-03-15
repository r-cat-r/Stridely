/**
 * User profile Firestore service
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { timestampToMs } from '@/utils/firestore';
import type { UserProfile, SportsProfile } from '@/types';

const USERS_COLLECTION = 'users';

function userDoc(userId: string) {
  return doc(firestore(), USERS_COLLECTION, userId);
}

function fromFirestore(data: Record<string, unknown>): UserProfile {
  const raw = data as Record<string, unknown>;
  return {
    ...raw,
    createdAt: timestampToMs(raw.createdAt),
    updatedAt: timestampToMs(raw.updatedAt),
  } as UserProfile;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(userDoc(userId));
  return snap.exists() ? fromFirestore(snap.data() as Record<string, unknown>) : null;
}

export async function createUserProfile(
  userId: string,
  data: {
    email: string;
    displayName: string;
    photoURL?: string | null;
  }
): Promise<UserProfile> {
  const profile: UserProfile = {
    id: userId,
    email: data.email,
    displayName: data.displayName ?? '',
    photoURL: data.photoURL ?? null,
    bio: '',
    sportsProfiles: [],
    activeSportId: null,
    searchRadiusKm: 5,
    coordinates: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(userDoc(userId), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return profile;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'bio' | 'sportsProfiles' | 'activeSportId' | 'searchRadiusKm' | 'coordinates'>>
): Promise<void> {
  await updateDoc(userDoc(userId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function addSportsProfile(
  userId: string,
  profile: Omit<SportsProfile, 'id'>
): Promise<SportsProfile> {
  const user = await getUserProfile(userId);
  if (!user) throw new Error('User not found');
  const id = `sp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const newProfile: SportsProfile = { ...profile, id };
  const sportsProfiles = [...user.sportsProfiles, newProfile];
  await updateUserProfile(userId, { sportsProfiles });
  return newProfile;
}

export async function updateSportsProfile(
  userId: string,
  profile: SportsProfile
): Promise<void> {
  const user = await getUserProfile(userId);
  if (!user) throw new Error('User not found');
  const sportsProfiles = user.sportsProfiles.map((p) =>
    p.id === profile.id ? profile : p
  );
  await updateUserProfile(userId, { sportsProfiles });
}

export async function removeSportsProfile(
  userId: string,
  profileId: string
): Promise<void> {
  const user = await getUserProfile(userId);
  if (!user) throw new Error('User not found');
  const sportsProfiles = user.sportsProfiles.filter((p) => p.id !== profileId);
  await updateUserProfile(userId, {
    sportsProfiles,
    activeSportId: user.activeSportId === profileId ? null : user.activeSportId,
  });
}
