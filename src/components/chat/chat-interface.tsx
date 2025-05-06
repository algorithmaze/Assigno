
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip, Smile, Send, MessageSquare as MessageSquareIcon, Loader2, Search, Filter } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { getGroupMessages, addMessageToGroup, type Message, type NewMessageInput } from '@/services/messages';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface ChatInterfaceProps {
    groupId: string;
}

type MessageTypeFilter = Message['type'] | 'all';
type SenderRoleFilter = User['role'] | 'all';


export function ChatInterface({ groupId }: ChatInterfaceProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const { user } = useAuth();
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = React.useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(true);
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterMessageType, setFilterMessageType] = React.useState<MessageTypeFilter>('all');
  const [filterSenderRole, setFilterSenderRole] = React.useState<SenderRoleFilter>('all');


  const fetchAndSetMessages = React.useCallback(async () => {
    if (!groupId) return;
    setIsLoadingMessages(true);
    try {
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

  React.useEffect(() => {
    if (!groupId || isLoadingMessages) return; // Don't poll if initially loading
    const intervalId = setInterval(async () => {
        try {
            const latestMessages = await getGroupMessages(groupId);
            // Only update if there's a change in message count or latest message ID
            // This prevents unnecessary re-renders if filters are active client-side
             if (latestMessages.length !== messages.length || 
                (latestMessages.length > 0 && messages.length > 0 && 
                 latestMessages[latestMessages.length - 1].id !== messages[messages.length -1].id)) {
                setMessages(latestMessages);
            }
        } catch (error) {
            console.warn("Polling for messages failed:", error);
        }
    }, 5000); 

    return () => clearInterval(intervalId);
  }, [groupId, messages, isLoadingMessages]);


  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !user) return;

    if (user.role === 'Student' && !groupSettings?.allowStudentPosts) { // Assuming groupSettings might control this
        toast({ title: "Restriction", description: "Students cannot send messages in this group.", variant: "default"});
        return;
    }

    setIsSending(true);
    const messageInput: NewMessageInput = {
      content: newMessage,
      type: 'text', 
    };

    try {
      const sentMessage = await addMessageToGroup(groupId, messageInput, user);
      setMessages(prev => [...prev, sentMessage]); 
      setNewMessage('');
    } catch (error) {
        console.error("Failed to send message:", error);
        toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
    } finally {
        setIsSending(false);
    }
  };

    React.useEffect(() => {
       if(scrollAreaRef.current && !isLoadingMessages){ // Only scroll if not loading new set of messages
          const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
           if(scrollViewport){
               scrollViewport.scrollTop = scrollViewport.scrollHeight;
           }
       }
    }, [messages, isLoadingMessages]); // Re-evaluate scroll when messages change, but not while loading

    // TODO: Fetch group settings to determine if students can post
    const [groupSettings, setGroupSettings] = React.useState<{allowStudentPosts?: boolean}>({allowStudentPosts: false}); // Placeholder

    const canPostMessages = user?.role === 'Teacher' || user?.role === 'Admin' || (user?.role === 'Student' && groupSettings?.allowStudentPosts);
    const canUseSpecialFeatures = user?.role === 'Teacher' || user?.role === 'Admin';


    const filteredAndSearchedMessages = React.useMemo(() => {
        return messages.filter(msg => {
            const typeMatch = filterMessageType === 'all' || msg.type === filterMessageType;
            const roleMatch = filterSenderRole === 'all' || msg.senderRole === filterSenderRole;
            const searchTermLower = searchTerm.toLowerCase();
            const contentMatch = msg.content.toLowerCase().includes(searchTermLower);
            const senderNameMatch = msg.senderName.toLowerCase().includes(searchTermLower);
            const searchMatch = searchTerm.trim() === '' || contentMatch || senderNameMatch;

            return typeMatch && roleMatch && searchMatch;
        });
    }, [messages, searchTerm, filterMessageType, filterSenderRole]);


  return (
    <div className="flex h-full flex-col bg-card border rounded-lg shadow-md overflow-hidden">
      <div className="p-2 sm:p-3 border-b bg-background sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
                <Input
                    type="search"
                    placeholder="Search messages or senders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full h-9"
                />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <div className="flex-1 sm:flex-initial">
                    <Label htmlFor="filter-type" className="sr-only">Filter by Type</Label>
                    <Select value={filterMessageType} onValueChange={(value) => setFilterMessageType(value as MessageTypeFilter)}>
                        <SelectTrigger id="filter-type" className="h-9 text-xs sm:text-sm w-full">
                            <SelectValue placeholder="Filter by Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="file">File</SelectItem>
                            <SelectItem value="poll">Poll</SelectItem>
                            <SelectItem value="event">Event</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-1 sm:flex-initial">
                     <Label htmlFor="filter-sender" className="sr-only">Filter by Sender</Label>
                     <Select value={filterSenderRole} onValueChange={(value) => setFilterSenderRole(value as SenderRoleFilter)}>
                        <SelectTrigger id="filter-sender" className="h-9 text-xs sm:text-sm w-full">
                            <SelectValue placeholder="Filter by Sender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Senders</SelectItem>
                            <SelectItem value="Teacher">Teachers</SelectItem>
                            <SelectItem value="Admin">Admins</SelectItem>
                            {/* Add Student if needed, but typically for teacher-student interactions */}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 space-y-4" ref={scrollAreaRef}>
        {isLoadingMessages && (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Loader2 size={32} className="mb-2 animate-spin"/>
                <p>Loading messages...</p>
            </div>
        )}
        {!isLoadingMessages && filteredAndSearchedMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                <Filter size={32} className="mb-3"/>
                <p className="text-lg font-medium">No Messages Found</p>
                {messages.length > 0 ? 
                    <p className="text-sm">Try adjusting your search or filter criteria.</p> :
                    (canPostMessages ? <p className="text-sm">Be the first to start the conversation!</p> : <p className="text-sm">Messages from teachers/admins will appear here.</p>)
                }
            </div>
        )}
        {!isLoadingMessages && filteredAndSearchedMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
          >
             {msg.senderId !== user?.id && (
                <Avatar className="h-8 w-8 self-start flex-shrink-0">
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
              {msg.senderId !== user?.id && <p className="text-xs font-semibold mb-0.5">{msg.senderName} <span className="text-xs opacity-70">({msg.senderRole})</span></p>}
              {msg.type === 'text' && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
              {msg.type === 'file' && <p className="text-sm">[File: {msg.content}]</p>}
              {msg.type === 'poll' && <p className="text-sm">[Poll: {msg.content}]</p>}
              {msg.type === 'event' && <p className="text-sm">[Event: {msg.content}]</p>}
              <p className={`mt-1 text-xs ${msg.senderId === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground/80'} text-right`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
             {msg.senderId === user?.id && (
                <Avatar className="h-8 w-8 self-start flex-shrink-0">
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
                    className="flex-1 h-10"
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

