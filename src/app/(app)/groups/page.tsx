
'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useAuth } from '@/context/auth-context'; // Import useAuth

export default function GroupsPage() {
  const { user } = useAuth(); // Get the current user

  // TODO: Fetch and display groups based on user role and permissions
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
          <p>List of groups you are a member of or manage will appear here.</p>
           {/* Placeholder - Map through actual groups */}
           {/* TODO: Fetch user's actual groups */}
           <div className="mt-4 space-y-2">
             <Link href="/groups/group1-id"> {/* Example Link */}
                <Card className="p-4 hover:bg-muted cursor-pointer">Group 1: Class 10 Maths</Card>
             </Link>
             <Link href="/groups/group2-id"> {/* Example Link */}
                <Card className="p-4 hover:bg-muted cursor-pointer">Group 2: Subject Physics</Card>
            </Link>
           </div>
            {/* TODO: Add student request join section if applicable */}
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
