
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip, Smile, Send, MessageSquareIcon, Loader2, Search, Filter, CalendarDays, ListChecks, FileText, CheckSquare, Trash2, PlusCircle, Eye, EyeOff, CheckCircle, AlertTriangle, CalendarIcon, XCircle } from 'lucide-react';
import { useAuth, type User as AuthUserType } from '@/context/auth-context';
import { getGroupMessages, addMessageToGroup, type Message, type NewMessageInput, type PollData, type EventData, type FileData, voteOnPoll, type PollOption, NewPollMessageInput, NewEventMessageInput, NewFileMessageInput, publishPollResults } from '@/services/messages';
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
import { format, isSameDay } from 'date-fns';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';


interface ChatInterfaceProps {
    groupId: string;
    groupSenders: AuthUserType[]; 
}

type MessageTypeFilter = Message['type'] | 'all';
type SenderIdFilter = AuthUserType['id'] | 'all'; 

const POLLING_INTERVAL = 3000; 

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
  const [filterDate, setFilterDate] = React.useState<Date | undefined>(undefined);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [shortAnswerSubmissions, setShortAnswerSubmissions] = React.useState<Record<string, string>>({});
  const [pollToPublish, setPollToPublish] = React.useState<Message | null>(null);


  const fetchAndSetMessages = React.useCallback(async (isPoll: boolean = false) => {
    if (!groupId) return;
    if (!isPoll) setIsLoadingMessages(true);
    isPollingRef.current = true; 
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
        isPollingRef.current = false; 
    }
  }, [groupId, toast]);

  React.useEffect(() => {
    fetchAndSetMessages(); 
  }, [fetchAndSetMessages]);

  React.useEffect(() => {
    if (!groupId) return; 
    
    const intervalId = setInterval(async () => {
        if (isPollingRef.current) {
          console.log("Message polling skipped, already in progress.");
          return; 
        }
        console.log("Polling for messages...");
        await fetchAndSetMessages(true);
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
      if (input.type === 'text') setNewMessage(''); 
      
      setTimeout(() => {
         if(scrollAreaRef.current){ 
            const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
             if(scrollViewport){
                 scrollViewport.scrollTop = scrollViewport.scrollHeight;
             }
         }
      }, 0);
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

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData: FileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        url: e.target?.result as string, 
      };
      const messageInput: NewFileMessageInput = {
        type: 'file',
        content: file.name, 
        fileData: fileData,
      };
      handleSendMessage(messageInput);
    };
    reader.readAsDataURL(file);

     if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
  };

  const handleVoteOrSubmitAnswer = async (messageId: string, submission: string) => {
    if (!user) return;
    setIsSending(true); 
    try {
      const updatedPollMessage = await voteOnPoll(groupId, messageId, submission, user.id);
      if (updatedPollMessage) {
        setMessages(prev => prev.map(msg => msg.id === messageId ? updatedPollMessage : msg));
        const pollType = updatedPollMessage.pollData?.pollType;
        toast({ title: pollType === 'mcq' ? "Vote Cast" : "Answer Submitted", description: `Your ${pollType === 'mcq' ? 'vote' : 'answer'} has been recorded.` });
        if (pollType === 'shortAnswer') {
            setShortAnswerSubmissions(prev => ({...prev, [messageId]: ''})); 
        }
      } else {
        toast({ title: "Error", description: "Failed to record submission.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An error occurred while submitting.", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenPublishDialog = (message: Message) => {
    if (message.type === 'poll' && message.pollData?.pollType === 'mcq') {
        setPollToPublish(message);
    } else if (message.type === 'poll' && message.pollData?.pollType === 'shortAnswer') {
        
        handleConfirmPublishResults(message.id);
    }
  };

  const handleConfirmPublishResults = async (messageId: string, correctOptionId?: string) => {
    if(!user || (user.role !== 'Teacher' && user.role !== 'Admin')) return;
    setIsSending(true);
    try {
        const updatedPollMessage = await publishPollResults(groupId, messageId, user.id, correctOptionId);
        if (updatedPollMessage) {
            setMessages(prev => prev.map(msg => msg.id === messageId ? updatedPollMessage : msg));
            toast({ title: "Results Published", description: "Poll results are now visible to students."});
        } else {
            toast({ title: "Error", description: "Failed to publish results.", variant: "destructive"});
        }
    } catch (error) {
        toast({ title: "Error", description: "An error occurred while publishing results.", variant: "destructive"});
    } finally {
        setIsSending(false);
        setPollToPublish(null); 
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

    const [groupSettings] = React.useState<{allowStudentPosts?: boolean}>({allowStudentPosts: true}); 

    const canPostMessages = user?.role === 'Teacher' || user?.role === 'Admin' || (user?.role === 'Student' && groupSettings?.allowStudentPosts);
    const canUseSpecialFeatures = user?.role === 'Teacher' || user?.role === 'Admin';


    const filteredAndSearchedMessages = React.useMemo(() => {
        return messages.filter(msg => {
            const typeMatch = filterMessageType === 'all' || msg.type === filterMessageType;
            const senderMatch = filterSenderId === 'all' || msg.senderId === filterSenderId;
            const dateMatch = !filterDate || isSameDay(new Date(msg.timestamp), filterDate);
            const searchTermLower = searchTerm.toLowerCase();
            
            let contentToSearch = '';
            if (msg.type === 'text') contentToSearch = msg.content;
            else if (msg.type === 'file' && msg.fileData) contentToSearch = msg.fileData.name;
            else if (msg.type === 'poll' && msg.pollData) contentToSearch = msg.pollData.question;
            else if (msg.type === 'event' && msg.eventData) contentToSearch = msg.eventData.title;

            const contentMatch = contentToSearch.toLowerCase().includes(searchTermLower);
            const senderNameMatch = msg.senderName.toLowerCase().includes(searchTermLower);
            const searchMatch = searchTerm.trim() === '' || contentMatch || senderNameMatch;

            return typeMatch && senderMatch && dateMatch && searchMatch;
        }).sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime()); 
    }, [messages, searchTerm, filterMessageType, filterSenderId, filterDate]);

    const handleShortAnswerChange = (messageId: string, value: string) => {
      setShortAnswerSubmissions(prev => ({...prev, [messageId]: value}));
    };


  return (
    <div className="flex h-full flex-col bg-card border rounded-lg shadow-md overflow-hidden">
      <div className="p-2 sm:p-3 border-b bg-background sticky top-0 z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 items-center gap-2">
            <div className="relative w-full col-span-1 sm:col-span-2 md:col-span-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
                <Input
                    type="search"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full h-9"
                />
            </div>
            
            <div className="w-full">
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
            
            <div className="w-full">
                    <Label htmlFor="filter-sender" className="sr-only">Filter by Sender</Label>
                    <Select value={filterSenderId} onValueChange={(value) => setFilterSenderId(value as SenderIdFilter)}>
                    <SelectTrigger id="filter-sender" className="h-9 text-xs sm:text-sm w-full">
                        <SelectValue placeholder="Filter by Sender" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Senders</SelectItem>
                        {groupSenders
                            .filter(sender => sender.role === 'Teacher' || sender.role === 'Admin') 
                            .map(sender => (
                            <SelectItem key={sender.id} value={sender.id}>
                                {sender.name} ({sender.role})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="w-full">
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className="h-9 w-full justify-start text-left font-normal text-xs sm:text-sm"
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filterDate ? format(filterDate, "PPP") : <span>Filter by Date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                        mode="single"
                        selected={filterDate}
                        onSelect={(date) => {setFilterDate(date);}}
                        initialFocus
                        />
                         {filterDate && (
                            <div className="p-2 border-t">
                                <Button variant="ghost" size="sm" className="w-full text-destructive" onClick={() => setFilterDate(undefined)}>
                                    <XCircle className="mr-2 h-4 w-4" /> Clear Date Filter
                                </Button>
                            </div>
                        )}
                    </PopoverContent>
                </Popover>
            </div>
        </div>
      </div>

      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-6">
            {isLoadingMessages && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Loader2 size={32} className="mb-2 animate-spin"/>
                    <p>Loading messages...</p>
                </div>
            )}
            {!isLoadingMessages && filteredAndSearchedMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                    {messages.length > 0 ? <Filter size={32} className="mb-3"/> : <MessageSquareIcon size={32} className="mb-3"/>}
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
                
                {msg.type === 'file' && msg.fileData && (
                    <div className="space-y-1">
                        <p className="text-sm font-medium flex items-center gap-1.5"><FileText className="h-4 w-4"/> {msg.fileData.name}</p>
                        <p className="text-xs text-muted-foreground/80">{msg.fileData.type} - {((msg.fileData.size || 0) / 1024).toFixed(2)} KB</p>
                        <Button size="sm" variant={msg.senderId === user?.id ? "secondary" : "outline"} className="mt-1 h-7 text-xs" asChild>
                            <a href={msg.fileData.url} download={msg.fileData.name} target="_blank" rel="noopener noreferrer">Download</a>
                        </Button>
                    </div>
                )}

                {msg.type === 'poll' && msg.pollData && (
                    <div className="space-y-3">
                        <p className="text-sm font-semibold">{msg.pollData.question}</p>
                        
                        {msg.pollData.pollType === 'mcq' && msg.pollData.options && (
                            <RadioGroup
                                value={msg.pollData.voters?.[user?.id || ''] || ''}
                                onValueChange={(optionId) => handleVoteOrSubmitAnswer(msg.id, optionId)}
                                className="space-y-1.5"
                                disabled={isSending || !!msg.pollData.voters?.[user?.id || ''] || msg.pollData.resultsPublished}
                            >
                                {msg.pollData.options.map(option => {
                                    const canViewIndividualResults = user?.role !== 'Student' || !msg.pollData?.studentAnswersHidden || msg.pollData?.resultsPublished;
                                    const totalVotes = Object.values(msg.pollData?.results || {}).reduce((sum, count) => sum + count, 0);
                                    const optionVotes = msg.pollData?.results?.[option.id] || 0;
                                    const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
                                    const isCorrect = msg.pollData?.resultsPublished && msg.pollData.correctOptionId === option.id;
                                    const isIncorrectSelected = msg.pollData?.resultsPublished && msg.pollData.correctOptionId && msg.pollData.correctOptionId !== option.id && msg.pollData.voters?.[user?.id || ''] === option.id;
                                    const isSelected = msg.pollData.voters?.[user?.id || ''] === option.id;
                                    
                                    let optionStyleClasses = "p-1.5 rounded-md";
                                    if(isCorrect) optionStyleClasses += " bg-success text-success-foreground";
                                    else if(isIncorrectSelected) optionStyleClasses += " bg-destructive text-destructive-foreground";
                                    else if(msg.pollData?.resultsPublished && isSelected && !isCorrect) optionStyleClasses += " bg-muted"; 


                                    return (
                                        <div key={option.id} className={optionStyleClasses}>
                                            <div className="flex items-center space-x-2 mb-0.5">
                                                <RadioGroupItem value={option.id} id={`${msg.id}-${option.id}`} disabled={isSending || !!msg.pollData?.voters?.[user?.id || ''] || msg.pollData.resultsPublished}/>
                                                <Label htmlFor={`${msg.id}-${option.id}`} className="text-sm flex-1 cursor-pointer">{option.text}</Label>
                                                {canViewIndividualResults && <span className="text-xs opacity-80">{optionVotes} vote(s)</span>}
                                            </div>
                                            {canViewIndividualResults && <Progress value={percentage} className="h-1.5"/>}
                                        </div>
                                    );
                                })}
                            </RadioGroup>
                        )}

                        {msg.pollData.pollType === 'shortAnswer' && (
                             user?.role === 'Student' ? (
                                msg.pollData.voters?.[user.id] ? (
                                    <div className="p-2 bg-background/50 rounded text-sm">
                                        <p className="font-medium">Your Answer:</p>
                                        <p className="italic">"{msg.pollData.voters[user.id]}"</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Textarea 
                                            placeholder="Type your answer..."
                                            value={shortAnswerSubmissions[msg.id] || ''}
                                            onChange={(e) => handleShortAnswerChange(msg.id, e.target.value)}
                                            disabled={isSending}
                                            className="text-sm"
                                        />
                                        <Button 
                                            size="sm" 
                                            onClick={() => handleVoteOrSubmitAnswer(msg.id, shortAnswerSubmissions[msg.id] || '')}
                                            disabled={isSending || !(shortAnswerSubmissions[msg.id] || '').trim()}
                                        >
                                            {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Submit Answer
                                        </Button>
                                    </div>
                                )
                            ) : ( 
                                <div className="text-sm">
                                    <p className="font-medium">Student Responses:</p>
                                    {Object.keys(msg.pollData.voters || {}).length > 0 ? (
                                        <ul className="list-disc list-inside pl-2 mt-1 max-h-32 overflow-y-auto text-xs space-y-0.5">
                                            {Object.entries(msg.pollData.voters || {}).map(([voterId, answer]) => {
                                                const voterUser = messages.find(m => m.senderId === voterId && m.type !== 'poll') || 
                                                                 groupSenders.find(s => s.id === voterId); 
                                                const voterName = voterUser ? voterUser.name : (messages.find(m => m.senderId === voterId)?.senderName || `User ${voterId.substring(0,5)}`);
                                                return (
                                                    <li key={voterId}><strong>{voterName}:</strong> "{answer}"</li>
                                                );
                                            })}
                                        </ul>
                                    ) : <p className="text-xs text-muted-foreground/80 italic">No responses yet.</p>}
                                    <p className="text-xs mt-1 text-muted-foreground/80">{Object.keys(msg.pollData.voters || {}).length} response(s) received.</p>
                                </div>
                            )
                        )}
                        
                        {canUseSpecialFeatures && msg.pollData.studentAnswersHidden && !msg.pollData.resultsPublished && (
                            <Button size="sm" variant="secondary" className="mt-2 h-7 text-xs" onClick={() => handleOpenPublishDialog(msg)} disabled={isSending}>
                                {isSending ? <Loader2 className="h-3 w-3 animate-spin mr-1"/> : <Eye className="h-3 w-3 mr-1"/> } Publish Results
                            </Button>
                        )}
                        {canUseSpecialFeatures && msg.pollData.resultsPublished && (
                             <p className="text-xs mt-2 text-success flex items-center gap-1"><CheckCircle className="h-3 w-3"/> Results Published</p>
                        )}
                    </div>
                )}

                {msg.type === 'event' && msg.eventData && (
                    <div className="space-y-1">
                        <p className="text-sm font-semibold flex items-center gap-1.5"><CalendarDays className="h-4 w-4"/> {msg.eventData.title}</p>
                        {msg.eventData.description && <p className="text-xs text-muted-foreground/80">{msg.eventData.description}</p>}
                        <p className="text-xs">Date: {format(new Date(msg.eventData.dateTime), "PPP p")}</p>
                        {msg.eventData.location && <p className="text-xs">Location: {msg.eventData.location}</p>}
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
        </div>
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

      {pollToPublish && (
        <PublishPollResultDialog
            pollMessage={pollToPublish}
            isOpen={!!pollToPublish}
            onClose={() => setPollToPublish(null)}
            onConfirmPublish={handleConfirmPublishResults}
            isPublishing={isSending}
        />
      )}
    </div>
  );
}


interface CreatePollDialogProps {
  onSendPoll: (input: NewPollMessageInput) => void;
  disabled?: boolean;
}
function CreatePollDialog({ onSendPoll, disabled }: CreatePollDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [question, setQuestion] = React.useState('');
  const [pollType, setPollType] = React.useState<'mcq' | 'shortAnswer'>('mcq');
  const [options, setOptions] = React.useState<PollOption[]>([{ id: `opt-${Date.now()}`, text: '' }]);
  const [studentAnswersHidden, setStudentAnswersHidden] = React.useState(false);
  const { toast } = useToast(); 

  const handleAddOption = () => setOptions([...options, { id: `opt-${Date.now()}-${options.length}`, text: '' }]);
  const handleRemoveOption = (id: string) => setOptions(options.filter(opt => opt.id !== id));
  const handleOptionChange = (id: string, text: string) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, text } : opt));
  };

  const handleSubmit = () => {
    if (!question.trim()) {
      toast({ title: "Invalid Poll", description: "Poll question is required.", variant: "destructive" });
      return;
    }
    if (pollType === 'mcq' && (options.some(opt => !opt.text.trim()) || options.length < 2)) {
      toast({ title: "Invalid Poll", description: "For MCQ, at least two options are required and they cannot be empty.", variant: "destructive" });
      return;
    }

    const pollData: Omit<PollData, 'results' | 'voters' | 'resultsPublished' | 'correctOptionId'> = {
        question,
        pollType,
        studentAnswersHidden,
        options: pollType === 'mcq' ? options.filter(opt => opt.text.trim()) : undefined,
    };
    
    onSendPoll({
      type: 'poll',
      content: question, 
      pollData,
    });
    setIsOpen(false);
    setQuestion('');
    setPollType('mcq');
    setOptions([{ id: `opt-${Date.now()}`, text: '' }]);
    setStudentAnswersHidden(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="Create poll" disabled={disabled}><ListChecks className="h-5 w-5" /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Poll</DialogTitle>
          <DialogDescription>Ask a question and configure poll type and options.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="poll-question" className="text-right col-span-1">Question</Label>
            <Input id="poll-question" value={question} onChange={(e) => setQuestion(e.target.value)} className="col-span-3" placeholder="What's your question?"/>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right col-span-1">Poll Type</Label>
            <RadioGroup value={pollType} onValueChange={(value) => setPollType(value as 'mcq' | 'shortAnswer')} className="col-span-3 flex gap-4">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mcq" id="poll-type-mcq"/>
                    <Label htmlFor="poll-type-mcq">Multiple Choice</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="shortAnswer" id="poll-type-sa"/>
                    <Label htmlFor="poll-type-sa">Short Answer</Label>
                </div>
            </RadioGroup>
          </div>

          {pollType === 'mcq' && options.map((option, index) => (
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
          {pollType === 'mcq' && (
            <Button type="button" variant="outline" onClick={handleAddOption} className="mt-2 justify-self-start ml-auto mr-auto w-full sm:w-auto col-span-4 sm:col-start-2">
                <PlusCircle className="mr-2 h-4 w-4"/> Add Option
            </Button>
          )}
          
          <div className="flex items-center space-x-2 mt-2 col-span-4">
            <Checkbox id="hide-answers" checked={studentAnswersHidden} onCheckedChange={(checked) => setStudentAnswersHidden(checked as boolean)} />
            <Label htmlFor="hide-answers" className="text-sm font-normal cursor-pointer">
                Hide answers from students until published
            </Label>
          </div>

        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="button" onClick={handleSubmit}>Create Poll</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
  const { toast } = useToast(); 

  const handleSubmit = () => {
    if (!title.trim() || !dateTime) {
        toast({ title: "Invalid Event", description: "Event title and date/time are required.", variant: "destructive" });
        return;
    }
    onSendEvent({
      type: 'event',
      content: title, 
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

interface PublishPollResultDialogProps {
    pollMessage: Message;
    isOpen: boolean;
    onClose: () => void;
    onConfirmPublish: (messageId: string, correctOptionId?: string) => void;
    isPublishing: boolean;
}

function PublishPollResultDialog({ pollMessage, isOpen, onClose, onConfirmPublish, isPublishing }: PublishPollResultDialogProps) {
    const [selectedCorrectOptionId, setSelectedCorrectOptionId] = React.useState<string | undefined>(pollMessage.pollData?.correctOptionId);
    const { toast } = useToast(); 


    React.useEffect(() => { 
        setSelectedCorrectOptionId(pollMessage.pollData?.correctOptionId);
    }, [isOpen, pollMessage.pollData?.correctOptionId]);


    if (pollMessage.type !== 'poll' || !pollMessage.pollData || pollMessage.pollData.pollType !== 'mcq') {
        return null; 
    }

    const { question, options = [] } = pollMessage.pollData;

    const handleConfirm = () => {
        if (!selectedCorrectOptionId) {
            toast({title: "Selection Required", description: "Please select the correct answer before publishing.", variant: "destructive"});
            return;
        }
        onConfirmPublish(pollMessage.id, selectedCorrectOptionId);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Publish Poll Results &amp; Mark Correct Answer</DialogTitle>
                    <DialogDescription>
                        Select the correct answer for the poll: "{question}". This will be highlighted for students.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-3">
                    <Label>Select Correct Option:</Label>
                    <RadioGroup
                        value={selectedCorrectOptionId}
                        onValueChange={setSelectedCorrectOptionId}
                        className="space-y-1.5"
                    >
                        {options.map(option => (
                            <div key={option.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.id} id={`publish-correct-${option.id}`} />
                                <Label htmlFor={`publish-correct-${option.id}`} className="text-sm flex-1 cursor-pointer">{option.text}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                     {!selectedCorrectOptionId && (
                        <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Please select an option as correct.</p>
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose} disabled={isPublishing}>Cancel</Button>
                    <Button type="button" onClick={handleConfirm} disabled={isPublishing || !selectedCorrectOptionId}>
                        {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirm &amp; Publish
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


    

