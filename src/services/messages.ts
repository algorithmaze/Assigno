
'use client'; // This service is intended to be used by client components

import type { User } from '@/context/auth-context';

export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderRole: User['role'];
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'poll' | 'event';
}

// Ensure 'global' is typed for this property for HMR in dev
declare global {
  // eslint-disable-next-line no-var
  var groupMessagesStore_assigno: Map<string, Message[]>;
}

let groupMessagesStore: Map<string, Message[]>;

if (process.env.NODE_ENV === 'production') {
  groupMessagesStore = new Map<string, Message[]>();
} else {
  if (!global.groupMessagesStore_assigno) {
    global.groupMessagesStore_assigno = new Map<string, Message[]>();
    console.log("[Service:messages] Initialized global groupMessagesStore_assigno.");
  }
  groupMessagesStore = global.groupMessagesStore_assigno;
}

export async function getGroupMessages(groupId: string): Promise<Message[]> {
  console.log(`[Service:messages] Fetching messages for group ${groupId}`);
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
  const messages = groupMessagesStore.get(groupId) || [];
  console.log(`[Service:messages] Found ${messages.length} messages for group ${groupId}.`);
  return [...messages].sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime()); // Return a sorted copy
}

export type NewMessageInput = Omit<Message, 'id' | 'timestamp' | 'groupId' | 'senderId' | 'senderName' | 'senderRole' | 'senderAvatar'>;

export async function addMessageToGroup(groupId: string, messageInput: NewMessageInput, sender: User): Promise<Message> {
  console.log(`[Service:messages] Adding message to group ${groupId} from sender ${sender.id} (${sender.name})`);
  await new Promise(resolve => setTimeout(resolve, 50));

  const fullMessage: Message = {
    ...messageInput,
    id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    groupId: groupId,
    timestamp: new Date(),
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    senderAvatar: sender.profilePictureUrl,
  };

  const currentMessages = groupMessagesStore.get(groupId) || [];
  const updatedMessages = [...currentMessages, fullMessage];
  groupMessagesStore.set(groupId, updatedMessages);

  console.log(`[Service:messages] Message added by ${fullMessage.senderName} to group ${groupId}. Content: "${fullMessage.content}". Total messages: ${updatedMessages.length}`);
  return { ...fullMessage }; // Return a copy
}
