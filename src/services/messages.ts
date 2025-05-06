
'use client';
// TODO: Firebase - Import necessary Firebase modules (e.g., getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp)
// import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
// import { db } from '@/lib/firebase'; // Assuming you have a firebase.ts setup file

import type { User } from '@/context/auth-context';

export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderRole: User['role'];
  senderAvatar?: string;
  content: string;
  timestamp: Date; // Or Firebase Timestamp
  type: 'text' | 'file' | 'poll' | 'event';
}

declare global {
  var mockGroupMessagesStore_assigno_messages: Map<string, Message[]> | undefined;
}


if (process.env.NODE_ENV !== 'production') {
  if (!globalThis.mockGroupMessagesStore_assigno_messages) {
    globalThis.mockGroupMessagesStore_assigno_messages = new Map<string, Message[]>();
    console.log("[Service:messages] Initialized global mockGroupMessagesStore_assigno_messages.");
  }
}

function getMockMessagesStore(): Map<string, Message[]> {
  if (process.env.NODE_ENV === 'production') {
    return new Map<string, Message[]>();
  }
  if (!globalThis.mockGroupMessagesStore_assigno_messages) {
    globalThis.mockGroupMessagesStore_assigno_messages = new Map<string, Message[]>();
  }
  return globalThis.mockGroupMessagesStore_assigno_messages;
}


// TODO: Firebase - Consider using onSnapshot for real-time updates in getGroupMessages
export async function getGroupMessages(groupId: string): Promise<Message[]> {
  console.log(`[Service:messages] Fetching messages for group ${groupId}`);
  
  await new Promise(resolve => setTimeout(resolve, 10)); 
  const store = getMockMessagesStore();
  const messages = store.get(groupId) || [];
  console.log(`[Service:messages] Found ${messages.length} messages for group ${groupId} (mock).`);
  return [...messages].sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export type NewMessageInput = Omit<Message, 'id' | 'timestamp' | 'groupId' | 'senderId' | 'senderName' | 'senderRole' | 'senderAvatar'>;

export async function addMessageToGroup(groupId: string, messageInput: NewMessageInput, sender: User): Promise<Message> {
  console.log(`[Service:messages] Adding message to group ${groupId} from sender ${sender.id} (${sender.name})`);
  
  const fullMessageData = {
    ...messageInput,
    groupId: groupId,
    timestamp: new Date(),
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    senderAvatar: sender.profilePictureUrl || `https://picsum.photos/40/40?random=${sender.id}`, 
  };
  
  await new Promise(resolve => setTimeout(resolve, 10));
  const store = getMockMessagesStore();
  const fullMessage: Message = {
    ...fullMessageData,
    id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  };
  const currentMessages = store.get(groupId) || [];
  const updatedMessages = [...currentMessages, fullMessage];
  store.set(groupId, updatedMessages);
  console.log(`[Service:messages] Message added by ${fullMessage.senderName} to group ${groupId} (mock). Content: "${fullMessage.content}". Total messages: ${updatedMessages.length}`);
  return { ...fullMessage };
}
