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
  var groupMessagesStore_assigno: Map<string, Message[]>;
}

let groupMessagesStore: Map<string, Message[]>;

if (process.env.NODE_ENV === 'production') {
  groupMessagesStore = new Map<string, Message[]>();
  // TODO: Firebase - In production, this Map would not be used. Data comes from Firestore.
} else {
  if (!(globalThis as any).groupMessagesStore_assigno) {
    (globalThis as any).groupMessagesStore_assigno = new Map<string, Message[]>();
    console.log("[Service:messages] Initialized global groupMessagesStore_assigno.");
  }
  groupMessagesStore = (globalThis as any).groupMessagesStore_assigno;
}

// TODO: Firebase - Consider using onSnapshot for real-time updates in getGroupMessages
export async function getGroupMessages(groupId: string): Promise<Message[]> {
  console.log(`[Service:messages] Fetching messages for group ${groupId}`);
  // TODO: Firebase - Replace with Firestore query
  // const firestore = getFirestore();
  // const messagesCol = collection(firestore, 'groups', groupId, 'messages');
  // const q = query(messagesCol, orderBy('timestamp', 'asc'));
  // For real-time, you'd use onSnapshot here and manage unsubscription.
  // For a one-time fetch:
  // const snapshot = await getDocs(q);
  // const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp.toDate() } as Message));
  // console.log(`[Service:messages] Found ${messages.length} messages for group ${groupId} from Firestore.`);
  // return messages;

  // --- Mock implementation ---
  await new Promise(resolve => setTimeout(resolve, 10)); // Reduced delay
  const messages = groupMessagesStore.get(groupId) || [];
  console.log(`[Service:messages] Found ${messages.length} messages for group ${groupId} (mock).`);
  return [...messages].sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime()); 
  // --- End mock implementation ---
}

export type NewMessageInput = Omit<Message, 'id' | 'timestamp' | 'groupId' | 'senderId' | 'senderName' | 'senderRole' | 'senderAvatar'>;

export async function addMessageToGroup(groupId: string, messageInput: NewMessageInput, sender: User): Promise<Message> {
  console.log(`[Service:messages] Adding message to group ${groupId} from sender ${sender.id} (${sender.name})`);
  // TODO: Firebase - Replace with Firestore addDoc
  // const firestore = getFirestore();
  // const messagesCol = collection(firestore, 'groups', groupId, 'messages');
  const fullMessageData = {
    ...messageInput,
    groupId: groupId,
    timestamp: new Date(), // Firebase: serverTimestamp()
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    senderAvatar: sender.profilePictureUrl || '', // Ensure it's not undefined
  };
  // const docRef = await addDoc(messagesCol, fullMessageData);
  // const sentMessage: Message = { id: docRef.id, ...fullMessageData };
  // console.log(`[Service:messages] Message added by ${sentMessage.senderName} to group ${groupId} in Firestore. Content: "${sentMessage.content}".`);
  // return sentMessage;
  
  // --- Mock implementation ---
  await new Promise(resolve => setTimeout(resolve, 10)); // Reduced delay
  const fullMessage: Message = {
    ...fullMessageData,
    id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  };
  const currentMessages = groupMessagesStore.get(groupId) || [];
  const updatedMessages = [...currentMessages, fullMessage];
  groupMessagesStore.set(groupId, updatedMessages);
  console.log(`[Service:messages] Message added by ${fullMessage.senderName} to group ${groupId} (mock). Content: "${fullMessage.content}". Total messages: ${updatedMessages.length}`);
  return { ...fullMessage }; 
  // --- End mock implementation ---
}


