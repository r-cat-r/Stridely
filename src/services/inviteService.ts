/**
 * Buddy invite Firestore service
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { timestampToMs } from '@/utils/firestore';
import type { BuddyInvite, InviteStatus } from '@/types';

const INVITES_COLLECTION = 'buddyInvites';

function inviteDoc(id: string) {
  return doc(firestore(), INVITES_COLLECTION, id);
}

function invitesCollection() {
  return collection(firestore(), INVITES_COLLECTION);
}

function toInvite(id: string, data: Record<string, unknown>): BuddyInvite {
  const raw = data as Record<string, unknown>;
  return {
    id,
    fromUserId: raw.fromUserId as string,
    toUserId: raw.toUserId as string,
    status: raw.status as InviteStatus,
    sportProfileId: raw.sportProfileId as string,
    message: raw.message as string | undefined,
    createdAt: timestampToMs(raw.createdAt),
    updatedAt: timestampToMs(raw.updatedAt),
  };
}

export async function sendInvite(
  fromUserId: string,
  toUserId: string,
  sportProfileId: string,
  message?: string
): Promise<BuddyInvite> {
  const ref = await addDoc(invitesCollection(), {
    fromUserId,
    toUserId,
    sportProfileId,
    message: message ?? null,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  return toInvite(ref.id, snap.data() as Record<string, unknown>);
}

export async function respondToInvite(
  inviteId: string,
  status: 'accepted' | 'rejected'
): Promise<void> {
  await updateDoc(inviteDoc(inviteId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function getInvitesForUser(userId: string): Promise<BuddyInvite[]> {
  const q = query(
    invitesCollection(),
    where('toUserId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toInvite(d.id, d.data() as Record<string, unknown>));
}

export async function getSentInvites(userId: string): Promise<BuddyInvite[]> {
  const q = query(
    invitesCollection(),
    where('fromUserId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toInvite(d.id, d.data() as Record<string, unknown>));
}

export async function getInvite(inviteId: string): Promise<BuddyInvite | null> {
  const snap = await getDoc(inviteDoc(inviteId));
  return snap.exists() ? toInvite(snap.id, snap.data() as Record<string, unknown>) : null;
}

export async function deleteInvite(inviteId: string): Promise<void> {
  await deleteDoc(inviteDoc(inviteId));
}
