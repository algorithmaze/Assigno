
'use client';

import * as React from 'react';
import { ChatInterface } from "@/components/chat/chat-interface";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchGroupDetails, type Group, addMembersToGroup, removeMemberFromGroup } from '@/services/groups'; // Import service
import { fetchUsersByIds, searchUsers } from '@/services/users'; // Import user services
import type { User } from '@/context/auth-context'; // Import User type
import { useAuth } from '@/context/auth-context'; // Import useAuth
import { Loader2, UserPlus, Trash2, Search, X } from 'lucide-react';
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
import { Input } from "@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';


interface GroupDetailPageProps {
  params: { groupId: string };
}

export default function GroupDetailPage({ params }: GroupDetailPageProps) {
  const groupId = React.use(Promise.resolve(params.groupId)); // Unwrap promise
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [group, setGroup] = React.useState<Group | null>(null);
  const [members, setMembers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // State for Manage Members Dialog
  const [isManageMembersOpen, setIsManageMembersOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<User[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [membersToAdd, setMembersToAdd] = React.useState<User[]>([]);
  const [isUpdatingMembers, setIsUpdatingMembers] = React.useState(false);


  const loadGroupAndMembers = React.useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
         const fetchedGroup = await fetchGroupDetails(groupId);
         if (fetchedGroup) {
             setGroup(fetchedGroup);
             // Fetch members based on IDs in the group
             const memberIds = [...fetchedGroup.teacherIds, ...fetchedGroup.studentIds];
             if (memberIds.length > 0) {
                const fetchedMembers = await fetchUsersByIds(memberIds);
                setMembers(fetchedMembers);
             } else {
                 setMembers([]);
             }
         } else {
             setError('Group not found.');
             setGroup(null);
             setMembers([]);
         }
     } catch (err) {
         console.error("Error fetching group details or members:", err);
         setError('Failed to load group details.');
         setGroup(null);
         setMembers([]);
     } finally {
         setLoading(false);
     }
   }, [groupId]);


  // Fetch group details and members on mount and when groupId changes
  React.useEffect(() => {
    if (!groupId) return;
    loadGroupAndMembers();
  }, [groupId, loadGroupAndMembers]);


  // --- Manage Members Logic ---

  const handleSearchUsers = React.useCallback(async () => {
     if (!searchTerm.trim() || !currentUser || !group) return;
     setIsSearching(true);
     try {
       // Exclude users already in the group or staged for adding
       const excludeIds = [...members.map(m => m.id), ...membersToAdd.map(m => m.id)];
       const results = await searchUsers(currentUser.schoolCode, searchTerm, excludeIds);
       setSearchResults(results);
     } catch (err) {
       console.error("Error searching users:", err);
       toast({ title: "Search Error", description: "Could not search for users.", variant: "destructive" });
     } finally {
       setIsSearching(false);
     }
   }, [searchTerm, currentUser, group, members, membersToAdd, toast]);

  // Trigger search when search term changes (debounced)
   React.useEffect(() => {
     const debounceTimer = setTimeout(() => {
       if (searchTerm.trim().length > 1) { // Only search if term is long enough
         handleSearchUsers();
       } else {
         setSearchResults([]); // Clear results if search term is short
       }
     }, 500); // 500ms debounce

     return () => clearTimeout(debounceTimer);
   }, [searchTerm, handleSearchUsers]);


   const addMemberToStaging = (userToAdd: User) => {
     setMembersToAdd(prev => [...prev, userToAdd]);
     setSearchResults(prev => prev.filter(u => u.id !== userToAdd.id)); // Remove from search results
   };

    const removeMemberFromStaging = (userToRemove: User) => {
      setMembersToAdd(prev => prev.filter(u => u.id !== userToRemove.id));
      // Optionally add back to search results if they match the current term
      if (searchTerm.trim() && (userToRemove.name.toLowerCase().includes(searchTerm.toLowerCase()) || userToRemove.email?.toLowerCase().includes(searchTerm.toLowerCase()))) {
          setSearchResults(prev => [userToRemove, ...prev]);
      }
    };

   const handleSaveMembers = async () => {
     if (!group || membersToAdd.length === 0) return;
     setIsUpdatingMembers(true);
     try {
       const success = await addMembersToGroup(groupId, membersToAdd);
       if (success) {
         toast({ title: "Members Added", description: `${membersToAdd.length} member(s) added successfully.` });
         setMembersToAdd([]); // Clear staging
         setSearchTerm(''); // Clear search
         setSearchResults([]);
         setIsManageMembersOpen(false); // Close dialog
         await loadGroupAndMembers(); // Reload group members
       } else {
         throw new Error("Failed to add members via service.");
       }
     } catch (error) {
       console.error("Error adding members:", error);
       toast({ title: "Error", description: "Failed to add members.", variant: "destructive" });
     } finally {
       setIsUpdatingMembers(false);
     }
   };

    const handleRemoveMember = async (memberIdToRemove: string) => {
        if (!group) return;
        // Optional: Add confirmation dialog here
        setIsUpdatingMembers(true); // Use same loading state for simplicity
        try {
            const success = await removeMemberFromGroup(groupId, memberIdToRemove);
            if (success) {
                toast({ title: "Member Removed", description: `Member removed successfully.` });
                await loadGroupAndMembers(); // Reload group members
                 // If the member being removed was staged for addition, remove them from staging too
                setMembersToAdd(prev => prev.filter(u => u.id !== memberIdToRemove));
            } else {
                throw new Error("Failed to remove member via service.");
            }
        } catch (error) {
            console.error("Error removing member:", error);
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

    // Check if the current user has permission to manage members (Admin or Teacher in the group)
    const canManageMembers = currentUser && group && (currentUser.role === 'Admin' || group.teacherIds.includes(currentUser.id));

  // --- End Manage Members Logic ---


  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-theme(spacing.24))]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
     return (
        <div className="flex justify-center items-center h-[calc(100vh-theme(spacing.24))]">
            <Card className="p-6 bg-destructive/10 border-destructive">
                <CardTitle className="text-destructive">{error}</CardTitle>
            </Card>
        </div>
     );
  }

   if (!group) {
      // This case might be redundant if error handles 'Group not found'
      return <div className="text-center mt-10">Group not found.</div>;
   }


  return (
    <div className="flex h-[calc(100vh-theme(spacing.24))] flex-col">
      {/* Adjust height based on header/other elements */}
      <Card className="mb-4 flex-shrink-0">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                 <div>
                    <CardTitle>Group: {group?.name || groupId}</CardTitle>
                    {group?.description && <p className="text-sm text-muted-foreground mt-1">{group.description}</p>}
                    <div className="text-xs text-muted-foreground mt-2">
                        Teachers: {members.filter(m => m.role === 'Teacher' || m.role === 'Admin').length} | Students: {members.filter(m => m.role === 'Student').length}
                    </div>
                 </div>
                 {canManageMembers && (
                     <Dialog open={isManageMembersOpen} onOpenChange={(open) => {
                         setIsManageMembersOpen(open);
                         if (!open) resetManageMembersDialog(); // Reset state on close
                     }}>
                         <DialogTrigger asChild>
                             <Button variant="outline" size="sm"><UserPlus className="mr-2 h-4 w-4" /> Manage Members</Button>
                         </DialogTrigger>
                         <DialogContent className="sm:max-w-[500px] flex flex-col max-h-[80vh]">
                             <DialogHeader>
                                 <DialogTitle>Manage Group Members</DialogTitle>
                                 <DialogDescription>
                                     Add or remove teachers and students from "{group.name}".
                                 </DialogDescription>
                             </DialogHeader>

                             {/* Add Members Section */}
                             <div className="space-y-2 pt-4">
                                 <h3 className="text-sm font-medium">Add New Members</h3>
                                  <div className="relative">
                                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                      <Input
                                          placeholder="Search by name or email..."
                                          value={searchTerm}
                                          onChange={(e) => setSearchTerm(e.target.value)}
                                          className="pl-8"
                                      />
                                  </div>
                                 <ScrollArea className="h-[150px] border rounded-md">
                                     <div className="p-2 space-y-1">
                                         {isSearching && <div className="text-center text-muted-foreground p-2"><Loader2 className="h-4 w-4 animate-spin inline mr-2"/>Searching...</div>}
                                         {!isSearching && searchResults.length === 0 && searchTerm.trim().length > 1 && <div className="text-center text-muted-foreground p-2 text-sm">No users found matching "{searchTerm}".</div>}
                                         {!isSearching && searchResults.length === 0 && searchTerm.trim().length <= 1 && <div className="text-center text-muted-foreground p-2 text-sm">Enter 2 or more characters to search.</div>}
                                         {searchResults.map(user => (
                                             <div key={user.id} className="flex items-center justify-between p-1 rounded hover:bg-muted text-sm">
                                                  <div className="flex items-center gap-2">
                                                     <Avatar className="h-6 w-6">
                                                         <AvatarImage src={user.profilePictureUrl} data-ai-hint="user avatar"/>
                                                         <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                     </Avatar>
                                                     <span>{user.name} ({user.role})</span>
                                                  </div>
                                                 <Button variant="ghost" size="sm" onClick={() => addMemberToStaging(user)} aria-label={`Add ${user.name}`}>
                                                      <UserPlus className="h-4 w-4" />
                                                 </Button>
                                             </div>
                                         ))}
                                     </div>
                                 </ScrollArea>
                                  {/* Staged Members */}
                                  {membersToAdd.length > 0 && (
                                      <div className="space-y-1 pt-2">
                                          <h4 className="text-xs font-medium text-muted-foreground">To Add:</h4>
                                          <div className="flex flex-wrap gap-1">
                                              {membersToAdd.map(user => (
                                                  <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                                                      {user.name}
                                                      <button onClick={() => removeMemberFromStaging(user)} className="ml-1 opacity-70 hover:opacity-100 focus:outline-none">
                                                          <X className="h-3 w-3" />
                                                      </button>
                                                  </Badge>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                             </div>


                              {/* Current Members Section */}
                             <div className="space-y-2 pt-4 flex-1 min-h-0">
                                 <h3 className="text-sm font-medium">Current Members ({members.length})</h3>
                                 <ScrollArea className="h-[200px] border rounded-md">
                                      <div className="p-2 space-y-1">
                                          {members.length === 0 && <div className="text-center text-muted-foreground p-2 text-sm">No members in this group yet.</div>}
                                          {members.map(member => (
                                              <div key={member.id} className="flex items-center justify-between p-1 rounded hover:bg-muted text-sm">
                                                   <div className="flex items-center gap-2">
                                                     <Avatar className="h-6 w-6">
                                                         <AvatarImage src={member.profilePictureUrl} data-ai-hint="member avatar"/>
                                                         <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                                     </Avatar>
                                                     <span>{member.name} ({member.role})</span>
                                                      {group.teacherIds.includes(member.id) && <Badge variant="outline" size="sm" className="text-xs">{member.role === 'Admin' ? 'Admin' : 'Teacher'}</Badge>}
                                                  </div>
                                                  {/* Prevent removing the last teacher/admin or self? Add logic if needed */}
                                                 {currentUser?.id !== member.id && ( // Don't allow removing self
                                                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleRemoveMember(member.id)} aria-label={`Remove ${member.name}`}>
                                                          <Trash2 className="h-4 w-4" />
                                                      </Button>
                                                 )}
                                             </div>
                                          ))}
                                      </div>
                                 </ScrollArea>
                             </div>


                             <DialogFooter className="pt-4">
                                  <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancel</Button>
                                  </DialogClose>
                                 <Button
                                     type="button"
                                     onClick={handleSaveMembers}
                                     disabled={isUpdatingMembers || membersToAdd.length === 0}
                                 >
                                     {isUpdatingMembers ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                     Add {membersToAdd.length} Member(s)
                                 </Button>
                             </DialogFooter>
                         </DialogContent>
                     </Dialog>
                 )}
            </div>
          </CardHeader>
      </Card>
       <div className="flex-grow min-h-0"> {/* Ensure ChatInterface takes remaining space */}
         <ChatInterface groupId={groupId} /> {/* Pass groupId to ChatInterface if needed */}
       </div>
    </div>
  );
}
