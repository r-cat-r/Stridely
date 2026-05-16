/**
 * Conversation and chat Firestore service
 *
 * Handles conversations, messages, and read receipts.
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
  onSnapshot,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { timestampToMs } from '@/utils/firestore';
import type { Conversation, Message, ConversationType, MessageStatus } from '@/types';

const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_COLLECTION = 'messages';

function conversationDoc(id: string) {
  return doc(firestore(), CONVERSATIONS_COLLECTION, id);
}

function conversationsCollection() {
  return collection(firestore(), CONVERSATIONS_COLLECTION);
}

function messagesCollection() {
  return collection(firestore(), MESSAGES_COLLECTION);
}

function toConversation(id: string, data: Record<string, unknown>): Conversation {
  const raw = data as Record<string, unknown>;
  return {
    id,
    type: raw.type as ConversationType,
    participantIds: (raw.participantIds as string[]) ?? [],
    eventId: raw.eventId as string | undefined,
    lastMessage: raw.lastMessage as string | undefined,
    createdAt: timestampToMs(raw.createdAt),
    updatedAt: timestampToMs(raw.updatedAt),
  };
}

function toMessage(id: string, data: Record<string, unknown>): Message {
  const raw = data as Record<string, unknown>;
  return {
    id,
    conversationId: raw.conversationId as string,
    senderId: raw.senderId as string,
    text: raw.text as string,
    status: (raw.status as MessageStatus) ?? 'sent',
    readBy: (raw.readBy as string[]) ?? [],
    timestamp: timestampToMs(raw.timestamp),
  };
}

export async function createConversation(
  type: ConversationType,
  participantIds: string[],
  eventId?: string
): Promise<Conversation> {
  const ref = await addDoc(conversationsCollection(), {
    type,
    participantIds,
    eventId: eventId ?? null,
    lastMessage: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  return toConversation(ref.id, snap.data() as Record<string, unknown>);
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const snap = await getDoc(conversationDoc(id));
  return snap.exists() ? toConversation(snap.id, snap.data() as Record<string, unknown>) : null;
}

export async function findConversationByParticipants(
  userId: string,
  otherId: string,
  type: ConversationType = 'buddy'
): Promise<Conversation | null> {
  const q = query(
    conversationsCollection(),
    where('participantIds', 'array-contains', userId)
  );
  const snap = await getDocs(q);
  const conversations = snap.docs
    .map((d) => toConversation(d.id, d.data() as Record<string, unknown>))
    .filter((c) => c.type === type && c.participantIds.includes(otherId));
  return conversations.length > 0 ? conversations[0] : null;
}

export async function getConversationsForUser(userId: string): Promise<Conversation[]> {
  const q = query(
    conversationsCollection(),
    where('participantIds', 'array-contains', userId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => toConversation(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
): Unsubscribe {
  const q = query(
    conversationsCollection(),
    where('participantIds', 'array-contains', userId)
  );
  return onSnapshot(q, (snap) => {
    const conversations = snap.docs
      .map((d) => toConversation(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => b.updatedAt - a.updatedAt);
    callback(conversations);
  }, (error) => {
    console.error('[CONVERSATIONS] Subscription error:', error);
  });
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string
): Promise<Message> {
  const ref = await addDoc(messagesCollection(), {
    conversationId,
    senderId,
    text,
    status: 'sent',
    readBy: [senderId],
    timestamp: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  const data = snap.data() as Record<string, unknown>;
  const msg = toMessage(ref.id, data);
  await updateDoc(conversationDoc(conversationId), {
    updatedAt: serverTimestamp(),
    lastMessage: text,
  });
  return msg;
}

/**
 * Mark all unread messages in a conversation as read by the given user.
 * Uses single-field query to avoid needing a composite index for != filters.
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const q = query(
    messagesCollection(),
    where('conversationId', '==', conversationId)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(firestore());
  let count = 0;

  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    // Only mark messages from OTHER users as read
    if ((data.senderId as string) === userId) continue;
    const readBy = (data.readBy as string[]) ?? [];
    if (!readBy.includes(userId)) {
      batch.update(d.ref, {
        readBy: [...readBy, userId],
        status: 'read',
      });
      count++;
    }
  }

  if (count > 0) {
    await batch.commit();
  }
}

/**
 * Mark 'sent' messages from others as 'delivered' when the recipient's app
 * receives them. This powers the double grey tick (✓✓) indicator.
 */
export async function markMessagesAsDelivered(
  conversationId: string,
  userId: string
): Promise<void> {
  const q = query(
    messagesCollection(),
    where('conversationId', '==', conversationId)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(firestore());
  let count = 0;

  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    if ((data.senderId as string) === userId) continue;
    if ((data.status as string) === 'sent') {
      batch.update(d.ref, { status: 'delivered' });
      count++;
    }
  }

  if (count > 0) {
    await batch.commit();
  }
}

/**
 * Count unread messages in a conversation for a given user.
 * Uses single-field query to avoid needing a composite index for != filters.
 */
export async function getUnreadCount(
  conversationId: string,
  userId: string
): Promise<number> {
  const q = query(
    messagesCollection(),
    where('conversationId', '==', conversationId)
  );
  const snap = await getDocs(q);
  return snap.docs.filter((d) => {
    const data = d.data() as Record<string, unknown>;
    if ((data.senderId as string) === userId) return false;
    const readBy = (data.readBy as string[]) ?? [];
    return !readBy.includes(userId);
  }).length;
}

export async function getMessages(
  conversationId: string,
  limit = 50
): Promise<Message[]> {
  const q = query(
    messagesCollection(),
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'asc')
  );
  const snap = await getDocs(q);
  const messages = snap.docs
    .map((d) => toMessage(d.id, d.data() as Record<string, unknown>));
  // Return last N messages in chronological order
  return messages.slice(-limit);
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
): Unsubscribe {
  const q = query(
    messagesCollection(),
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map((d) =>
      toMessage(d.id, d.data() as Record<string, unknown>)
    );
    callback(messages);
  });
}
