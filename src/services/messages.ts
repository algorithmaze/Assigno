
'use client';
// TODO: Firebase - Import necessary Firebase modules (e.g., getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp)
// import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
// import { db } from '@/lib/firebase'; // Assuming you have a firebase.ts setup file

import type { User } from '@/context/auth-context';

export interface PollOption {
  id: string;
  text: string;
}

export interface PollQuestion {
  id: string;
  questionText: string;
  pollType: 'mcq' | 'shortAnswer';
  options?: PollOption[]; // For MCQ
  correctOptionId?: string; // Set by teacher upon publishing MCQ
}

export interface PollData {
  title: string; // Overall title for the Google Form-like poll
  questions: PollQuestion[];
  studentAnswersHidden: boolean; // Global setting for the poll
  resultsPublished: boolean; // Global setting for the poll

  // Key: questionId, Value: { [optionId]: count } for MCQ
  // Key: questionId, Value: { [userId]: answerText } for Short Answer (teacher view)
  results?: Record<string, Record<string, number | string>>;

  // Key: questionId, Value: { [userId]: optionIdOrAnswerText }
  voters?: Record<string, Record<string, string>>;
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
  content: string; // For text messages, or main title for poll/event, or filename for file
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

const MESSAGES_STORAGE_KEY = 'assigno_mock_messages_data_v8'; // Incremented version for new PollData

// Initialize from localStorage or create new if not present
function initializeGlobalMessagesStore(): Map<string, Message[]> {
  if (typeof window === 'undefined') {
    // Server-side: initialize with empty or default if not already done by ensureMockDataInitialized
    globalThis.mockMessagesData_assigno_messages = new Map<string, Message[]>();
    globalThis.mockMessagesInitialized_assigno_messages = true;
    console.log("[Service:messages] Server-side: Initialized empty messages store.");
    return globalThis.mockMessagesData_assigno_messages;
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
            parsedObject[groupId].map(msg => {
              let pollDataToRestore: PollData | undefined = undefined;
              if (msg.pollData) {
                pollDataToRestore = {
                  title: msg.pollData.title,
                  questions: msg.pollData.questions || [],
                  studentAnswersHidden: typeof msg.pollData.studentAnswersHidden === 'boolean' ? msg.pollData.studentAnswersHidden : true, // Default true
                  resultsPublished: typeof msg.pollData.resultsPublished === 'boolean' ? msg.pollData.resultsPublished : false, // Default false
                  results: msg.pollData.results || {},
                  voters: msg.pollData.voters || {},
                };

                // Handle potential old structure (single question poll)
                 if (msg.pollData.questions && msg.pollData.questions.length === 0 && (msg.pollData as any).question) {
                   const oldPollData = msg.pollData as any;
                   pollDataToRestore.questions = [{
                       id: `q-${Date.now()}`, // Ensure unique ID for migrated question
                       questionText: oldPollData.question,
                       pollType: oldPollData.pollType || 'mcq', // Default to mcq if not set
                       options: oldPollData.options,
                       correctOptionId: oldPollData.correctOptionId,
                   }];
                   // Migrate results and voters if they are not per-questionId
                   if(oldPollData.results && Object.keys(oldPollData.results).length > 0 && !pollDataToRestore.results?.[pollDataToRestore.questions[0].id]) {
                        pollDataToRestore.results = { [pollDataToRestore.questions[0].id]: oldPollData.results };
                   }
                   if(oldPollData.voters && Object.keys(oldPollData.voters).length > 0 && !pollDataToRestore.voters?.[pollDataToRestore.questions[0].id]) {
                        pollDataToRestore.voters = { [pollDataToRestore.questions[0].id]: oldPollData.voters };
                   }
                }
              }

              return {
              ...msg,
              timestamp: new Date(msg.timestamp), 
              pollData: pollDataToRestore,
              eventData: msg.eventData ? {
                ...msg.eventData,
                dateTime: msg.eventData.dateTime 
              } : undefined,
              fileData: msg.fileData
            } as Message}) 
          );
        }
      }
      globalThis.mockMessagesData_assigno_messages = messagesMap;
      globalThis.mockMessagesInitialized_assigno_messages = true;
      console.log("[Service:messages] Initialized global messages store from localStorage. Groups with messages:", messagesMap.size);
      return messagesMap;
    }
  } catch (error) {
    console.error("[Service:messages] Error reading messages from localStorage during global init:", error);
    localStorage.removeItem(MESSAGES_STORAGE_KEY); // Clear corrupted data
  }

  const newStore = new Map<string, Message[]>();
  globalThis.mockMessagesData_assigno_messages = newStore;
  globalThis.mockMessagesInitialized_assigno_messages = true;
  localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify({})); // Save empty store correctly
  console.log("[Service:messages] Initialized new empty global messages store and saved to localStorage.");
  return newStore;
}


