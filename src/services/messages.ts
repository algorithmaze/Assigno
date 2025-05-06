
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

// Type for messages stored in localStorage (with timestamp as string)
type StoredMessage = Omit<Message, 'timestamp'> & { timestamp: string };


const MESSAGES_STORAGE_KEY = 'assigno_mock_messages_data_v2'; // Added v2 to avoid conflict with old global store if any

function getMockMessagesData(): Map<string, Message[]> {
  if (typeof window === 'undefined') {
    return new Map<string, Message[]>(); // No localStorage on server-side
  }
  try {
    const storedData = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (storedData) {
      const parsedObject = JSON.parse(storedData) as Record<string, StoredMessage[]>;
      const messagesMap = new Map<string, Message[]>();
      for (const groupId in parsedObject) {
        if (Object.prototype.hasOwnProperty.call(parsedObject, groupId)) {
          messagesMap.set(
            groupId,
            parsedObject[groupId].map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp), // Deserialize date string
            }))
          );
        }
      }
      return messagesMap;
    }
  } catch (error) {
    console.error("[Service:messages] Error reading messages from localStorage:", error);
  }
  return new Map<string, Message[]>();
}

function updateMockMessagesData(newData: Map<string, Message[]>): void {
  if (typeof window === 'undefined') {
    return; // No localStorage on server-side
  }
  try {
    const objectToStore: Record<string, StoredMessage[]> = {};
    newData.forEach((messages, groupId) => {
      objectToStore[groupId] = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(), // Serialize Date object
      }));
    });
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(objectToStore));
  } catch (error) {
    console.error("[Service:messages] Error writing messages to localStorage:", error);
  }
}


// TODO: Firebase - Consider using onSnapshot for real-time updates in getGroupMessages
export async function getGroupMessages(groupId: string): Promise<Message[]> {
  console.log(`[Service:messages] Fetching messages for group ${groupId}`);
  
  await new Promise(resolve => setTimeout(resolve, 10)); 
  const store = getMockMessagesData(); // Use localStorage based function
  const messages = store.get(groupId) || [];
  console.log(`[Service:messages] Found ${messages.length} messages for group ${groupId} (localStorage mock).`);
  return [...messages].sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export type NewMessageInput = Omit<Message, 'id' | 'timestamp' | 'groupId' | 'senderId' | 'senderName' | 'senderRole' | 'senderAvatar'>;

export async function addMessageToGroup(groupId: string, messageInput: NewMessageInput, sender: User): Promise<Message> {
  console.log(`[Service:messages] Adding message to group ${groupId} from sender ${sender.id} (${sender.name})`);
  
  const fullMessageData = {
    ...messageInput,
    groupId: groupId,
    timestamp: new Date(), // Current timestamp as Date object
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    senderAvatar: sender.profilePictureUrl || `https://picsum.photos/40/40?random=${sender.id.replace('-','')}`, 
  };
  
  await new Promise(resolve => setTimeout(resolve, 10));
  const store = getMockMessagesData(); // Use localStorage based function

  const fullMessage: Message = {
    ...fullMessageData,
    id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  };

  const currentMessages = store.get(groupId) || [];
  const updatedMessages = [...currentMessages, fullMessage];
  store.set(groupId, updatedMessages);

  updateMockMessagesData(store); // Save updated store to localStorage

  console.log(`[Service:messages] Message added by ${fullMessage.senderName} to group ${groupId} (localStorage mock). Content: "${fullMessage.content}". Total messages: ${updatedMessages.length}`);
  return { ...fullMessage };
}
