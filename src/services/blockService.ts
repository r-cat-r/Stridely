/**
 * Block user Firestore service
 *
 * Manages the blockedUsers collection. Each doc represents a block relationship.
 * Doc ID format: `${blockerId}_${blockedId}` for easy lookup.
 */

import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from './firebase';

const BLOCKED_COLLECTION = 'blockedUsers';

function blockDocId(blockerId: string, blockedId: string): string {
  return `${blockerId}_${blockedId}`;
}

function blockDoc(blockerId: string, blockedId: string) {
  return doc(firestore(), BLOCKED_COLLECTION, blockDocId(blockerId, blockedId));
}

/**
 * Block a user. Creates a record in the blockedUsers collection.
 */
export async function blockUser(
  blockerId: string,
  blockedId: string
): Promise<void> {
  await setDoc(blockDoc(blockerId, blockedId), {
    blockerId,
    blockedId,
    createdAt: serverTimestamp(),
  });
}

/**
 * Unblock a user. Removes the block record.
 */
export async function unblockUser(
  blockerId: string,
  blockedId: string
): Promise<void> {
  await deleteDoc(blockDoc(blockerId, blockedId));
}

/**
 * Get all user IDs blocked by the given user.
 */
export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const q = query(
    collection(firestore(), BLOCKED_COLLECTION),
    where('blockerId', '==', userId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => (d.data() as { blockedId: string }).blockedId);
}

/**
 * Check if a user is blocked by the current user.
 */
export async function isUserBlocked(
  blockerId: string,
  blockedId: string
): Promise<boolean> {
  const ids = await getBlockedUserIds(blockerId);
  return ids.includes(blockedId);
}
