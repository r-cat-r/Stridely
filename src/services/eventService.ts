/**
 * Event Firestore service
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
  orderBy,
  arrayUnion,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { timestampToMs } from '@/utils/firestore';
import { haversineKm } from '@/utils/geo';
import type { Event, EventRequest, GeoCoordinates } from '@/types';

const EVENTS_COLLECTION = 'events';
const EVENT_REQUESTS_COLLECTION = 'eventRequests';

function eventDoc(id: string) {
  return doc(firestore(), EVENTS_COLLECTION, id);
}

function eventsCollection() {
  return collection(firestore(), EVENTS_COLLECTION);
}

function eventRequestDoc(id: string) {
  return doc(firestore(), EVENT_REQUESTS_COLLECTION, id);
}

function eventRequestsCollection() {
  return collection(firestore(), EVENT_REQUESTS_COLLECTION);
}

function toEvent(id: string, data: Record<string, unknown>): Event {
  const raw = data as Record<string, unknown>;
  return {
    id,
    creatorId: raw.creatorId as string,
    title: raw.title as string,
    sport: raw.sport as string,
    distance: raw.distance as number,
    pace: raw.pace as string,
    style: raw.style as string,
    date: timestampToMs(raw.date),
    location: raw.location as string,
    coordinates: raw.coordinates as GeoCoordinates | null,
    participantIds: (raw.participantIds as string[]) ?? [],
    requestIds: (raw.requestIds as string[]) ?? [],
    conversationId: (raw.conversationId as string | null) ?? null,
    createdAt: timestampToMs(raw.createdAt),
    updatedAt: timestampToMs(raw.updatedAt),
  };
}

function toEventRequest(id: string, data: Record<string, unknown>): EventRequest {
  const raw = data as Record<string, unknown>;
  return {
    id,
    eventId: raw.eventId as string,
    userId: raw.userId as string,
    status: raw.status as 'pending' | 'approved' | 'rejected',
    message: raw.message as string | undefined,
    createdAt: timestampToMs(raw.createdAt),
    updatedAt: timestampToMs(raw.updatedAt),
  };
}

export async function createEvent(
  creatorId: string,
  data: {
    title: string;
    sport: string;
    distance: number;
    pace: string;
    style: string;
    date: number;
    location: string;
    coordinates?: GeoCoordinates | null;
  }
): Promise<Event> {
  const ref = await addDoc(eventsCollection(), {
    creatorId,
    ...data,
    participantIds: [creatorId],
    requestIds: [],
    conversationId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  return toEvent(ref.id, snap.data() as Record<string, unknown>);
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const snap = await getDoc(eventDoc(eventId));
  return snap.exists() ? toEvent(snap.id, snap.data() as Record<string, unknown>) : null;
}

export async function getEventsNearby(
  coordinates: GeoCoordinates,
  radiusKm: number
): Promise<Event[]> {
  const now = Date.now();
  const q = query(
    eventsCollection(),
    where('date', '>=', now),
    orderBy('date', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => toEvent(d.id, d.data() as Record<string, unknown>))
    .filter((e) => {
      if (!e.coordinates) return true; // Include events without coords
      return haversineKm(coordinates, e.coordinates) <= radiusKm;
    });
}

export async function getAllUpcomingEvents(): Promise<Event[]> {
  const now = Date.now();
  const q = query(
    eventsCollection(),
    where('date', '>=', now),
    orderBy('date', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toEvent(d.id, d.data() as Record<string, unknown>));
}

export async function requestToJoinEvent(
  eventId: string,
  userId: string,
  message?: string
): Promise<EventRequest> {
  const ref = await addDoc(eventRequestsCollection(), {
    eventId,
    userId,
    status: 'pending',
    message: message ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const event = await getEvent(eventId);
  if (event) {
    await updateDoc(eventDoc(eventId), {
      requestIds: arrayUnion(ref.id),
      updatedAt: serverTimestamp(),
    });
  }
  const snap = await getDoc(ref);
  return toEventRequest(ref.id, snap.data() as Record<string, unknown>);
}

export async function approveEventRequest(
  eventId: string,
  requestId: string
): Promise<void> {
  const reqSnap = await getDoc(eventRequestDoc(requestId));
  if (!reqSnap.exists()) throw new Error('Request not found');
  const req = toEventRequest(reqSnap.id, reqSnap.data() as Record<string, unknown>);
  await updateDoc(eventRequestDoc(requestId), {
    status: 'approved',
    updatedAt: serverTimestamp(),
  });
  const event = await getEvent(eventId);
  if (event && !event.participantIds.includes(req.userId)) {
    await updateDoc(eventDoc(eventId), {
      participantIds: arrayUnion(req.userId),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function rejectEventRequest(
  requestId: string
): Promise<void> {
  await updateDoc(eventRequestDoc(requestId), {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });
}

export async function getEventRequests(eventId: string): Promise<EventRequest[]> {
  const q = query(
    eventRequestsCollection(),
    where('eventId', '==', eventId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toEventRequest(d.id, d.data() as Record<string, unknown>));
}

