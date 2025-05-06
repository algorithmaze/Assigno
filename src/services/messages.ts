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
  pollType: 'mcq' | 'shortAnswer';
  options?: PollOption[]; // Optional for short answer
  studentAnswersHidden: boolean; // If true, students don't see MCQ results until published, or other students' short answers
  resultsPublished: boolean; // True if teacher published MCQ results or short answer summary
  correctOptionId?: string; // For MCQ, the ID of the correct option
  // For MCQ: results map optionId to vote count
  // For Short Answer: results map userId to their answer string (teachers view this)
  results?: Record<string, number>; 
  // For MCQ: voters map userId to optionId
  // For Short Answer: voters map userId to their answer string (this is what students submit)
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
  pollData?: PollData; 
  eventData?: EventData & { dateTime: string }; 
  fileData?: FileData;
};


// Use a global variable for mock data in non-production environments
declare global {
  var mockMessagesData_assigno_messages: Map<string, Message[]> | undefined;
  var mockMessagesInitialized_assigno_messages: boolean | undefined;
}

const MESSAGES_STORAGE_KEY = 'assigno_mock_messages_data_v6'; // Incremented version

// Initialize from localStorage or create new if not present
function initializeGlobalMessagesStore(): Map<string, Message[]> {
  if (typeof window === 'undefined') {
    return new Map<string, Message[]>();
  }

  if (globalThis.mockMessagesData_assigno_messages && globalThis.mockMessagesInitialized_assigno_messages) {
    return globalThis.mockMessagesData_assigno_messages;
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
              timestamp: new Date(msg.timestamp), 
              pollData: msg.pollData ? {
                ...msg.pollData,
                options: msg.pollData.options || (msg.pollData.pollType === 'mcq' ? [] : undefined),
                results: msg.pollData.results || (msg.pollData.pollType === 'mcq' ? {} : undefined),
                voters: msg.pollData.voters || {},
                correctOptionId: msg.pollData.correctOptionId, 
              } : undefined,
              eventData: msg.eventData ? {
                ...msg.eventData,
                dateTime: msg.eventData.dateTime 
              } : undefined,
              fileData: msg.fileData
            } as Message)) 
          );
        }
      }
      globalThis.mockMessagesData_assigno_messages = messagesMap;
      globalThis.mockMessagesInitialized_assigno_messages = true;
      console.log("[Service:messages] Initialized global messages store from localStorage.");
      return messagesMap;
    }
  } catch (error) {
    console.error("[Service:messages] Error reading messages from localStorage during global init:", error);
  }

  const newStore = new Map<string, Message[]>();
  globalThis.mockMessagesData_assigno_messages = newStore;
  globalThis.mockMessagesInitialized_assigno_messages = true;
  console.log("[Service:messages] Initialized new empty global messages store.");
  return newStore;
}


function getMockMessagesData(): Map<string, Message[]> {
  if (typeof window === 'undefined') {
    return new Map<string, Message[]>(); // Server-side, return empty
  }
  if (!globalThis.mockMessagesData_assigno_messages || !globalThis.mockMessagesInitialized_assigno_messages) {
    return initializeGlobalMessagesStore();
  }
  return globalThis.mockMessagesData_assigno_messages;
}

function updateMockMessagesData(newData: Map<string, Message[]>): void {
  if (typeof window === 'undefined') {
    return; 
  }
  globalThis.mockMessagesData_assigno_messages = newData; // Update global store
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
          timestamp: msg.timestamp.toISOString(), 
          type: msg.type,
        };
        if (msg.pollData) {
          storedMsg.pollData = { ...msg.pollData };
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

// Initialize on load for client-side
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  initializeGlobalMessagesStore();
}


