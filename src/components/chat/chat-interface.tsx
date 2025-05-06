'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip, Smile, Send, Mic, PlusCircle, Calendar, BarChart2 } from 'lucide-react'; // Add necessary icons
import { useAuth } from '@/context/auth-context'; // To identify the sender

// TODO: Replace with actual message type from backend/data source
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'Student' | 'Teacher' | 'Admin';
  senderAvatar?: string;
  content: string; // Could be text, or structured data for files, polls, events
  timestamp: Date;
  type: 'text' | 'file' | 'poll' | 'event'; // Example message types
}

// Placeholder messages
const initialMessages: Message[] = [
  { id: '1', senderId: 't1', senderName: 'Alice Smith', senderRole: 'Teacher', content: 'Welcome to the Class 10 Maths group!', timestamp: new Date(Date.now() - 60000 * 5), type: 'text' },
  { id: '2', senderId: 's1', senderName: 'Bob Williams', senderRole: 'Student', content: 'Hi Ms. Smith!', timestamp: new Date(Date.now() - 60000 * 4), type: 'text'},
  { id: '3', senderId: 't1', senderName: 'Alice Smith', senderRole: 'Teacher', content: 'Remember the homework due Friday.', timestamp: new Date(Date.now() - 60000 * 2), type: 'text', senderAvatar: 'https://picsum.photos/40/40?random=1' },
];

export function ChatInterface() {
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = React.useState('');
  const { user } = useAuth(); // Get current logged-in user
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  // TODO: Implement message sending logic (call API)
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageToSend: Message = {
      id: `msg-${Date.now()}`, // Temporary ID, backend should generate final ID
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      senderAvatar: user.profilePictureUrl,
      content: newMessage,
      timestamp: new Date(),
      type: 'text', // Default to text for now
    };

    // Simulate sending and receiving
    setMessages(prev => [...prev, messageToSend]);
    setNewMessage('');

    // TODO: Call backend API to actually send the message
    // await sendMessageApi(groupId, messageToSend);
  };

    // Scroll to bottom when new messages arrive
    React.useEffect(() => {
       if(scrollAreaRef.current){
          const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
           if(scrollViewport){
               scrollViewport.scrollTop = scrollViewport.scrollHeight;
           }
       }
    }, [messages]);

    // TODO: Determine user permissions for sending messages, polls, etc.
    const canSendMessage = user?.role === 'Teacher' || user?.role === 'Admin';
    const canCreatePoll = user?.role === 'Teacher' || user?.role === 'Admin';
    const canCreateEvent = user?.role === 'Teacher' || user?.role === 'Admin';
    const canAttachFile = user?.role === 'Teacher' || user?.role === 'Admin';

  return (
    <div className="flex h-full flex-col bg-card border rounded-lg shadow-md overflow-hidden">
      {/* Message Display Area */}
      <ScrollArea className="flex-1 p-4 space-y-4" ref={scrollAreaRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
          >
             {/* Avatar for incoming messages */}
             {msg.senderId !== user?.id && (
                <Avatar className="h-8 w-8">
                <AvatarImage src={msg.senderAvatar || `https://picsum.photos/40/40?random=${msg.senderId}`} data-ai-hint="sender avatar"/>
                <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                </Avatar>
             )}

            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                msg.senderId === user?.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {/* Render different message types */}
              {msg.type === 'text' && <p className="text-sm">{msg.content}</p>}
              {/* TODO: Add rendering for file, poll, event types */}
              {msg.type === 'file' && <p className="text-sm">[File: {msg.content}]</p>}
              {msg.type === 'poll' && <p className="text-sm">[Poll: {msg.content}]</p>}
              {msg.type === 'event' && <p className="text-sm">[Event: {msg.content}]</p>}

              <p className={`mt-1 text-xs ${msg.senderId === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'} text-right`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

             {/* Avatar for outgoing messages */}
             {msg.senderId === user?.id && (
                <Avatar className="h-8 w-8">
                <AvatarImage src={msg.senderAvatar || `https://picsum.photos/40/40?random=${msg.senderId}`} data-ai-hint="sender avatar"/>
                <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                </Avatar>
             )}
          </div>
        ))}
      </ScrollArea>

      {/* Message Input Area */}
      {canSendMessage && (
        <div className="border-t p-4 bg-background">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                 {/* Action Buttons (Attachment, Poll, Event) */}
                {/* TODO: Implement Popovers/Modals for these actions */}
                {canAttachFile && <Button type="button" variant="ghost" size="icon" aria-label="Attach file"><Paperclip className="h-5 w-5" /></Button>}
                {canCreatePoll && <Button type="button" variant="ghost" size="icon" aria-label="Create poll"><BarChart2 className="h-5 w-5" /></Button>}
                {canCreateEvent && <Button type="button" variant="ghost" size="icon" aria-label="Schedule event"><Calendar className="h-5 w-5" /></Button>}
                {/* TODO: Add a PlusCircle button that opens a menu with Poll, Event, File options */}
                {/* <Button type="button" variant="ghost" size="icon" aria-label="More options"><PlusCircle className="h-5 w-5" /></Button> */}


                <Input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                    disabled={!canSendMessage}
                />
                {/* TODO: Add Emoji Picker */}
                <Button type="button" variant="ghost" size="icon" aria-label="Emoji">
                    <Smile className="h-5 w-5" />
                </Button>
                <Button type="submit" size="icon" aria-label="Send message" disabled={!newMessage.trim()}>
                    <Send className="h-5 w-5" />
                </Button>
                {/* TODO: Add Mic button for voice messages */}
                {/* <Button type="button" variant="ghost" size="icon" aria-label="Record voice message">
                    <Mic className="h-5 w-5" />
                </Button> */}
                 {/* TODO: Add schedule send button */}
            </form>
             {/* TODO: Add Schedule Message UI */}
        </div>
      )}
       {!canSendMessage && (
            <div className="border-t p-4 bg-muted text-center text-sm text-muted-foreground">
                Only Teachers and Admins can post messages in this group.
            </div>
        )}
    </div>
  );
}
