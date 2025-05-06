
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip, Smile, Send, MessageSquare as MessageSquareIcon, Loader2 } from 'lucide-react'; // Added Loader2, MessageSquareIcon
import { useAuth } from '@/context/auth-context';
import { getGroupMessages, addMessageToGroup, type Message, type NewMessageInput } from '@/services/messages'; // Updated imports
import { useToast } from '@/hooks/use-toast';


interface ChatInterfaceProps {
    groupId: string;
}

export function ChatInterface({ groupId }: ChatInterfaceProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const { user } = useAuth();
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = React.useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(true);
  const { toast } = useToast();

  const fetchAndSetMessages = React.useCallback(async () => {
    if (!groupId) return;
    setIsLoadingMessages(true);
    try {
      console.log(`[ChatInterface] Fetching messages for group: ${groupId}`);
      const fetchedMessages = await getGroupMessages(groupId);
      setMessages(fetchedMessages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        toast({title: "Error", description: "Could not load messages.", variant: "destructive"});
    } finally {
        setIsLoadingMessages(false);
    }
  }, [groupId, toast]);

  React.useEffect(() => {
    fetchAndSetMessages();
  }, [fetchAndSetMessages]);

  // Polling for new messages (simple implementation)
  // In a real app, use WebSockets or server-sent events
  React.useEffect(() => {
    if (!groupId) return;
    const intervalId = setInterval(async () => {
        try {
            const latestMessages = await getGroupMessages(groupId);
            // Only update if there's a change in message count or latest message ID
            if (latestMessages.length !== messages.length || (latestMessages.length > 0 && messages.length > 0 && latestMessages[latestMessages.length - 1].id !== messages[messages.length -1].id)) {
                setMessages(latestMessages);
            }
        } catch (error) {
            console.warn("Polling for messages failed:", error);
        }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [groupId, messages]);


  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !user) return;

    if (user.role === 'Student') {
        console.log("Student attempted to send message, but is restricted.");
        toast({ title: "Restriction", description: "Students cannot send messages in this group.", variant: "default"});
        return;
    }

    setIsSending(true);
    const messageInput: NewMessageInput = {
      content: newMessage,
      type: 'text', // Default to text, other types can be added via UI
    };

    try {
      const sentMessage = await addMessageToGroup(groupId, messageInput, user);
      setMessages(prev => [...prev, sentMessage]); // Optimistically update UI
      setNewMessage('');
    } catch (error) {
        console.error("Failed to send message:", error);
        toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
    } finally {
        setIsSending(false);
    }
  };

    React.useEffect(() => {
       if(scrollAreaRef.current){
          const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
           if(scrollViewport){
               scrollViewport.scrollTop = scrollViewport.scrollHeight;
           }
       }
    }, [messages]);

    const canPostMessages = user?.role === 'Teacher' || user?.role === 'Admin';
    const canUseSpecialFeatures = canPostMessages;


  return (
    <div className="flex h-full flex-col bg-card border rounded-lg shadow-md overflow-hidden">
      <ScrollArea className="flex-1 p-4 space-y-4" ref={scrollAreaRef}>
        {isLoadingMessages && (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Loader2 size={48} className="mb-2 animate-spin"/>
                <p>Loading messages...</p>
            </div>
        )}
        {!isLoadingMessages && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageSquareIcon size={48} className="mb-2"/>
                <p>No messages yet.</p>
                {canPostMessages ? <p>Start the conversation!</p> : <p>Messages from your teachers/admins will appear here.</p>}
            </div>
        )}
        {!isLoadingMessages && messages.map((msg) => (
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
                  : 'bg-muted text-card-foreground'
              }`}
            >
              {msg.senderId !== user?.id && <p className="text-xs font-medium mb-0.5">{msg.senderName} <span className="text-xs opacity-70">({msg.senderRole})</span></p>}
              {msg.type === 'text' && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
              {msg.type === 'file' && <p className="text-sm">[File: {msg.content}]</p>}
              {msg.type === 'poll' && <p className="text-sm">[Poll: {msg.content}]</p>}
              {msg.type === 'event' && <p className="text-sm">[Event: {msg.content}]</p>}
              <p className={`mt-1 text-xs ${msg.senderId === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground/80'} text-right`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                    </>
                )}
                <Input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                    disabled={!canPostMessages || isSending}
                />
                <Button type="button" variant="ghost" size="icon" aria-label="Emoji" disabled>
                    <Smile className="h-5 w-5" />
                </Button>
                <Button type="submit" size="icon" aria-label="Send message" disabled={!newMessage.trim() || !canPostMessages || isSending}>
                    {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
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
