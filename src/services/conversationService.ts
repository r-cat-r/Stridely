/**
 * Conversation and chat Firestore service
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
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { timestampToMs } from '@/utils/firestore';
import type { Conversation, Message, ConversationType } from '@/types';

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

export async function getConversationsForUser(userId: string): Promise<Conversation[]> {
  const q = query(
    conversationsCollection(),
    where('participantIds', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toConversation(d.id, d.data() as Record<string, unknown>));
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
    timestamp: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  const data = snap.data() as Record<string, unknown>;
  const msg = toMessage(ref.id, data);
  await updateDoc(conversationDoc(conversationId), {
    updatedAt: serverTimestamp(),
  });
  return msg;
}

export async function getMessages(
  conversationId: string,
  limit = 50
): Promise<Message[]> {
  const q = query(
    messagesCollection(),
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'desc'),
    // Firestore limit
  );
  const snap = await getDocs(q);
  const messages = snap.docs
    .map((d) => toMessage(d.id, d.data() as Record<string, unknown>))
    .slice(0, limit);
  return messages.reverse();
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
