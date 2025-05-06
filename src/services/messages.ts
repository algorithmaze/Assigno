
'use client';
// TODO: Firebase - Import necessary Firebase modules (e.g., getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp)
// import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
// import { db } from '@/lib/firebase'; // Assuming you have a firebase.ts setup file

import type { User } from '@/context/auth-context';

export interface PollOption {
  id: string;
  text: string;
}

export interface PollData {
  question: string;
  options: PollOption[];
  // Results: key is option id, value is count of votes
  results?: Record<string, number>; 
  // Voters: key is userId, value is optionId voted for
  voters?: Record<string, string>; 
}

export interface EventData {
  title: string;
  description?: string;
  dateTime: string; // ISO string
  location?: string;
}

export interface FileData {
  name: string;
  type?: string; // MIME type
  size?: number; // in bytes
  url?: string; // download URL (mock: data URI or placeholder)
}


export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderRole: User['role'];
  senderAvatar?: string;
  content: string; // For text messages, or title/question for poll/event, or filename for file
  timestamp: Date; // Or Firebase Timestamp
  type: 'text' | 'file' | 'poll' | 'event';
  pollData?: PollData;
  eventData?: EventData;
  fileData?: FileData;
}

// Type for messages stored in localStorage (with timestamp as string)
type StoredMessage = Omit<Message, 'timestamp' | 'pollData' | 'eventData' | 'fileData'> & { 
  timestamp: string;
  pollData?: Omit<PollData, 'results' | 'voters'> & { results?: Record<string, number>, voters?: Record<string, string> }; // Results and voters are optional
  eventData?: EventData & { dateTime: string }; // Ensure dateTime is string
  fileData?: FileData;
};


const MESSAGES_STORAGE_KEY = 'assigno_mock_messages_data_v3'; // Incremented version for new structure

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
              // Ensure pollData results and voters are initialized if not present
              pollData: msg.pollData ? {
                ...msg.pollData,
                results: msg.pollData.results || {},
                voters: msg.pollData.voters || {}
              } : undefined,
              eventData: msg.eventData ? {
                ...msg.eventData,
                dateTime: msg.eventData.dateTime // Already string
              } : undefined,
              fileData: msg.fileData
            } as Message)) // Cast to Message to satisfy type, assuming structure is correct
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
      objectToStore[groupId] = messages.map(msg => {
        const storedMsg: StoredMessage = {
          id: msg.id,
          groupId: msg.groupId,
          senderId: msg.senderId,
          senderName: msg.senderName,
          senderRole: msg.senderRole,
          senderAvatar: msg.senderAvatar,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(), // Serialize Date object
          type: msg.type,
        };
        if (msg.pollData) {
          storedMsg.pollData = { 
            ...msg.pollData, 
            results: msg.pollData.results || {}, 
            voters: msg.pollData.voters || {}
          };
        }
        if (msg.eventData) {
          storedMsg.eventData = { ...msg.eventData, dateTime: msg.eventData.dateTime };
        }
        if (msg.fileData) {
          storedMsg.fileData = msg.fileData;
        }
        return storedMsg;
      });
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

export interface NewMessageBaseInput {
  content: string; // For text, poll question, event title, file name
  type: 'text' | 'file' | 'poll' | 'event';
}
export interface NewTextMessageInput extends NewMessageBaseInput {
  type: 'text';
}
export interface NewFileMessageInput extends NewMessageBaseInput {
  type: 'file';
  fileData: FileData;
}
export interface NewPollMessageInput extends NewMessageBaseInput {
  type: 'poll';
  pollData: Omit<PollData, 'results' | 'voters'>; // Results and voters initialized by service
}
export interface NewEventMessageInput extends NewMessageBaseInput {
  type: 'event';
  eventData: EventData;
}

export type NewMessageInput = 
  | NewTextMessageInput 
  | NewFileMessageInput 
  | NewPollMessageInput 
  | NewEventMessageInput;


export async function addMessageToGroup(groupId: string, messageInput: NewMessageInput, sender: User): Promise<Message> {
  console.log(`[Service:messages] Adding message to group ${groupId} from sender ${sender.id} (${sender.name}) of type ${messageInput.type}`);
  
  const baseMessageData = {
    groupId: groupId,
    timestamp: new Date(), // Current timestamp as Date object
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    senderAvatar: sender.profilePictureUrl || `https://picsum.photos/40/40?random=${sender.id.replace('-','')}`, 
    content: messageInput.content, // Generic content field
    type: messageInput.type,
  };
  
  let specificData = {};
  if (messageInput.type === 'poll') {
    specificData = { pollData: { ...messageInput.pollData, results: {}, voters: {} } };
  } else if (messageInput.type === 'event') {
    specificData = { eventData: messageInput.eventData };
  } else if (messageInput.type === 'file') {
    specificData = { fileData: messageInput.fileData };
  }

  const fullMessage: Message = {
    ...baseMessageData,
    ...specificData,
    id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  } as Message; // Assert type after merging
  
  await new Promise(resolve => setTimeout(resolve, 10));
  const store = getMockMessagesData(); // Use localStorage based function

  const currentMessages = store.get(groupId) || [];
  const updatedMessages = [...currentMessages, fullMessage];
  store.set(groupId, updatedMessages);

  updateMockMessagesData(store); // Save updated store to localStorage

  console.log(`[Service:messages] Message added by ${fullMessage.senderName} to group ${groupId} (localStorage mock). Content: "${fullMessage.content}". Total messages: ${updatedMessages.length}`);
  return { ...fullMessage };
}

export async function voteOnPoll(groupId: string, messageId: string, optionId: string, userId: string): Promise<Message | null> {
  console.log(`[Service:messages] User ${userId} voting for option ${optionId} on poll ${messageId} in group ${groupId}`);
  
  const store = getMockMessagesData();
  const groupMessages = store.get(groupId);
  if (!groupMessages) return null;

  const messageIndex = groupMessages.findIndex(msg => msg.id === messageId && msg.type === 'poll');
  if (messageIndex === -1) return null;

  const pollMessage = { ...groupMessages[messageIndex] }; // Clone message
  if (!pollMessage.pollData) return null;

  pollMessage.pollData = { ...pollMessage.pollData }; // Clone pollData
  pollMessage.pollData.results = { ...(pollMessage.pollData.results || {}) };
  pollMessage.pollData.voters = { ...(pollMessage.pollData.voters || {}) };


  // If user has already voted, remove their previous vote
  const previousVoteOptionId = pollMessage.pollData.voters[userId];
  if (previousVoteOptionId) {
    pollMessage.pollData.results[previousVoteOptionId] = (pollMessage.pollData.results[previousVoteOptionId] || 1) -1;
    if(pollMessage.pollData.results[previousVoteOptionId] < 0) pollMessage.pollData.results[previousVoteOptionId] = 0;
  }
  
  // Add new vote
  pollMessage.pollData.results[optionId] = (pollMessage.pollData.results[optionId] || 0) + 1;
  pollMessage.pollData.voters[userId] = optionId;
  
  groupMessages[messageIndex] = pollMessage;
  store.set(groupId, groupMessages);
  updateMockMessagesData(store);

  console.log(`[Service:messages] Poll ${messageId} updated with vote from ${userId}. New results:`, pollMessage.pollData.results);
  return pollMessage;
}