function getMockMessagesData(): Map<string, Message[]> {
  if (!globalThis.mockMessagesData_assigno_messages || !globalThis.mockMessagesInitialized_assigno_messages) {
    console.warn("[Service:messages] getMockMessagesData: Store not initialized. Attempting recovery by initializing.");
    return initializeGlobalMessagesStore();
  }
  return globalThis.mockMessagesData_assigno_messages;
}

function updateMockMessagesData(newData: Map<string, Message[]>): void {
  globalThis.mockMessagesData_assigno_messages = newData;
  globalThis.mockMessagesInitialized_assigno_messages = true;
  if (typeof window !== 'undefined') {
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
      console.log("[Service:messages] Updated localStorage with messages for", newData.size, "groups.");
    } catch (error) {
      console.error("[Service:messages] Error writing messages to localStorage:", error);
    }
  }
}

export async function ensureMockDataInitialized() {
    if (typeof window !== 'undefined' && !globalThis.mockMessagesInitialized_assigno_messages) {
        initializeGlobalMessagesStore();
    } else if (typeof window === 'undefined' && !globalThis.mockMessagesInitialized_assigno_messages) {
        initializeGlobalMessagesStore();
    }
}

// Initialize on load for client-side
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  ensureMockDataInitialized();
}


export async function getGroupMessages(groupId: string): Promise<Message[]> {
  await ensureMockDataInitialized();
  console.log(`[Service:messages] Fetching messages for group ${groupId}`);
  
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
  pollData: Omit<PollData, 'results' | 'voters' | 'resultsPublished'>; 
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
  await ensureMockDataInitialized();
  console.log(`[Service:messages] Adding message to group ${groupId} from sender ${sender.id} (${sender.name}) of type ${messageInput.type}`);
  
  const baseMessageData = {
    groupId: groupId,
    timestamp: new Date(), 
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    senderAvatar: sender.profilePictureUrl, 
    content: messageInput.content, 
    type: messageInput.type,
  };
  
  let specificData = {};
  if (messageInput.type === 'poll') {
    const questionsWithDefaults = messageInput.pollData.questions.map(q => ({
      ...q,
      options: q.pollType === 'mcq' ? (q.options || []) : undefined,
      correctOptionId: undefined, 
    }));
    specificData = { 
        pollData: { 
            ...messageInput.pollData, 
            questions: questionsWithDefaults,
            results: {}, 
            voters: {},  
            resultsPublished: false,
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
  
  const store = getMockMessagesData();
  const currentMessages = store.get(groupId) || [];
  const updatedMessages = [...currentMessages, fullMessage];
  
  const newStore = new Map(store); 
  newStore.set(groupId, updatedMessages);
  updateMockMessagesData(newStore); 

  console.log(`[Service:messages] Message added by ${fullMessage.senderName} to group ${groupId}. Content: "${fullMessage.content}". Total messages: ${updatedMessages.length}`);
  return { ...fullMessage };
}

export async function voteOnPoll(groupId: string, messageId: string, questionId: string, submission: string, userId: string): Promise<Message | null> {
  await ensureMockDataInitialized();
  console.log(`[Service:messages] User ${userId} submitting for question ${questionId} in poll ${messageId} (group ${groupId}). Submission: ${submission}`);
  
  const store = getMockMessagesData();
  const groupMessages = store.get(groupId);
  if (!groupMessages) return null;

  const messageIndex = groupMessages.findIndex(msg => msg.id === messageId && msg.type === 'poll');
  if (messageIndex === -1) return null;

  const pollMessage = { ...groupMessages[messageIndex] }; 
  if (!pollMessage.pollData || !pollMessage.pollData.questions.find(q => q.id === questionId)) return null;

  pollMessage.pollData = { ...pollMessage.pollData }; 
  pollMessage.pollData.voters = { ...(pollMessage.pollData.voters || {}) };
  pollMessage.pollData.results = { ...(pollMessage.pollData.results || {}) };

  if (!pollMessage.pollData.voters[questionId]) {
    pollMessage.pollData.voters[questionId] = {};
  }
  if (!pollMessage.pollData.results[questionId]) {
    pollMessage.pollData.results[questionId] = {};
  }

  const question = pollMessage.pollData.questions.find(q => q.id === questionId);
  if (!question) return null; 

  if (question.pollType === 'mcq') {
      const optionId = submission; 
      const questionResults = pollMessage.pollData.results[questionId] as Record<string, number> || {};
      const questionVoters = pollMessage.pollData.voters[questionId] as Record<string, string> || {};

      const previousVoteOptionId = questionVoters[userId];
      if (previousVoteOptionId && typeof questionResults[previousVoteOptionId] === 'number') {
        questionResults[previousVoteOptionId] = Math.max(0, (questionResults[previousVoteOptionId] || 1) - 1);
      }
      questionResults[optionId] = (questionResults[optionId] || 0) + 1;
      questionVoters[userId] = optionId;

      pollMessage.pollData.results[questionId] = questionResults;
      pollMessage.pollData.voters[questionId] = questionVoters;
      console.log(`[Service:messages] MCQ Poll ${messageId}, Q ${questionId} updated. New results:`, questionResults);
  } else if (question.pollType === 'shortAnswer') {
      const questionVoters = pollMessage.pollData.voters[questionId] as Record<string, string> || {};
      questionVoters[userId] = submission; 
      pollMessage.pollData.voters[questionId] = questionVoters;
      
      const questionResults = pollMessage.pollData.results[questionId] as Record<string, string> || {};
      questionResults[userId] = submission;
      pollMessage.pollData.results[questionId] = questionResults;
      
      console.log(`[Service:messages] Short Answer Poll ${messageId}, Q ${questionId} submission from ${userId} recorded.`);
  }
  
  const newGroupMessages = [...groupMessages]; 
  newGroupMessages[messageIndex] = pollMessage;
  const newStore = new Map(store); 
  newStore.set(groupId, newGroupMessages);
  updateMockMessagesData(newStore);

  return pollMessage;
}

export async function publishPollResults(
    groupId: string, 
    messageId: string, 
    publisherId: string, 
    correctAnswers: Record<string, string> 
): Promise<Message | null> {
  await ensureMockDataInitialized();
  console.log(`[Service:messages] User ${publisherId} publishing results for poll ${messageId} in group ${groupId}. Correct answers:`, correctAnswers);
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
    questions: pollMessage.pollData.questions.map(q => {
      if (q.pollType === 'mcq' && correctAnswers[q.id]) {
        return { ...q, correctOptionId: correctAnswers[q.id] };
      }
      return q;
    })
  };
  
  const newGroupMessages = [...groupMessages];
  newGroupMessages[messageIndex] = pollMessage;
  const newStore = new Map(store);
  newStore.set(groupId, newGroupMessages);
  updateMockMessagesData(newStore);

  console.log(`[Service:messages] Poll ${messageId} results published. Updated questions with correct answers.`);
  return pollMessage;
}
