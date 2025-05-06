'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { fetchUserGroups, type Group, requestToJoinGroup, fetchGroupByCode } from '@/services/groups';
import { Loader2, Search, LogIn, Copy, PlusCircle } from 'lucide-react'; // Added PlusCircle
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
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
import { Badge } from '@/components/ui/badge';

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const [isJoinGroupOpen, setIsJoinGroupOpen] = React.useState(false);
  const [joinGroupCode, setJoinGroupCode] = React.useState('');
  const [isJoiningGroup, setIsJoiningGroup] = React.useState(false);

  const loadGroups = React.useCallback(async () => {
    if (user) {
      setLoading(true);
      setError(null);
      try {
        const fetchedGroups = await fetchUserGroups(user.id, user.role);
        setGroups(fetchedGroups);
      } catch (err) {
        console.error("Error fetching groups:", err);
        setError('Failed to load groups.');
      } finally {
        setLoading(false);
      }
    } else {
       setGroups([]);
       setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleJoinGroupSubmit = async () => {
    if (!user || !joinGroupCode.trim()) return;
    setIsJoiningGroup(true);
    try {
      const groupToJoin = await fetchGroupByCode(joinGroupCode.trim(), user.schoolCode);
      if (!groupToJoin) {
        toast({ title: "Group Not Found", description: "No group found with that code in your school.", variant: "destructive" });
        setIsJoiningGroup(false);
        return;
      }
      if (groupToJoin.studentIds.includes(user.id) || groupToJoin.teacherIds.includes(user.id)) {
         toast({ title: "Already a Member", description: "You are already a member of this group.", variant: "default" });
         setIsJoinGroupOpen(false);
         setJoinGroupCode('');
         setIsJoiningGroup(false);
         return;
      }

      // For students, it's a request. For teachers, they join directly.
      const success = user.role === 'Student'
        ? await requestToJoinGroup(groupToJoin.id, user.id)
        : await addMembersToGroup(groupToJoin.id, [user]); // Simplified direct add for teacher

      if (success) {
        toast({
            title: user.role === 'Student' ? "Request Sent" : "Joined Group",
            description: user.role === 'Student'
                ? `Your request to join "${groupToJoin.name}" has been sent.`
                : `You have joined "${groupToJoin.name}".`
        });
        setIsJoinGroupOpen(false);
        setJoinGroupCode('');
        if (user.role === 'Teacher') loadGroups(); // Refresh groups if teacher joined
      } else {
        toast({ title: "Action Failed", description: "Could not process your request. You might have already requested or joined.", variant: "destructive" });
      }
    } catch (err: any) {
      console.error("Error joining group:", err);
      toast({ title: "Error", description: err.message || "Failed to process join request.", variant: "destructive" });
    } finally {
      setIsJoiningGroup(false);
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

  // Helper function in groups service
  async function addMembersToGroup(groupId: string, users: typeof User[]): Promise<boolean> {
    // This is a placeholder. You'd call your actual service function.
    console.log(`Simulating adding ${users.length} users to group ${groupId}`);
    const groupIndex = mockGroupsData.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return false;
    users.forEach(u => {
        if(u.role === 'Teacher' && !mockGroupsData[groupIndex].teacherIds.includes(u.id)) {
            mockGroupsData[groupIndex].teacherIds.push(u.id);
        } else if (u.role === 'Student' && !mockGroupsData[groupIndex].studentIds.includes(u.id)){
            mockGroupsData[groupIndex].studentIds.push(u.id);
        }
    });
    return true;
  }

  const canCreateGroup = user?.role === 'Admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold">Groups</h1>
         {canCreateGroup && (
            <Link href="/groups/create">
                <Button><PlusCircle className="mr-2 h-4 w-4"/>Create Group</Button>
            </Link>
         )}
      </div>
       <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Your Groups</CardTitle>
          <CardDescription>
            {user?.role === 'Student' ? 'Groups you are a member of. You can also request to join new groups.' :
             user?.role === 'Teacher' ? 'Groups you are managing or a member of. You can also join other groups.' :
             'All groups within your school.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
             <div className="flex justify-center items-center py-8">
               <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          )}
          {error && (
            <div className="text-destructive text-center py-4">{error}</div>
          )}
          {!loading && !error && groups.length === 0 && (
             <p className="text-muted-foreground text-center py-4">
                {user?.role === 'Student' ? 'You are not currently a member of any groups. Request to join one!' : 
                 user?.role === 'Teacher' ? 'You are not part of any groups yet. Join one or wait for an admin to add you.' : 
                 'No groups to display yet.'}
            </p>
          )}
          {!loading && !error && groups.length > 0 && (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               {groups.map((group) => (
                 <Link href={`/groups/${group.id}`} key={group.id} className="block">
                    <Card className="p-4 hover:shadow-lg cursor-pointer transition-all h-full flex flex-col justify-between rounded-lg">
                      <div>
                       <p className="font-semibold text-lg">{group.name}</p>
                       {group.subject && <p className="text-sm text-muted-foreground">{group.subject}</p>}
                       {group.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{group.description}</p>}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Code: {group.groupCode}</Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {e.preventDefault(); e.stopPropagation(); copyToClipboard(group.groupCode);}}>
                            <Copy className="h-3 w-3" />
                            <span className="sr-only">Copy group code</span>
                        </Button>
                      </div>
                    </Card>
                 </Link>
               ))}
             </div>
          )}

            {(user?.role === 'Student' || user?.role === 'Teacher') && (
                <div className="mt-8 border-t pt-6">
                    <h3 className="text-xl font-semibold mb-3">Join a Group</h3>
                     <Dialog open={isJoinGroupOpen} onOpenChange={setIsJoinGroupOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><LogIn className="mr-2 h-4 w-4" /> Enter Group Code</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                            <DialogTitle>Join Group</DialogTitle>
                            <DialogDescription>
                                Enter the unique code provided by your teacher or admin to request access to a group.
                            </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Input
                                    id="groupCode"
                                    placeholder="e.g., SAMP123-ABCXYZ"
                                    value={joinGroupCode}
                                    onChange={(e) => setJoinGroupCode(e.target.value.toUpperCase())}
                                    className="col-span-3"
                                />
                            </div>
                            <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline" disabled={isJoiningGroup}>Cancel</Button></DialogClose>
                            <Button type="button" onClick={handleJoinGroupSubmit} disabled={isJoiningGroup || !joinGroupCode.trim()}>
                                {isJoiningGroup && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {user?.role === 'Student' ? 'Request to Join' : 'Join Group'}
                            </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
             )}
        </CardContent>
       </Card>
    </div>
  );
}
