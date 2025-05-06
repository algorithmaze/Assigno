
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useAuth } from '@/context/auth-context'; // Import useAuth
import { fetchUserGroups, type Group } from '@/services/groups'; // Import service and type
import { Loader2 } from 'lucide-react'; // Import Loader icon

export default function GroupsPage() {
  const { user } = useAuth(); // Get the current user
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch groups when the component mounts or user changes
  React.useEffect(() => {
    if (user) {
      const loadGroups = async () => {
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
      };
      loadGroups();
    } else {
       // If no user, clear groups and stop loading
       setGroups([]);
       setLoading(false);
    }
  }, [user]); // Depend on user object

  // TODO: Implement group joining logic for students

  // Determine if the user can create groups
  const canCreateGroup = user?.role === 'Admin' || user?.role === 'Teacher';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold">Groups</h1>
         {/* Conditionally render based on role */}
         {canCreateGroup && (
            <Link href="/groups/create">
                <Button>Create Group</Button>
            </Link>
         )}
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Your Groups</CardTitle>
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
                {user?.role === 'Student' ? 'You are not currently a member of any groups.' : 'You have not created or joined any groups yet.'}
            </p>
          )}
          {!loading && !error && groups.length > 0 && (
             <div className="mt-4 space-y-2">
               {groups.map((group) => (
                 <Link href={`/groups/${group.id}`} key={group.id}>
                    <Card className="p-4 hover:bg-muted cursor-pointer transition-colors">
                       <p className="font-medium">{group.name}</p>
                       {group.subject && <p className="text-sm text-muted-foreground">{group.subject}</p>}
                    </Card>
                 </Link>
               ))}
             </div>
          )}

            {/* Group joining section for students */}
             {user?.role === 'Student' && (
                <div className="mt-6 border-t pt-4">
                    <h3 className="text-lg font-semibold mb-2">Request to Join a Group</h3>
                    {/* TODO: Implement group search and request join functionality */}
                    <p className="text-sm text-muted-foreground">Search for a group code or name to request access.</p>
                    <Button variant="outline" className="mt-2">Find Group</Button>
                </div>
             )}
        </CardContent>
       </Card>
    </div>
  );
}
