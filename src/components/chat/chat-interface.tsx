'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip, Smile, Send, Mic, PlusCircle, Calendar, BarChart2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

// TODO: Replace with actual message type from backend/data source
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'Student' | 'Teacher' | 'Admin';
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'poll' | 'event';
}

// Placeholder messages - these should be cleared or fetched properly
const initialMessages: Message[] = [
  // { id: '1', senderId: 'teacher-001', senderName: 'Alice Smith', senderRole: 'Teacher', content: 'Welcome to the group!', timestamp: new Date(Date.now() - 60000 * 5), type: 'text', senderAvatar: 'https://picsum.photos/40/40?random=teacher-001' },
  // { id: '2', senderId: 'student-001', senderName: 'Student User', senderRole: 'Student', content: 'Hi!', timestamp: new Date(Date.now() - 60000 * 4), type: 'text', senderAvatar: 'https://picsum.photos/40/40?random=student-001'},
];


interface ChatInterfaceProps {
    groupId: string;
    // TODO: Potentially pass group settings here, e.g., if students can post
}

export function ChatInterface({ groupId }: ChatInterfaceProps) {
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = React.useState('');
  const { user } = useAuth();
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        console.log(`[ChatInterface] Fetching messages for group: ${groupId}`);
        // TODO: Implement actual message fetching for the groupId
        // fetchMessages(groupId).then(setMessages);
        // For now, clear initial messages if you don't want placeholders for every group
        setMessages([]);
    }, [groupId]);


  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !user) return;

    // Student posting restriction (can be made more dynamic based on group settings)
    if (user.role === 'Student') {
        // alert("Students cannot post messages in this group."); // Or use a toast
        console.log("Student attempted to send message, but is restricted.");
        return;
    }

    const messageToSend: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      senderAvatar: user.profilePictureUrl,
      content: newMessage,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, messageToSend]);
    setNewMessage('');
    // TODO: Call backend API to send the message
    console.log(`Simulating sending message to group ${groupId}:`, messageToSend);
  };

    React.useEffect(() => {
       if(scrollAreaRef.current){
          const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
           if(scrollViewport){
               scrollViewport.scrollTop = scrollViewport.scrollHeight;
           }
       }
    }, [messages]);

    // Permissions
    const canPostMessages = user?.role === 'Teacher' || user?.role === 'Admin';
    // const canCreatePoll = user?.role === 'Teacher' || user?.role === 'Admin';
    // const canCreateEvent = user?.role === 'Teacher' || user?.role === 'Admin';
    // const canAttachFile = user?.role === 'Teacher' || user?.role === 'Admin';
    // For simplicity, only teachers/admins can use special features for now.
    const canUseSpecialFeatures = canPostMessages;


  return (
    <div className="flex h-full flex-col bg-card border rounded-lg shadow-md overflow-hidden">
      <ScrollArea className="flex-1 p-4 space-y-4" ref={scrollAreaRef}>
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageSquare size={48} className="mb-2"/>
                <p>No messages yet.</p>
                {canPostMessages ? <p>Start the conversation!</p> : <p>Messages from your teachers/admins will appear here.</p>}
            </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
          >
             {msg.senderId !== user?.id && (
                <Avatar className="h-8 w-8 self-start">
                <AvatarImage src={msg.senderAvatar || `https://picsum.photos/40/40?random=${msg.senderId}`} data-ai-hint="sender avatar"/>
                <AvatarFallback>{msg.senderName?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
             )}
            <div
              className={`max-w-[70%] rounded-lg px-3 py-2 shadow-sm ${
                msg.senderId === user?.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground' // Changed from secondary for better contrast potentially
              }`}
            >
              {msg.senderId !== user?.id && <p className="text-xs font-medium mb-0.5">{msg.senderName} ({msg.senderRole})</p>}
              {msg.type === 'text' && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
              {msg.type === 'file' && <p className="text-sm">[File: {msg.content}]</p>}
              {msg.type === 'poll' && <p className="text-sm">[Poll: {msg.content}]</p>}
              {msg.type === 'event' && <p className="text-sm">[Event: {msg.content}]</p>}
              <p className={`mt-1 text-xs ${msg.senderId === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground/80'} text-right`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
             {msg.senderId === user?.id && (
                <Avatar className="h-8 w-8 self-start">
                <AvatarImage src={msg.senderAvatar || `https://picsum.photos/40/40?random=${msg.senderId}`} data-ai-hint="your avatar"/>
                <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
             )}
          </div>
        ))}
      </ScrollArea>

      {canPostMessages ? (
        <div className="border-t p-2 sm:p-4 bg-background">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                {canUseSpecialFeatures && (
                    <>
                        <Button type="button" variant="ghost" size="icon" aria-label="Attach file" disabled><Paperclip className="h-5 w-5" /></Button>
                        {/* <Button type="button" variant="ghost" size="icon" aria-label="Create poll" disabled><BarChart2 className="h-5 w-5" /></Button>
                        <Button type="button" variant="ghost" size="icon" aria-label="Schedule event" disabled><Calendar className="h-5 w-5" /></Button> */}
                        {/* For more options in a popover: */}
                        {/*
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon"><PlusCircle className="h-5 w-5" /></Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Command>
                                    <CommandList>
                                        <CommandGroup>
                                            <CommandItem onSelect={() => console.log("Poll")}>Poll</CommandItem>
                                            <CommandItem onSelect={() => console.log("Event")}>Event</CommandItem>
                                            <CommandItem onSelect={() => console.log("File")}>File</CommandItem>
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        */}
                    </>
                )}
                <Input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                    disabled={!canPostMessages}
                />
                <Button type="button" variant="ghost" size="icon" aria-label="Emoji" disabled>
                    <Smile className="h-5 w-5" />
                </Button>
                <Button type="submit" size="icon" aria-label="Send message" disabled={!newMessage.trim() || !canPostMessages}>
                    <Send className="h-5 w-5" />
                </Button>
            </form>
        </div>
      ) : (
        <div className="border-t p-4 bg-muted text-center text-sm text-muted-foreground">
            Students can only view messages in this group.
        </div>
      )}
    </div>
  );
}
