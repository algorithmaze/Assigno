
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip, Smile, Send, MessageSquareIcon, Loader2, Search, Filter, CalendarDays, ListChecks, FileText, CheckSquare, Trash2, PlusCircle, Eye, EyeOff, CheckCircle, AlertTriangle, CalendarIcon, XCircle, Edit2 } from 'lucide-react';
import { useAuth, type User as AuthUserType } from '@/context/auth-context';
import { getGroupMessages, addMessageToGroup, type Message, type NewMessageInput, type PollData, type EventData, type FileData, voteOnPoll, type PollOption, type PollQuestion, NewPollMessageInput, NewEventMessageInput, NewFileMessageInput, publishPollResults } from '@/services/messages';
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
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';


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
  const [shortAnswerSubmissions, setShortAnswerSubmissions] = React.useState<Record<string, Record<string, string>>>({}); // { [messageId]: { [questionId]: answer } }
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

  const handleVoteOrSubmitAnswer = async (messageId: string, questionId: string, submission: string) => {
    if (!user) return;
    setIsSending(true); 
    try {
      const updatedPollMessage = await voteOnPoll(groupId, messageId, questionId, submission, user.id);
      if (updatedPollMessage) {
        setMessages(prev => prev.map(msg => msg.id === messageId ? updatedPollMessage : msg));
        const pollQuestion = updatedPollMessage.pollData?.questions.find(q => q.id === questionId);
        const pollType = pollQuestion?.pollType;
        toast({ title: pollType === 'mcq' ? "Vote Cast" : "Answer Submitted", description: `Your ${pollType === 'mcq' ? 'vote' : 'answer'} has been recorded for question: "${pollQuestion?.questionText}".` });
        if (pollType === 'shortAnswer') {
            setShortAnswerSubmissions(prev => ({
                ...prev,
                [messageId]: { ...(prev[messageId] || {}), [questionId]: '' }
            })); 
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
    if (message.type === 'poll' && message.pollData) { // Any poll type can be published
        setPollToPublish(message);
    }
  };

  const handleConfirmPublishResults = async (messageId: string, correctAnswers: Record<string, string>) => {
    if(!user || (user.role !== 'Teacher' && user.role !== 'Admin')) return;
    setIsSending(true);
    try {
        const updatedPollMessage = await publishPollResults(groupId, messageId, user.id, correctAnswers);
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
            else if (msg.type === 'poll' && msg.pollData) {
                contentToSearch = msg.pollData.title;
                msg.pollData.questions.forEach(q => contentToSearch += ` ${q.questionText}`);
            }
            else if (msg.type === 'event' && msg.eventData) contentToSearch = msg.eventData.title;

            const contentMatch = contentToSearch.toLowerCase().includes(searchTermLower);
            const senderNameMatch = msg.senderName.toLowerCase().includes(searchTermLower);
            const searchMatch = searchTerm.trim() === '' || contentMatch || senderNameMatch;

            return typeMatch && senderMatch && dateMatch && searchMatch;
        }).sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime()); 
    }, [messages, searchTerm, filterMessageType, filterSenderId, filterDate]);

    const handleShortAnswerChange = (messageId: string, questionId: string, value: string) => {
      setShortAnswerSubmissions(prev => ({
          ...prev,
          [messageId]: {
              ...(prev[messageId] || {}),
              [questionId]: value
          }
      }));
    };


  return (
    <div className="flex h-full flex-col bg-card border rounded-lg shadow-md overflow-hidden">
      <div className="p-2 sm:p-3 border-b bg-background sticky top-0 z-10">
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-grow min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
                <Input
                    type="search"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full h-9"
                />
            </div>
            
            <div className="min-w-[150px]">
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
            
            <div className="min-w-[180px]">
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
            <div className="min-w-[180px]">
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
                        <p className="text-lg font-bold mb-2">{msg.pollData.title}</p>
                        {msg.pollData.questions.map((question, qIndex) => {
                            const hasVotedOrSubmitted = !!msg.pollData?.voters?.[question.id]?.[user?.id || ''];
                            const isResultsViewable = (user?.role !== 'Student' && !msg.pollData?.studentAnswersHidden) || msg.pollData?.resultsPublished;

                            return (
                            <Card key={question.id} className="p-3 bg-background/10">
                                <CardHeader className="p-0 pb-2">
                                   <p className="text-sm font-semibold">{qIndex + 1}. {question.questionText}</p>
                                </CardHeader>
                                <CardContent className="p-0">
                                {question.pollType === 'mcq' && question.options && (
                                    <RadioGroup
                                        value={msg.pollData?.voters?.[question.id]?.[user?.id || ''] || ''}
                                        onValueChange={(optionId) => handleVoteOrSubmitAnswer(msg.id, question.id, optionId)}
                                        className="space-y-1.5"
                                        disabled={isSending || hasVotedOrSubmitted || msg.pollData?.resultsPublished}
                                    >
                                        {question.options.map(option => {
                                            const questionResults = msg.pollData?.results?.[question.id] as Record<string, number> | undefined;
                                            const totalVotes = questionResults ? Object.values(questionResults).reduce((sum, count) => sum + count, 0) : 0;
                                            const optionVotes = questionResults?.[option.id] || 0;
                                            const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
                                            
                                            const isCorrect = msg.pollData?.resultsPublished && question.correctOptionId === option.id;
                                            const isSelected = msg.pollData?.voters?.[question.id]?.[user?.id || ''] === option.id;
                                            const isIncorrectSelected = msg.pollData?.resultsPublished && question.correctOptionId && question.correctOptionId !== option.id && isSelected;
                                            
                                            let optionStyleClasses = "p-1.5 rounded-md";
                                            if(isCorrect) optionStyleClasses += " bg-success text-success-foreground";
                                            else if(isIncorrectSelected) optionStyleClasses += " bg-destructive text-destructive-foreground";
                                            else if(msg.pollData?.resultsPublished && isSelected && !isCorrect) optionStyleClasses += " bg-muted"; 
                                            
                                            return (
                                                <div key={option.id} className={optionStyleClasses}>
                                                    <div className="flex items-center space-x-2 mb-0.5">
                                                        <RadioGroupItem value={option.id} id={`${msg.id}-${question.id}-${option.id}`} disabled={isSending || hasVotedOrSubmitted || msg.pollData?.resultsPublished}/>
                                                        <Label htmlFor={`${msg.id}-${question.id}-${option.id}`} className="text-sm flex-1 cursor-pointer">{option.text}</Label>
                                                        {isResultsViewable && <span className="text-xs opacity-80">{optionVotes} vote(s)</span>}
                                                    </div>
                                                    {isResultsViewable && <Progress value={percentage} className="h-1.5"/>}
                                                </div>
                                            );
                                        })}
                                    </RadioGroup>
                                )}

                                {question.pollType === 'shortAnswer' && (
                                    user?.role === 'Student' ? (
                                        hasVotedOrSubmitted ? (
                                            <div className="p-2 bg-background/50 rounded text-sm">
                                                <p className="font-medium">Your Answer:</p>
                                                <p className="italic">"{msg.pollData?.voters?.[question.id]?.[user.id]}"</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Textarea 
                                                    placeholder="Type your answer..."
                                                    value={shortAnswerSubmissions[msg.id]?.[question.id] || ''}
                                                    onChange={(e) => handleShortAnswerChange(msg.id, question.id, e.target.value)}
                                                    disabled={isSending}
                                                    className="text-sm"
                                                />
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => handleVoteOrSubmitAnswer(msg.id, question.id, shortAnswerSubmissions[msg.id]?.[question.id] || '')}
                                                    disabled={isSending || !(shortAnswerSubmissions[msg.id]?.[question.id] || '').trim()}
                                                >
                                                    {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Submit Answer
                                                </Button>
                                            </div>
                                        )
                                    ) : ( 
                                        <div className="text-sm">
                                            <p className="font-medium">Student Responses:</p>
                                            {(msg.pollData?.voters?.[question.id] && Object.keys(msg.pollData.voters[question.id]).length > 0) ? (
                                                <ul className="list-disc list-inside pl-2 mt-1 max-h-32 overflow-y-auto text-xs space-y-0.5">
                                                    {Object.entries(msg.pollData.voters[question.id] || {}).map(([voterId, answer]) => {
                                                        const voterUser = messages.find(m => m.senderId === voterId && m.type !== 'poll') || 
                                                                         groupSenders.find(s => s.id === voterId); 
                                                        const voterName = voterUser ? voterUser.name : (messages.find(m => m.senderId === voterId)?.senderName || `User ${voterId.substring(0,5)}`);
                                                        return (
                                                            <li key={voterId}><strong>{voterName}:</strong> "{answer}"</li>
                                                        );
                                                    })}
                                                </ul>
                                            ) : <p className="text-xs text-muted-foreground/80 italic">No responses yet for this question.</p>}
                                            <p className="text-xs mt-1 text-muted-foreground/80">
                                                {(msg.pollData?.voters?.[question.id] && Object.keys(msg.pollData.voters[question.id]).length) || 0} response(s) received.
                                            </p>
                                        </div>
                                    )
                                )}
                                </CardContent>
                            </Card>
                            );
                        })}
                        
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
const MAX_POLL_QUESTIONS = 5;

function CreatePollDialog({ onSendPoll, disabled }: CreatePollDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [pollTitle, setPollTitle] = React.useState('');
  const [questions, setQuestions] = React.useState<PollQuestion[]>([
    { id: `q-${Date.now()}`, questionText: '', pollType: 'mcq', options: [{ id: `opt-${Date.now()}-0`, text: '' }] }
  ]);
  const [studentAnswersHidden, setStudentAnswersHidden] = React.useState(false);
  const { toast } = useToast(); 

  const addQuestion = () => {
    if (questions.length < MAX_POLL_QUESTIONS) {
      setQuestions([
        ...questions, 
        { id: `q-${Date.now()}-${questions.length}`, questionText: '', pollType: 'mcq', options: [{ id: `opt-${Date.now()}-${questions.length}-0`, text: '' }] }
      ]);
    } else {
      toast({ title: "Limit Reached", description: `You can add a maximum of ${MAX_POLL_QUESTIONS} questions.`, variant: "default" });
    }
  };
  const removeQuestion = (questionId: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== questionId));
    } else {
      toast({ title: "Cannot Remove", description: "A poll must have at least one question.", variant: "default"});
    }
  };
  const updateQuestion = (questionId: string, field: keyof PollQuestion, value: any) => {
    setQuestions(questions.map(q => q.id === questionId ? { ...q, [field]: value } : q));
  };
  const addOptionToQuestion = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.pollType === 'mcq' && q.options) {
        return { ...q, options: [...q.options, { id: `opt-${Date.now()}-${q.id}-${q.options.length}`, text: '' }] };
      }
      return q;
    }));
  };
  const removeOptionFromQuestion = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.pollType === 'mcq' && q.options && q.options.length > 1) {
        return { ...q, options: q.options.filter(opt => opt.id !== optionId) };
      } else if (q.id === questionId && q.pollType === 'mcq' && q.options && q.options.length <=1) {
        toast({title: "Cannot Remove", description: "An MCQ question must have at least one option.", variant: "default"});
      }
      return q;
    }));
  };
  const updateOptionInQuestion = (questionId: string, optionId: string, text: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.pollType === 'mcq' && q.options) {
        return { ...q, options: q.options.map(opt => opt.id === optionId ? { ...opt, text } : opt) };
      }
      return q;
    }));
  };

  const handleSubmit = () => {
    if (!pollTitle.trim()) {
      toast({ title: "Invalid Poll", description: "Poll title is required.", variant: "destructive" });
      return;
    }
    for (const q of questions) {
        if (!q.questionText.trim()) {
            toast({ title: "Invalid Poll", description: `Question ${questions.indexOf(q) + 1} text cannot be empty.`, variant: "destructive" });
            return;
        }
        if (q.pollType === 'mcq' && (!q.options || q.options.length < 1 || q.options.some(opt => !opt.text.trim()))) {
             toast({ title: "Invalid Poll", description: `MCQ Question ${questions.indexOf(q) + 1} must have at least one non-empty option.`, variant: "destructive" });
            return;
        }
    }

    const pollData: Omit<PollData, 'results' | 'voters' | 'resultsPublished'> = {
        title: pollTitle,
        questions: questions.map(q => ({
            id: q.id,
            questionText: q.questionText,
            pollType: q.pollType,
            options: q.pollType === 'mcq' ? q.options?.filter(opt => opt.text.trim()) : undefined,
        })),
        studentAnswersHidden,
    };
    
    onSendPoll({
      type: 'poll',
      content: pollTitle, // Main title for the message content
      pollData,
    });
    setIsOpen(false);
    setPollTitle('');
    setQuestions([{ id: `q-${Date.now()}`, questionText: '', pollType: 'mcq', options: [{ id: `opt-${Date.now()}-0`, text: '' }] }]);
    setStudentAnswersHidden(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="Create poll" disabled={disabled}><ListChecks className="h-5 w-5" /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Poll / Quiz</DialogTitle>
          <DialogDescription>Craft a multi-question poll, similar to Google Forms.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-2">
        <div className="grid gap-6 py-4 ">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="poll-main-title" className="text-right col-span-1">Poll Title</Label>
            <Input id="poll-main-title" value={pollTitle} onChange={(e) => setPollTitle(e.target.value)} className="col-span-3" placeholder="e.g., Weekly Quiz, Feedback Survey"/>
          </div>
          
          {questions.map((q, qIndex) => (
            <Card key={q.id} className="p-4 space-y-3 bg-muted/30">
              <div className="flex justify-between items-center">
                <Label className="text-md font-semibold">Question {qIndex + 1}</Label>
                {questions.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(q.id)} aria-label="Remove question">
                        <Trash2 className="h-4 w-4 text-destructive"/>
                    </Button>
                )}
              </div>
              <Textarea 
                id={`q-${q.id}-text`} 
                value={q.questionText} 
                onChange={(e) => updateQuestion(q.id, 'questionText', e.target.value)} 
                placeholder="Type your question here..."
                className="bg-background"
              />
              <RadioGroup 
                value={q.pollType} 
                onValueChange={(value) => updateQuestion(q.id, 'pollType', value as 'mcq' | 'shortAnswer')} 
                className="flex gap-4 py-1"
              >
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mcq" id={`q-${q.id}-type-mcq`}/>
                      <Label htmlFor={`q-${q.id}-type-mcq`}>Multiple Choice</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="shortAnswer" id={`q-${q.id}-type-sa`}/>
                      <Label htmlFor={`q-${q.id}-type-sa`}>Short Answer</Label>
                  </div>
              </RadioGroup>

              {q.pollType === 'mcq' && (
                <div className="space-y-2 pl-2 border-l-2 border-primary/20">
                    {q.options?.map((option, optIndex) => (
                        <div key={option.id} className="flex items-center gap-2">
                            <Input 
                                id={`q-${q.id}-opt-${option.id}`} 
                                value={option.text} 
                                onChange={(e) => updateOptionInQuestion(q.id, option.id, e.target.value)} 
                                placeholder={`Option ${optIndex + 1}`}
                                className="flex-grow bg-background"
                            />
                            { (q.options?.length || 0) > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeOptionFromQuestion(q.id, option.id)} aria-label="Remove option">
                                <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive"/>
                            </Button>
                            )}
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addOptionToQuestion(q.id)} className="mt-1">
                        <PlusCircle className="mr-2 h-4 w-4"/> Add Option
                    </Button>
                </div>
              )}
            </Card>
          ))}

          {questions.length < MAX_POLL_QUESTIONS && (
            <Button type="button" variant="outline" onClick={addQuestion} className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4"/> Add Another Question
            </Button>
          )}
          
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox id="hide-answers" checked={studentAnswersHidden} onCheckedChange={(checked) => setStudentAnswersHidden(checked as boolean)} />
            <Label htmlFor="hide-answers" className="text-sm font-normal cursor-pointer">
                Hide answers from students until results are published
            </Label>
          </div>
        </div>
        </ScrollArea>
        <DialogFooter className="mt-auto pt-4 border-t">
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
    onConfirmPublish: (messageId: string, correctAnswers: Record<string, string>) => void;
    isPublishing: boolean;
}

