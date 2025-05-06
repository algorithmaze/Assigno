

'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChatInterface } from "@/components/chat/chat-interface";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchGroupDetails, type Group, addMembersToGroup, removeMemberFromGroup, deleteGroup } from '@/services/groups';
import { fetchUsersByIds, searchUsers } from '@/services/users';
import type { User } from '@/context/auth-context';
import { useAuth } from '@/context/auth-context';
import { Loader2, UserPlus, Trash2, X, Settings, Copy, AlertTriangle, Search as SearchIcon } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input'; // Added Input for search
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
  const [manageMembersSearchTerm, setManageMembersSearchTerm] = React.useState('');
  const [isSearchingAvailableUsers, setIsSearchingAvailableUsers] = React.useState(false);
  const [availableUsers, setAvailableUsers] = React.useState<User[]>([]);
  const [membersToAdd, setMembersToAdd] = React.useState<User[]>([]);
  const [isUpdatingMembers, setIsUpdatingMembers] = React.useState(false);
  
  const [isDeleteConfirm1Open, setIsDeleteConfirm1Open] = React.useState(false);
  const [isDeleteConfirm2Open, setIsDeleteConfirm2Open] = React.useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = React.useState(false);


  const loadGroupAndMembers = React.useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
         const fetchedGroup = await fetchGroupDetails(groupId);
         if (fetchedGroup) {
             setGroup(fetchedGroup);
             const memberIds = [...new Set([...fetchedGroup.teacherIds, ...fetchedGroup.studentIds])];
             if (memberIds.length > 0) {
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

  // Fetch available users based on search term
  const loadAvailableUsers = React.useCallback(async (searchTerm: string) => {
    if (!currentUser || !group || !currentUser.schoolCode) return;
    setIsSearchingAvailableUsers(true);
    try {
      const excludeIds = [...members.map(m => m.id), ...membersToAdd.map(m => m.id)];
      if(currentUser.id) excludeIds.push(currentUser.id);

      const searchedUsers = await searchUsers(currentUser.schoolCode, searchTerm, excludeIds);
      setAvailableUsers(searchedUsers);
    } catch (err) {
      toast({ title: "Error", description: "Could not load available users.", variant: "destructive" });
      setAvailableUsers([]);
    } finally {
      setIsSearchingAvailableUsers(false);
    }
  }, [currentUser, group, members, membersToAdd, toast]);

  // Effect to load users when dialog opens or search term changes (with debounce)
  React.useEffect(() => {
    if (isManageMembersOpen && group) {
      const timerId = setTimeout(() => {
        loadAvailableUsers(manageMembersSearchTerm);
      }, 300); // Debounce search
      return () => clearTimeout(timerId);
    } else {
      setAvailableUsers([]); 
      setManageMembersSearchTerm(''); 
    }
  }, [isManageMembersOpen, group, manageMembersSearchTerm, loadAvailableUsers]);


   const addMemberToStaging = (userToAdd: User) => {
     setMembersToAdd(prev => [...prev, userToAdd]);
     setAvailableUsers(prev => prev.filter(u => u.id !== userToAdd.id)); 
   };

    const removeMemberFromStaging = (userToRemove: User) => {
      setMembersToAdd(prev => prev.filter(u => u.id !== userToRemove.id));
      // Add back to available users (if search term matches or no search term)
      // For simplicity, just reload available users based on current search term
      loadAvailableUsers(manageMembersSearchTerm);
    };

   const handleSaveMembers = async () => {
     if (!group || membersToAdd.length === 0) return;
     setIsUpdatingMembers(true);
     try {
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
            const success = await removeMemberFromGroup(groupId, memberIdToRemove);
            if (success) {
                toast({ title: "Member Removed", description: `Member removed successfully.` });
                await loadGroupAndMembers(); // Refresh current members
                setMembersToAdd(prev => prev.filter(u => u.id !== memberIdToRemove)); // Remove from staging if present
                if(isManageMembersOpen) loadAvailableUsers(manageMembersSearchTerm); // Refresh available users list based on search
            } else { throw new Error("Failed to remove member via service."); }
        } catch (error) {
            toast({ title: "Error", description: "Failed to remove member.", variant: "destructive" });
        } finally {
            setIsUpdatingMembers(false);
        }
    };

    const resetManageMembersDialog = () => {
        setAvailableUsers([]);
        setMembersToAdd([]);
        setManageMembersSearchTerm('');
        setIsSearchingAvailableUsers(false);
        setIsUpdatingMembers(false);
    };

    const canManageGroup = currentUser && group && (currentUser.role === 'Admin' || group.teacherIds.includes(currentUser.id));
    const isAdminUser = currentUser?.role === 'Admin';

    const handleDeleteGroup = async () => {
        if (!group || !currentUser || currentUser.role !== 'Admin') {
            toast({ title: "Unauthorized", description: "You do not have permission to delete this group.", variant: "destructive" });
            return;
        }
        setIsDeletingGroup(true);
        try {
            const success = await deleteGroup(groupId, currentUser.id, currentUser.schoolCode);
            if (success) {
                toast({ title: "Group Deleted", description: `Group "${group.name}" has been permanently deleted.` });
                router.replace('/groups');
            } else {
                toast({ title: "Deletion Failed", description: "Could not delete the group. It might have already been removed or an error occurred.", variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error Deleting Group", description: error.message || "An unexpected error occurred.", variant: "destructive" });
        } finally {
            setIsDeletingGroup(false);
            setIsDeleteConfirm1Open(false);
            setIsDeleteConfirm2Open(false);
        }
    };


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
                    {isAdminUser && (
                        <AlertDialog open={isDeleteConfirm1Open} onOpenChange={setIsDeleteConfirm1Open}>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={isDeletingGroup}>
                                    {isDeletingGroup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                    Delete Group
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-destructive" /> Are you sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will permanently delete the group "{group.name}". This cannot be undone.
                                        All associated messages and data will be lost.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setIsDeleteConfirm1Open(false)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-destructive hover:bg-destructive/90"
                                        onClick={() => {
                                            setIsDeleteConfirm1Open(false);
                                            setIsDeleteConfirm2Open(true);
                                        }}
                                    >
                                        Yes, I understand the consequences
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    {/* Second confirmation dialog */}
                    <AlertDialog open={isDeleteConfirm2Open} onOpenChange={setIsDeleteConfirm2Open}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                     <AlertTriangle className="h-5 w-5 text-destructive" /> Final Confirmation
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    You are about to permanently delete the group "{group.name}". 
                                    <strong className="text-destructive"> This is your final warning. This action is irreversible.</strong> Are you absolutely sure you want to proceed?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setIsDeleteConfirm2Open(false)} disabled={isDeletingGroup}>
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive hover:bg-destructive/90"
                                    onClick={handleDeleteGroup}
                                    disabled={isDeletingGroup}
                                >
                                    {isDeletingGroup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Yes, delete this group permanently
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>


                    {canManageGroup && (
                        <Dialog open={isManageMembersOpen} onOpenChange={(open) => {
                            setIsManageMembersOpen(open);
                            if (!open) resetManageMembersDialog();
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
                                        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                        type="search"
                                        placeholder="Search users by name or email..."
                                        value={manageMembersSearchTerm}
                                        onChange={(e) => setManageMembersSearchTerm(e.target.value)}
                                        className="pl-8 w-full"
                                        />
                                    </div>
                                    <ScrollArea className="h-[150px] border rounded-md">
                                        <div className="p-2 space-y-1">
                                            {isSearchingAvailableUsers && <div className="text-center text-muted-foreground p-2"><Loader2 className="h-4 w-4 animate-spin inline mr-2"/>Loading available users...</div>}
                                            {!isSearchingAvailableUsers && availableUsers.length === 0 && <div className="text-center text-muted-foreground p-2 text-sm">{manageMembersSearchTerm ? 'No users found matching your search.' : 'Type to search for users to add.'}</div>}
                                            {availableUsers.map(userRes => (
                                                <div key={userRes.id} className="flex items-center justify-between p-1 rounded hover:bg-muted text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6"><AvatarImage src={userRes.profilePictureUrl || `https://picsum.photos/30/30?random=${userRes.id}`} data-ai-hint="user avatar"/><AvatarFallback>{userRes.name.charAt(0)}</AvatarFallback></Avatar>
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
                                                        <Avatar className="h-6 w-6"><AvatarImage src={member.profilePictureUrl || `https://picsum.photos/30/30?random=${member.id}`} data-ai-hint="member avatar"/><AvatarFallback>{member.name.charAt(0)}</AvatarFallback></Avatar>
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

