
'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChatInterface } from "@/components/chat/chat-interface";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Removed deleteGroup from imports as groups should not be deleted
import { fetchGroupDetails, type Group, addMembersToGroup, removeMemberFromGroup } from '@/services/groups';
import { fetchUsersByIds, searchUsers } from '@/services/users';
import type { User } from '@/context/auth-context';
import { useAuth } from '@/context/auth-context';
import { Loader2, UserPlus, Trash2, Search, X, Settings, Copy } from 'lucide-react';
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
// AlertDialog related imports are removed as delete functionality is removed
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';


interface GroupDetailPageProps {
  params: { groupId: string };
}

export default function GroupDetailPage({ params }: GroupDetailPageProps) {
  const resolvedParams = React.use(params);
  const groupId = resolvedParams.groupId;

  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [group, setGroup] = React.useState<Group | null>(null);
  const [members, setMembers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [isManageMembersOpen, setIsManageMembersOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<User[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [membersToAdd, setMembersToAdd] = React.useState<User[]>([]);
  const [isUpdatingMembers, setIsUpdatingMembers] = React.useState(false);
  // isDeletingGroup state is removed as delete functionality is removed

  const loadGroupAndMembers = React.useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
         // TODO: Firebase - Replace with Firestore call
         const fetchedGroup = await fetchGroupDetails(groupId);
         if (fetchedGroup) {
             setGroup(fetchedGroup);
             const memberIds = [...new Set([...fetchedGroup.teacherIds, ...fetchedGroup.studentIds])];
             if (memberIds.length > 0) {
                // TODO: Firebase - Replace with Firestore call
                const fetchedMembers = await fetchUsersByIds(memberIds);
                setMembers(fetchedMembers);
             } else {
                 setMembers([]);
             }
         } else {
             console.error(`[GroupDetail] Group not found for ID: ${groupId}`);
             setError('Group not found.');
             setGroup(null);
             setMembers([]);
         }
     } catch (err) {
         console.error("[GroupDetail] Error fetching group details or members:", err);
         setError('Failed to load group details.');
     } finally {
         setLoading(false);
     }
   }, [groupId]);

  React.useEffect(() => {
    if (!groupId) {
        setLoading(false);
        setError("No group ID specified.");
        return;
    }
    loadGroupAndMembers();
  }, [groupId, loadGroupAndMembers]);

  const handleSearchUsers = React.useCallback(async (currentSearchTerm: string) => {
     if (!currentUser || !group || !currentUser.schoolCode) return;
     setIsSearching(true);
     try {
       const excludeIds = [...members.map(m => m.id), ...membersToAdd.map(m => m.id), currentUser.id];
       // TODO: Firebase - Replace with Firestore query
       const results = await searchUsers(currentUser.schoolCode, currentSearchTerm, excludeIds);
       setSearchResults(results);
     } catch (err) {
       toast({ title: "Search Error", description: "Could not search for users.", variant: "destructive" });
     } finally {
       setIsSearching(false);
     }
   }, [currentUser, group, members, membersToAdd, toast]);

   React.useEffect(() => {
     if (!isManageMembersOpen) {
        setSearchResults([]);
        setSearchTerm('');
        return;
     }
     const debounceTimer = setTimeout(() => {
        handleSearchUsers(searchTerm);
     }, searchTerm.trim().length === 0 && !isSearching ? 0 : 500);

     return () => clearTimeout(debounceTimer);
   }, [searchTerm, isManageMembersOpen, handleSearchUsers, isSearching]);


   const addMemberToStaging = (userToAdd: User) => {
     setMembersToAdd(prev => [...prev, userToAdd]);
     setSearchResults(prev => prev.filter(u => u.id !== userToAdd.id));
   };

    const removeMemberFromStaging = (userToRemove: User) => {
      setMembersToAdd(prev => prev.filter(u => u.id !== userToRemove.id));
      const currentSearchTermLower = searchTerm.trim().toLowerCase();
      const nameMatches = userToRemove.name.toLowerCase().includes(currentSearchTermLower);
      const emailMatches = userToRemove.email?.toLowerCase().includes(currentSearchTermLower) ?? false;

      if (currentSearchTermLower === '' || nameMatches || emailMatches) {
          if (!searchResults.some(u => u.id === userToRemove.id)) {
            setSearchResults(prev => [userToRemove, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
          }
      }
    };

   const handleSaveMembers = async () => {
     if (!group || membersToAdd.length === 0) return;
     setIsUpdatingMembers(true);
     try {
       // TODO: Firebase - Replace with Firestore update
       const success = await addMembersToGroup(groupId, membersToAdd);
       if (success) {
         toast({ title: "Members Added", description: `${membersToAdd.length} member(s) added successfully.` });
         resetManageMembersDialog();
         setIsManageMembersOpen(false);
         await loadGroupAndMembers();
       } else { throw new Error("Failed to add members via service."); }
     } catch (error) {
       toast({ title: "Error", description: "Failed to add members.", variant: "destructive" });
     } finally {
       setIsUpdatingMembers(false);
     }
   };

    const handleRemoveMember = async (memberIdToRemove: string) => {
        if (!group) return;
        const memberToRemove = members.find(m => m.id === memberIdToRemove);
        if (memberToRemove && (memberToRemove.role === 'Teacher' || memberToRemove.role === 'Admin')) {
            const teachersInGroup = members.filter(m => m.role === 'Teacher' || m.role === 'Admin');
            if (teachersInGroup.length === 1 && teachersInGroup[0].id === memberIdToRemove) {
                toast({ title: "Cannot Remove", description: "Cannot remove the last teacher/admin from the group.", variant: "destructive"});
                return;
            }
        }

        setIsUpdatingMembers(true);
        try {
            // TODO: Firebase - Replace with Firestore update
            const success = await removeMemberFromGroup(groupId, memberIdToRemove);
            if (success) {
                toast({ title: "Member Removed", description: `Member removed successfully.` });
                await loadGroupAndMembers();
                setMembersToAdd(prev => prev.filter(u => u.id !== memberIdToRemove));
                handleSearchUsers(searchTerm);
            } else { throw new Error("Failed to remove member via service."); }
        } catch (error) {
            toast({ title: "Error", description: "Failed to remove member.", variant: "destructive" });
        } finally {
            setIsUpdatingMembers(false);
        }
    };

    const resetManageMembersDialog = () => {
        setSearchTerm('');
        setSearchResults([]);
        setMembersToAdd([]);
        setIsSearching(false);
        setIsUpdatingMembers(false);
    };

    const canManageGroup = currentUser && group && (currentUser.role === 'Admin' || group.teacherIds.includes(currentUser.id));
    // const isAdminUser = currentUser?.role === 'Admin'; // No longer needed for delete button

    // handleDeleteGroup function is removed as groups should not be deleted.

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: "Copied!", description: "Group code copied to clipboard." });
        }, (err) => {
            toast({ title: "Copy Failed", description: "Could not copy code.", variant: "destructive"});
            console.error('Failed to copy: ', err);
        });
    };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-theme(spacing.24))]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading group...</span>
      </div>
    );
  }

  if (error) {
     return (
        <div className="flex flex-col justify-center items-center h-[calc(100vh-theme(spacing.24))] space-y-4">
            <Card className="p-6 bg-destructive/10 border-destructive shadow-lg max-w-md w-full">
                <CardHeader className="p-0 mb-2">
                   <CardTitle className="text-destructive text-center">{error}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 text-center">
                    <p>Please check the group ID or try again later.</p>
                    <Button onClick={() => router.push('/groups')} className="mt-4">Go to Groups</Button>
                </CardContent>
            </Card>
        </div>
     );
  }

   if (!group) {
      return (
        <div className="flex flex-col justify-center items-center h-[calc(100vh-theme(spacing.24))] space-y-4">
           <Card className="p-6 shadow-lg max-w-md w-full">
             <CardHeader className="p-0 mb-2"><CardTitle className="text-center">Group Not Found</CardTitle></CardHeader>
             <CardContent className="p-0 text-center">
               <p className="text-muted-foreground">The group data could not be loaded or it does not exist.</p>
               <Button onClick={() => router.push('/groups')} className="mt-4">Go to Groups</Button>
             </CardContent>
           </Card>
        </div>
      );
   }


  return (
    <div className="flex h-[calc(100vh-theme(spacing.24))] flex-col">
      <Card className="mb-4 flex-shrink-0 shadow-md">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                 <div>
                    <CardTitle className="text-2xl">{group.name || groupId}</CardTitle>
                    {group.description && <p className="text-sm text-muted-foreground mt-1">{group.description}</p>}
                    <div className="text-xs text-muted-foreground mt-2">
                        Teachers: {members.filter(m => m.role === 'Teacher' || m.role === 'Admin').length} | Students: {members.filter(m => m.role === 'Student').length}
                    </div>
                    {group.groupCode && (
                        <div className="mt-2 flex items-center gap-2">
                            <Badge variant="secondary">Code: {group.groupCode}</Badge>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(group.groupCode)}>
                                <Copy className="h-3 w-3" />
                                <span className="sr-only">Copy group code</span>
                            </Button>
                        </div>
                    )}
                 </div>
                 <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    {canManageGroup && (
                        <Link href={`/groups/${groupId}/settings`}>
                            <Button variant="outline" size="sm"><Settings className="mr-2 h-4 w-4" /> Group Settings</Button>
                        </Link>
                    )}
                    {/* Delete Group Button and AlertDialog removed as per requirement */}
                    {canManageGroup && (
                        <Dialog open={isManageMembersOpen} onOpenChange={(open) => {
                            setIsManageMembersOpen(open);
                            if (!open) resetManageMembersDialog();
                            else handleSearchUsers('');
                        }}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm"><UserPlus className="mr-2 h-4 w-4" /> Manage Members</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] flex flex-col max-h-[80vh]">
                                <DialogHeader>
                                    <DialogTitle>Manage Members for "{group.name}"</DialogTitle>
                                    <DialogDescription>
                                        Add or remove teachers and students.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2 pt-4">
                                    <h3 className="text-sm font-medium">Add New Members</h3>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search users by name or email..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                    <ScrollArea className="h-[150px] border rounded-md">
                                        <div className="p-2 space-y-1">
                                            {isSearching && <div className="text-center text-muted-foreground p-2"><Loader2 className="h-4 w-4 animate-spin inline mr-2"/>Searching...</div>}
                                            {!isSearching && searchResults.length === 0 && <div className="text-center text-muted-foreground p-2 text-sm">{searchTerm.trim() ? `No users found matching "${searchTerm}".` : "No other users available in this school or type to search."}</div>}
                                            {searchResults.map(userRes => (
                                                <div key={userRes.id} className="flex items-center justify-between p-1 rounded hover:bg-muted text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6"><AvatarImage src={userRes.profilePictureUrl} data-ai-hint="user avatar"/><AvatarFallback>{userRes.name.charAt(0)}</AvatarFallback></Avatar>
                                                        <span>{userRes.name} ({userRes.role})</span>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => addMemberToStaging(userRes)}><UserPlus className="h-4 w-4" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                    {membersToAdd.length > 0 && (
                                        <div className="space-y-1 pt-2">
                                            <h4 className="text-xs font-medium text-muted-foreground">To Add ({membersToAdd.length}):</h4>
                                            <div className="flex flex-wrap gap-1">
                                                {membersToAdd.map(userToAdd => (
                                                    <Badge key={userToAdd.id} variant="secondary" className="flex items-center gap-1">
                                                        {userToAdd.name}
                                                        <button onClick={() => removeMemberFromStaging(userToAdd)} className="ml-1 opacity-70 hover:opacity-100"><X className="h-3 w-3" /></button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2 pt-4 flex-1 min-h-0">
                                    <h3 className="text-sm font-medium">Current Members ({members.length})</h3>
                                    <ScrollArea className="h-[200px] border rounded-md">
                                        <div className="p-2 space-y-1">
                                            {members.length === 0 && <div className="text-center text-muted-foreground p-2 text-sm">No members yet.</div>}
                                            {members.map(member => (
                                                <div key={member.id} className="flex items-center justify-between p-1 rounded hover:bg-muted text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6"><AvatarImage src={member.profilePictureUrl} data-ai-hint="member avatar"/><AvatarFallback>{member.name.charAt(0)}</AvatarFallback></Avatar>
                                                        <span>{member.name} ({member.role})</span>
                                                        {(member.role === 'Teacher' || member.role === 'Admin') && <Badge variant="outline" size="sm" className="text-xs">{member.role === 'Admin' && group.teacherIds.includes(member.id) ? 'Admin Lead' : 'Teacher'}</Badge>}
                                                    </div>
                                                    {currentUser?.id !== member.id &&
                                                     !((member.role === 'Teacher' || member.role === 'Admin') && members.filter(m => m.role === 'Teacher' || m.role === 'Admin').length === 1 && group.teacherIds.includes(member.id)) &&
                                                      (
                                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleRemoveMember(member.id)} disabled={isUpdatingMembers}>
                                                            {isUpdatingMembers && <Loader2 className="h-4 w-4 animate-spin"/>}
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                                <DialogFooter className="pt-4">
                                    <DialogClose asChild><Button type="button" variant="outline" onClick={resetManageMembersDialog}>Cancel</Button></DialogClose>
                                    <Button type="button" onClick={handleSaveMembers} disabled={isUpdatingMembers || membersToAdd.length === 0}>
                                        {isUpdatingMembers && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add {membersToAdd.length} Member(s)
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>
          </CardHeader>
      </Card>
       <div className="flex-grow min-h-0">
         <ChatInterface groupId={groupId} />
       </div>
    </div>
  );
}
