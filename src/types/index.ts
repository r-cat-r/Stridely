/**
 * Shared TypeScript type definitions
 */

// --- User & Profile ---

export interface SportsProfile {
  id: string;
  sport: string;
  distance: number;
  pace: string;
  skillLevel: string;
  preferredTime: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  /** Profile photo: either a data URI (data:image/jpeg;base64,...) or null */
  photoURL: string | null;
  bio: string;
  sportsProfiles: SportsProfile[];
  activeSportId: string | null;
  searchRadiusKm: 3 | 5 | 10 | 20;
  coordinates: GeoCoordinates | null;
  createdAt: number;
  updatedAt: number;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

// --- Invites ---

export type InviteStatus = 'pending' | 'accepted' | 'rejected';

export interface BuddyInvite {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: InviteStatus;
  sportProfileId: string;
  message?: string;
  createdAt: number;
  updatedAt: number;
}

// --- Events ---

export type EventRequestStatus = 'pending' | 'approved' | 'rejected';

export interface EventRequest {
  id: string;
  eventId: string;
  userId: string;
  status: EventRequestStatus;
  message?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Event {
  id: string;
  creatorId: string;
  title: string;
  sport: string;
  distance: number;
  pace: string;
  style: string;
  date: number;
  location: string;
  coordinates: GeoCoordinates | null;
  participantIds: string[];
  requestIds: string[];
  conversationId: string | null;
  createdAt: number;
  updatedAt: number;
}

// --- Conversations & Chat ---

export type ConversationType = 'buddy' | 'event';

export interface Conversation {
  id: string;
  type: ConversationType;
  participantIds: string[];
  eventId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: number;
}

// --- Discovery ---

export interface DiscoveryMatch {
  user: UserProfile;
  compatibility: number;
  distanceKm: number;
}
