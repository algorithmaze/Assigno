

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip, Smile, Send, MessageSquare as MessageSquareIcon, Loader2, Search, Filter, CalendarDays, ListChecks, FileText, CheckSquare, Trash2, PlusCircle } from 'lucide-react';
import { useAuth, type User as AuthUserType } from '@/context/auth-context';
import { getGroupMessages, addMessageToGroup, type Message, type NewMessageInput, type PollData, type EventData, type FileData, voteOnPoll, type PollOption, NewPollMessageInput, NewEventMessageInput, NewFileMessageInput } from '@/services/messages';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from '@/components/ui/progress';


interface ChatInterfaceProps {
    groupId: string;
    groupSenders: AuthUserType[]; // Teachers and Admins in the group
}

type MessageTypeFilter = Message['type'] | 'all';
// Sender filter will now be by user ID or 'all'
type SenderIdFilter = AuthUserType['id'] | 'all'; 

const POLLING_INTERVAL = 5000; // Poll every 5 seconds

export function ChatInterface({ groupId, groupSenders }: ChatInterfaceProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const { user } = useAuth();
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = React.useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(true);
  const { toast } = useToast();
  const isPollingRef = React.useRef(false);

  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterMessageType, setFilterMessageType] = React.useState<MessageTypeFilter>('all');
  const [filterSenderId, setFilterSenderId] = React.useState<SenderIdFilter>('all');

  const [isCreatePollOpen, setIsCreatePollOpen] = React.useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);


  const fetchAndSetMessages = React.useCallback(async (isPoll: boolean = false) => {
    if (!groupId) return;
    if (!isPoll) setIsLoadingMessages(true);
    try {
      const fetchedMessages = await getGroupMessages(groupId);
      setMessages(prevMessages => {
        if (JSON.stringify(prevMessages) !== JSON.stringify(fetchedMessages)) {
            return fetchedMessages;
        }
        return prevMessages;
      });
    } catch (error) {
        console.error("Error fetching messages:", error);
        if (!isPoll) toast({title: "Error", description: "Could not load messages.", variant: "destructive"});
        else console.warn("Polling for messages failed, suppressing UI error.");
    } finally {
        if (!isPoll) setIsLoadingMessages(false);
    }
  }, [groupId, toast]);

  React.useEffect(() => {
    fetchAndSetMessages(); // Initial load
  }, [fetchAndSetMessages]);

  React.useEffect(() => {
    if (!groupId) return; 
    
    const intervalId = setInterval(async () => {
        if (isPollingRef.current) return; 
        isPollingRef.current = true;
        try {
            // console.log("Polling for messages...");
            await fetchAndSetMessages(true);
        } catch (e) {
            console.error("Error during messages poll:", e);
        } finally {
            isPollingRef.current = false;
        }
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [groupId, fetchAndSetMessages]);


  const handleSendMessage = async (input: NewMessageInput) => {
    if (!user) return;

    if (user.role === 'Student' && !groupSettings?.allowStudentPosts) {
        toast({ title: "Restriction", description: "Students are not allowed to send messages in this group.", variant: "default"});
        return;
    }

    setIsSending(true);
    try {
      const sentMessage = await addMessageToGroup(groupId, input, user);
      setMessages(prev => [...prev, sentMessage].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));
      if (input.type === 'text') setNewMessage(''); // Clear text input only for text messages
    } catch (error) {
        console.error("Failed to send message:", error);
        toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
    } finally {
        setIsSending(false);
    }
  };

  const handleTextSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;
    handleSendMessage({ type: 'text', content: newMessage });
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // For mock, we'll simulate upload and use a data URL or just filename
    // In a real app, upload to Firebase Storage or other service
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData: FileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        url: e.target?.result as string, // Mock: using data URL as the 'download' url
      };
      const messageInput: NewFileMessageInput = {
        type: 'file',
        content: file.name, // Display filename as content
        fileData: fileData,
      };
      handleSendMessage(messageInput);
    };
    reader.readAsDataURL(file); // For mock, reading as data URL

     if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
  };

  const handleVote = async (messageId: string, optionId: string) => {
    if (!user) return;
    setIsSending(true); // Use general sending state for poll interactions
    try {
      const updatedPollMessage = await voteOnPoll(groupId, messageId, optionId, user.id);
      if (updatedPollMessage) {
        setMessages(prev => prev.map(msg => msg.id === messageId ? updatedPollMessage : msg));
        toast({ title: "Vote Cast", description: "Your vote has been recorded." });
      } else {
        toast({ title: "Error", description: "Failed to record vote.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An error occurred while voting.", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };


    React.useEffect(() => {
       if(scrollAreaRef.current && !isLoadingMessages){ 
          const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
           if(scrollViewport){
               scrollViewport.scrollTop = scrollViewport.scrollHeight;
           }
       }
    }, [messages, isLoadingMessages]); 

    const [groupSettings] = React.useState<{allowStudentPosts?: boolean}>({allowStudentPosts: false}); 

    const canPostMessages = user?.role === 'Teacher' || user?.role === 'Admin' || (user?.role === 'Student' && groupSettings?.allowStudentPosts);
    const canUseSpecialFeatures = user?.role === 'Teacher' || user?.role === 'Admin';


    const filteredAndSearchedMessages = React.useMemo(() => {
        return messages.filter(msg => {
            const typeMatch = filterMessageType === 'all' || msg.type === filterMessageType;
            const senderMatch = filterSenderId === 'all' || msg.senderId === filterSenderId;
            const searchTermLower = searchTerm.toLowerCase();
            
            let contentToSearch = '';
            if (msg.type === 'text') contentToSearch = msg.content;
            else if (msg.type === 'file' && msg.fileData) contentToSearch = msg.fileData.name;
            else if (msg.type === 'poll' && msg.pollData) contentToSearch = msg.pollData.question;
            else if (msg.type === 'event' && msg.eventData) contentToSearch = msg.eventData.title;

            const contentMatch = contentToSearch.toLowerCase().includes(searchTermLower);
            const senderNameMatch = msg.senderName.toLowerCase().includes(searchTermLower);
            const searchMatch = searchTerm.trim() === '' || contentMatch || senderNameMatch;

            return typeMatch && senderMatch && searchMatch;
        });
    }, [messages, searchTerm, filterMessageType, filterSenderId]);


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
                     <Select value={filterSenderId} onValueChange={(value) => setFilterSenderId(value as SenderIdFilter)}>
                        <SelectTrigger id="filter-sender" className="h-9 text-xs sm:text-sm w-full">
                            <SelectValue placeholder="Filter by Sender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Senders</SelectItem>
                            {groupSenders.map(sender => (
                                <SelectItem key={sender.id} value={sender.id}>
                                    {sender.name} ({sender.role})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
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
            className={`flex items-end gap-2 mb-4 ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
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
              
              {msg.type === 'file' && msg.fileData && (
                <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center gap-1.5"><FileText className="h-4 w-4"/> {msg.fileData.name}</p>
                    <p className="text-xs text-muted-foreground/80">{msg.fileData.type} - {(msg.fileData.size || 0 / 1024).toFixed(2)} KB</p>
                    {/* In a real app, this would be a download link */}
                    <Button size="sm" variant={msg.senderId === user?.id ? "secondary" : "outline"} className="mt-1 h-7 text-xs" asChild>
                        <a href={msg.fileData.url} download={msg.fileData.name} target="_blank" rel="noopener noreferrer">Download</a>
                    </Button>
                </div>
              )}

              {msg.type === 'poll' && msg.pollData && (
                <div className="space-y-2">
                    <p className="text-sm font-semibold">{msg.pollData.question}</p>
                    <RadioGroup
                        value={msg.pollData.voters?.[user?.id || ''] || ''}
                        onValueChange={(optionId) => handleVote(msg.id, optionId)}
                        className="space-y-1.5"
                        disabled={isSending}
                    >
                        {msg.pollData.options.map(option => {
                            const totalVotes = Object.values(msg.pollData?.results || {}).reduce((sum, count) => sum + count, 0);
                            const optionVotes = msg.pollData?.results?.[option.id] || 0;
                            const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
                            return (
                                <div key={option.id}>
                                    <div className="flex items-center space-x-2 mb-0.5">
                                        <RadioGroupItem value={option.id} id={`${msg.id}-${option.id}`} disabled={isSending}/>
                                        <Label htmlFor={`${msg.id}-${option.id}`} className="text-sm flex-1 cursor-pointer">{option.text}</Label>
                                        <span className="text-xs text-muted-foreground/80">{optionVotes} vote(s)</span>
                                    </div>
                                    <Progress value={percentage} className="h-1.5"/>
                                </div>
                            );
                        })}
                    </RadioGroup>
                </div>
              )}

              {msg.type === 'event' && msg.eventData && (
                <div className="space-y-1">
                    <p className="text-sm font-semibold flex items-center gap-1.5"><CalendarDays className="h-4 w-4"/> {msg.eventData.title}</p>
                    {msg.eventData.description && <p className="text-xs text-muted-foreground/80">{msg.eventData.description}</p>}
                    <p className="text-xs">Date: {format(new Date(msg.eventData.dateTime), "PPP p")}</p>
                    {msg.eventData.location && <p className="text-xs">Location: {msg.eventData.location}</p>}
                    {/* Button to add to Google Calendar (complex, requires API or well-formed link) */}
                    <Button size="sm" variant={msg.senderId === user?.id ? "secondary" : "outline"} className="mt-1 h-7 text-xs" 
                        onClick={() => {
                             const gCalUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(msg.eventData?.title || '')}&dates=${new Date(msg.eventData?.dateTime || '').toISOString().replace(/-|:|\.\d{3}/g, '')}/${new Date(new Date(msg.eventData?.dateTime || '').getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d{3}/g, '')}&details=${encodeURIComponent(msg.eventData?.description || '')}&location=${encodeURIComponent(msg.eventData?.location || '')}`;
                             window.open(gCalUrl, '_blank');
                        }}
                    >
                        Add to Calendar
                    </Button>
                </div>
              )}
              
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
            <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
                {canUseSpecialFeatures && (
                    <>
                        <Input type="file" ref={fileInputRef} onChange={handleFileSelected} className="hidden" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,text/plain"/>
                        <Button type="button" variant="ghost" size="icon" aria-label="Attach file" onClick={() => fileInputRef.current?.click()} disabled={isSending}><Paperclip className="h-5 w-5" /></Button>
                        
                        <CreatePollDialog onSendPoll={handleSendMessage} disabled={isSending} />
                        <CreateEventDialog onSendEvent={handleSendMessage} disabled={isSending} />
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


// Create Poll Dialog Component
interface CreatePollDialogProps {
  onSendPoll: (input: NewPollMessageInput) => void;
  disabled?: boolean;
}
function CreatePollDialog({ onSendPoll, disabled }: CreatePollDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [question, setQuestion] = React.useState('');
  const [options, setOptions] = React.useState<PollOption[]>([{ id: `opt-${Date.now()}`, text: '' }]);

  const handleAddOption = () => setOptions([...options, { id: `opt-${Date.now()}-${options.length}`, text: '' }]);
  const handleRemoveOption = (id: string) => setOptions(options.filter(opt => opt.id !== id));
  const handleOptionChange = (id: string, text: string) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, text } : opt));
  };

  const handleSubmit = () => {
    if (!question.trim() || options.some(opt => !opt.text.trim()) || options.length < 2) {
      toast({ title: "Invalid Poll", description: "Question and at least two options are required.", variant: "destructive" });
      return;
    }
    onSendPoll({
      type: 'poll',
      content: question, // Main content is the question
      pollData: { question, options: options.filter(opt => opt.text.trim()) },
    });
    setIsOpen(false);
    setQuestion('');
    setOptions([{ id: `opt-${Date.now()}`, text: '' }]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="Create poll" disabled={disabled}><ListChecks className="h-5 w-5" /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Poll</DialogTitle>
          <DialogDescription>Ask a question and provide options for members to vote.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="poll-question" className="text-right col-span-1">Question</Label>
            <Input id="poll-question" value={question} onChange={(e) => setQuestion(e.target.value)} className="col-span-3" placeholder="What's your question?"/>
          </div>
          {options.map((option, index) => (
            <div key={option.id} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`poll-option-${index}`} className="text-right col-span-1">Option {index + 1}</Label>
              <Input id={`poll-option-${index}`} value={option.text} onChange={(e) => handleOptionChange(option.id, e.target.value)} className="col-span-2" placeholder={`Option ${index+1}`}/>
              {options.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveOption(option.id)} className="col-span-1 justify-self-start" aria-label="Remove option">
                    <Trash2 className="h-4 w-4"/>
                </Button>
              )}
            </div>
          ))}
           <Button type="button" variant="outline" onClick={handleAddOption} className="mt-2 justify-self-start ml-auto mr-auto w-full sm:w-auto col-span-4 sm:col-start-2">
            <PlusCircle className="mr-2 h-4 w-4"/> Add Option
          </Button>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="button" onClick={handleSubmit}>Create Poll</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Create Event Dialog Component
interface CreateEventDialogProps {
  onSendEvent: (input: NewEventMessageInput) => void;
  disabled?: boolean;
}
function CreateEventDialog({ onSendEvent, disabled }: CreateEventDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [dateTime, setDateTime] = React.useState<Date | undefined>();
  const [location, setLocation] = React.useState('');

  const handleSubmit = () => {
    if (!title.trim() || !dateTime) {
        toast({ title: "Invalid Event", description: "Event title and date/time are required.", variant: "destructive" });
        return;
    }
    onSendEvent({
      type: 'event',
      content: title, // Main content is the title
      eventData: { title, description, dateTime: dateTime.toISOString(), location },
    });
    setIsOpen(false);
    setTitle(''); setDescription(''); setDateTime(undefined); setLocation('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="Create event" disabled={disabled}><CalendarDays className="h-5 w-5" /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>Share an event with the group and set a reminder.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="event-title" className="text-right">Title</Label>
            <Input id="event-title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" placeholder="Event name"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="event-description" className="text-right">Description</Label>
            <Textarea id="event-description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder="Details about the event (optional)"/>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="event-datetime" className="text-right">Date & Time</Label>
             <Popover>
                <PopoverTrigger asChild>
                    <Button
                    variant={"outline"}
                    className={`col-span-3 justify-start text-left font-normal ${!dateTime && "text-muted-foreground"}`}
                    >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {dateTime ? format(dateTime, "PPP p") : <span>Pick a date and time</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={dateTime}
                        onSelect={setDateTime}
                        initialFocus
                    />
                    {/* Basic time picker - replace with a better one if needed */}
                    <div className="p-2 border-t">
                        <Input type="time" defaultValue={dateTime ? format(dateTime, "HH:mm") : "12:00"} onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':').map(Number);
                            const newDate = dateTime ? new Date(dateTime) : new Date();
                            newDate.setHours(hours);
                            newDate.setMinutes(minutes);
                            setDateTime(newDate);
                        }}/>
                    </div>
                </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="event-location" className="text-right">Location</Label>
            <Input id="event-location" value={location} onChange={(e) => setLocation(e.target.value)} className="col-span-3" placeholder="e.g., School Auditorium (optional)"/>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="button" onClick={handleSubmit}>Create Event</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
