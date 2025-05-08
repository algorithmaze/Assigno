
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Loader2, MessageSquare } from "lucide-react";
import { useAuth, type User } from '@/context/auth-context';
import { fetchAllUsers } from '@/services/users'; // Assuming this fetches all users for a school
import { useToast } from '@/hooks/use-toast';
// import Link from 'next/link'; // If navigating to a chat page

export default function TeachersPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [staff, setStaff] = React.useState<User[]>([]);
  const [loadingStaff, setLoadingStaff] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    if (currentUser?.schoolCode) {
      const loadStaff = async () => {
        setLoadingStaff(true);
        try {
          const allSchoolUsers = await fetchAllUsers(currentUser.schoolCode);
          // Filter for Teachers and Admins, exclude current user from list to avoid "Chat with self"
          const schoolStaff = allSchoolUsers.filter(
            u => (u.role === 'Teacher' || u.role === 'Admin') && u.id !== currentUser.id
          );
          setStaff(schoolStaff);
        } catch (error) {
          console.error("Failed to fetch staff:", error);
          toast({ title: "Error", description: "Could not load staff directory.", variant: "destructive" });
        } finally {
          setLoadingStaff(false);
        }
      };
      loadStaff();
    }
  }, [currentUser, toast]);


  const handleChatRequest = (userId: string, userName: string) => {
      // TODO: Implement actual chat initiation logic
      // This could involve:
      // 1. Checking if a chat already exists
      // 2. Creating a new direct chat (if it's a 1-on-1 chat feature)
      // 3. Navigating to the chat page: router.push(`/chat/${chatId}`)
      console.log(`Requesting chat with user ${userId} (${userName})`);
      toast({
          title: "Chat Feature (Placeholder)",
          description: `Initiating chat with ${userName} - to be implemented.`,
      });
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-theme(spacing.24))]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold">Staff Directory</h1>
       <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Teachers & Admins</CardTitle>
          <CardDescription>
            Contact teachers and administrators at {currentUser?.schoolName || 'your school'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStaff ? (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : staff.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No other teachers or admins found in the directory.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
             {staff.map((user) => (
               <Card key={user.id} className="p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-4 mb-3">
                       <Avatar className="h-12 w-12">
                          <AvatarImage src={user.profilePictureUrl || undefined} alt={user.name} data-ai-hint="profile picture staff" />
                          <AvatarFallback className="text-lg">
                            {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon />}
                          </AvatarFallback>
                        </Avatar>
                      <div>
                        <p className="font-semibold text-lg">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.role}</p>
                        {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                      </div>
                  </div>
                  {/* TODO: Implement chat request logic properly */}
                  {/* Only show button if target accepts requests (setting) and current user can initiate (e.g., not student to teacher unless teacher initiated) */}
                   <Button size="sm" onClick={() => handleChatRequest(user.id, user.name)} variant="outline" className="w-full mt-auto" disabled>
                      <MessageSquare className="mr-2 h-4 w-4"/> Chat (Not Implemented)
                   </Button>
               </Card>
             ))}
            </div>
          )}
        </CardContent>
       </Card>
    </div>
  );
}
