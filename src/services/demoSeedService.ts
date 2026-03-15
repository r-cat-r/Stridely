/**
 * Development-only demo data seeding
 */

import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from './firebase';
import type { UserProfile, GeoCoordinates } from '@/types';

const __DEV__ = process.env.NODE_ENV !== 'production';

function jitterCoord(base: number, kmOffset: number): number {
  const degPerKm = 1 / 111;
  return base + (Math.random() - 0.5) * 2 * kmOffset * degPerKm;
}

const DEMO_NAMES = [
  'Alex Chen', 'Jordan Lee', 'Sam Rivera', 'Casey Morgan',
  'Morgan Taylor', 'Riley Davis', 'Quinn Smith', 'Avery Johnson',
  'Jamie Wilson', 'Drew Martinez', 'Skyler Brown', 'Parker Evans',
  'Cameron White', 'Reese Clark', 'Finley Lewis', 'Blake Hall',
  'Sage Young', 'Rowan King', 'Emery Wright', 'Hayden Scott',
];

const DEMO_SPORTS = ['Running', 'Cycling', 'Swimming'];
const DEMO_PACES = ['Easy', 'Moderate', 'Tempo', 'Hard'];
const DEMO_SKILLS = ['Beginner', 'Intermediate', 'Advanced'];
const DEMO_TIMES = ['Morning', 'Afternoon', 'Evening'];

export async function seedDemoData(
  userId: string,
  userCoords: GeoCoordinates,
  userActiveSport?: string
): Promise<void> {
  if (!__DEV__) return;

  const usersRef = collection(firestore(), 'users');
  const lat = userCoords.latitude;
  const lng = userCoords.longitude;
  const timestamp = Date.now();
  const demoAthleteIds: string[] = [];
  const preferredSport = userActiveSport || 'Running';

  for (let i = 0; i < 20; i++) {
    const id = `demo_athlete_${i}_${timestamp}`;
    demoAthleteIds.push(id);
    const sport = i < 10 ? preferredSport : DEMO_SPORTS[i % DEMO_SPORTS.length];
    const profile: UserProfile = {
      id,
      email: `demo${i}@stridely.dev`,
      displayName: DEMO_NAMES[i],
      photoURL: null,
      bio: `Love ${sport.toLowerCase()}. Looking for training buddies!`,
      sportsProfiles: [{
        id: `sp_${id}`,
        sport,
        distance: [5, 10, 15, 21][i % 4],
        pace: DEMO_PACES[i % DEMO_PACES.length],
        skillLevel: DEMO_SKILLS[i % DEMO_SKILLS.length],
        preferredTime: DEMO_TIMES[i % DEMO_TIMES.length],
      }],
      activeSportId: `sp_${id}`,
      searchRadiusKm: 10,
      coordinates: {
        latitude: jitterCoord(lat, 15),
        longitude: jitterCoord(lng, 15),
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await setDoc(doc(usersRef, id), profile);
  }

  const eventsRef = collection(firestore(), 'events');
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = 0; i < 5; i++) {
    const eventData = {
      creatorId: userId,
      title: `Demo ${['Morning Run', 'Evening Ride', 'Swim Session', 'Trail Run', 'Long Run'][i]}`,
      sport: DEMO_SPORTS[i % DEMO_SPORTS.length],
      distance: [5, 10, 3, 15, 21][i],
      pace: DEMO_PACES[i % DEMO_PACES.length],
      style: 'Casual',
      date: now + (i + 1) * dayMs,
      location: `Demo Location ${i + 1}`,
      coordinates: {
        latitude: jitterCoord(lat, 5),
        longitude: jitterCoord(lng, 5),
      },
      participantIds: [userId],
      requestIds: [],
      conversationId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await addDoc(eventsRef, eventData);
  }

  const convRef = collection(firestore(), 'conversations');
  const msgRef = collection(firestore(), 'messages');

  for (let j = 0; j < 2 && j < demoAthleteIds.length; j++) {
    const otherId = demoAthleteIds[j];
    const conv = await addDoc(convRef, {
      type: 'buddy',
      participantIds: [userId, otherId],
      eventId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await addDoc(msgRef, {
      conversationId: conv.id,
      senderId: otherId,
      text: 'Hey! Interested in a run this weekend?',
      timestamp: serverTimestamp(),
    });
  }

  const eventsSnap = await getDocs(
    query(collection(firestore(), 'events'), where('creatorId', '==', userId))
  );
  const eventDocs = eventsSnap.docs.slice(0, 2);
  for (const d of eventDocs) {
    const conv = await addDoc(convRef, {
      type: 'event',
      participantIds: [userId],
      eventId: d.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await addDoc(msgRef, {
      conversationId: conv.id,
      senderId: userId,
      text: 'Event chat started!',
      timestamp: serverTimestamp(),
    });
  }
}