export async function getGroupMessages(groupId: string): Promise<Message[]> {
  console.log(`[Service:messages] Fetching messages for group ${groupId}`);
  
  await new Promise(resolve => setTimeout(resolve, 10)); 
  const store = getMockMessagesData(); 
  const messages = store.get(groupId) || [];
  console.log(`[Service:messages] Found ${messages.length} messages for group ${groupId} (global/localStorage mock).`);
  return [...messages].sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export interface NewMessageBaseInput {
  content: string; 
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
  pollData: Omit<PollData, 'results' | 'voters' | 'resultsPublished' | 'correctOptionId'>; 
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
    timestamp: new Date(), 
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    senderAvatar: sender.profilePictureUrl || `https://picsum.photos/40/40?random=${sender.id.replace('-','')}`, 
    content: messageInput.content, 
    type: messageInput.type,
  };
  
  let specificData = {};
  if (messageInput.type === 'poll') {
    specificData = { 
        pollData: { 
            ...messageInput.pollData, 
            results: messageInput.pollData.pollType === 'mcq' ? {} : undefined, 
            voters: {}, 
            resultsPublished: false,
            correctOptionId: undefined, 
        } 
    };
  } else if (messageInput.type === 'event') {
    specificData = { eventData: messageInput.eventData };
  } else if (messageInput.type === 'file') {
    specificData = { fileData: messageInput.fileData };
  }

  const fullMessage: Message = {
    ...baseMessageData,
    ...specificData,
    id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  } as Message; 
  
  await new Promise(resolve => setTimeout(resolve, 10));
  const store = getMockMessagesData();

  const currentMessages = store.get(groupId) || [];
  const updatedMessages = [...currentMessages, fullMessage];
  store.set(groupId, updatedMessages);

  updateMockMessagesData(store); 

  console.log(`[Service:messages] Message added by ${fullMessage.senderName} to group ${groupId} (global/localStorage mock). Content: "${fullMessage.content}". Total messages: ${updatedMessages.length}`);
  return { ...fullMessage };
}

export async function voteOnPoll(groupId: string, messageId: string, submission: string, userId: string): Promise<Message | null> {
  console.log(`[Service:messages] User ${userId} submitting for poll ${messageId} in group ${groupId}. Submission: ${submission}`);
  
  const store = getMockMessagesData();
  const groupMessages = store.get(groupId);
  if (!groupMessages) return null;

  const messageIndex = groupMessages.findIndex(msg => msg.id === messageId && msg.type === 'poll');
  if (messageIndex === -1) return null;

  const pollMessage = { ...groupMessages[messageIndex] }; 
  if (!pollMessage.pollData) return null;

  pollMessage.pollData = { ...pollMessage.pollData }; 
  pollMessage.pollData.voters = { ...(pollMessage.pollData.voters || {}) };
  
  if (pollMessage.pollData.pollType === 'mcq') {
      pollMessage.pollData.results = { ...(pollMessage.pollData.results || {}) };
      const optionId = submission; 
      const previousVoteOptionId = pollMessage.pollData.voters[userId];
      if (previousVoteOptionId && pollMessage.pollData.results[previousVoteOptionId]) {
        pollMessage.pollData.results[previousVoteOptionId] = Math.max(0, (pollMessage.pollData.results[previousVoteOptionId] || 1) - 1);
      }
      pollMessage.pollData.results[optionId] = (pollMessage.pollData.results[optionId] || 0) + 1;
      pollMessage.pollData.voters[userId] = optionId;
      console.log(`[Service:messages] MCQ Poll ${messageId} updated. New results:`, pollMessage.pollData.results);
  } else if (pollMessage.pollData.pollType === 'shortAnswer') {
      pollMessage.pollData.voters[userId] = submission; 
      console.log(`[Service:messages] Short Answer Poll ${messageId} submission from ${userId} recorded.`);
  }
  
  const newGroupMessages = [...groupMessages]; // Create a new array for the specific group
  newGroupMessages[messageIndex] = pollMessage;
  const newStore = new Map(store); // Create a new map for the overall store
  newStore.set(groupId, newGroupMessages);
  updateMockMessagesData(newStore);

  return pollMessage;
}

export async function publishPollResults(groupId: string, messageId: string, publisherId: string, correctOptionId?: string): Promise<Message | null> {
  console.log(`[Service:messages] User ${publisherId} publishing results for poll ${messageId} in group ${groupId}. Correct option ID (if any): ${correctOptionId}`);
  const store = getMockMessagesData();
  const groupMessages = store.get(groupId);
  if (!groupMessages) return null;

  const messageIndex = groupMessages.findIndex(msg => msg.id === messageId && msg.type === 'poll');
  if (messageIndex === -1) return null;

  const pollMessage = { ...groupMessages[messageIndex] };
  if (!pollMessage.pollData) return null;
  
  pollMessage.pollData = { 
    ...pollMessage.pollData, 
    resultsPublished: true,
    ...(pollMessage.pollData.pollType === 'mcq' && correctOptionId && { correctOptionId: correctOptionId })
  };
  
  const newGroupMessages = [...groupMessages];
  newGroupMessages[messageIndex] = pollMessage;
  const newStore = new Map(store);
  newStore.set(groupId, newGroupMessages);
  updateMockMessagesData(newStore);

  console.log(`[Service:messages] Poll ${messageId} results published. Correct Option: ${pollMessage.pollData.correctOptionId}`);
  return pollMessage;
}