function PublishPollResultDialog({ pollMessage, isOpen, onClose, onConfirmPublish, isPublishing }: PublishPollResultDialogProps) {
    const [correctAnswers, setCorrectAnswers] = React.useState<Record<string, string>>({});
    const { toast } = useToast(); 

    React.useEffect(() => { 
        if (isOpen && pollMessage.pollData) {
            const initialCorrect: Record<string, string> = {};
            pollMessage.pollData.questions.forEach(q => {
                if (q.correctOptionId) {
                    initialCorrect[q.id] = q.correctOptionId;
                }
            });
            setCorrectAnswers(initialCorrect);
        }
    }, [isOpen, pollMessage]);


    if (pollMessage.type !== 'poll' || !pollMessage.pollData) {
        return null; 
    }

    const { title, questions = [] } = pollMessage.pollData;

    const handleCorrectOptionChange = (questionId: string, optionId: string) => {
        setCorrectAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const handleConfirm = () => {
        // For MCQs, ensure a correct answer is selected if the question is MCQ type
        for (const q of questions) {
            if (q.pollType === 'mcq' && !correctAnswers[q.id]) {
                 toast({title: "Selection Required", description: `Please select the correct answer for question: "${q.questionText}".`, variant: "destructive"});
                 return;
            }
        }
        onConfirmPublish(pollMessage.id, correctAnswers);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Publish Poll Results: {title}</DialogTitle>
                    <DialogDescription>
                        For Multiple Choice Questions, select the correct answer. This will be highlighted for students.
                        For Short Answer Questions, responses will become visible (if previously hidden).
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-grow pr-2">
                    <div className="py-4 space-y-4">
                        {questions.map((question, qIndex) => (
                            <Card key={question.id} className="p-3">
                                <CardHeader className="p-0 pb-2">
                                    <p className="text-sm font-medium">{qIndex + 1}. {question.questionText}</p>
                                </CardHeader>
                                <CardContent className="p-0">
                                {question.pollType === 'mcq' && question.options && (
                                    <>
                                        <Label className="text-xs text-muted-foreground">Select Correct Option:</Label>
                                        <RadioGroup
                                            value={correctAnswers[question.id]}
                                            onValueChange={(optionId) => handleCorrectOptionChange(question.id, optionId)}
                                            className="space-y-1 mt-1"
                                        >
                                            {question.options.map(option => (
                                                <div key={option.id} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option.id} id={`publish-correct-${question.id}-${option.id}`} />
                                                    <Label htmlFor={`publish-correct-${question.id}-${option.id}`} className="text-sm flex-1 cursor-pointer">{option.text}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                        {!correctAnswers[question.id] && (
                                            <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Please select one option as correct for this MCQ.</p>
                                        )}
                                    </>
                                )}
                                {question.pollType === 'shortAnswer' && (
                                    <p className="text-sm text-muted-foreground italic">Short answer responses will be shown/summarized upon publishing.</p>
                                )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
                <DialogFooter className="mt-auto pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isPublishing}>Cancel</Button>
                    <Button type="button" onClick={handleConfirm} disabled={isPublishing}>
                        {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirm &amp; Publish All
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
