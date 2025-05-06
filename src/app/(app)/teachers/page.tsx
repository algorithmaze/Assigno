
'use client'; // Add 'use client' directive

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import Link from 'next/link';

// TODO: Replace with actual user data type
interface TeacherAdmin {
    id: string;
    name: string;
    role: 'Teacher' | 'Admin';
    profilePictureUrl?: string;
    // Add other relevant details like subject, class teacher status etc.
}

export default function TeachersPage() {
  // TODO: Fetch list of teachers and admins (visible to all roles)
  const users: TeacherAdmin[] = [ // Placeholder data
      { id: 't1', name: 'Alice Smith', role: 'Teacher', profilePictureUrl: 'https://picsum.photos/100/100?random=1', },
      { id: 'a1', name: 'Bob Johnson', role: 'Admin' },
      { id: 't2', name: 'Charlie Brown', role: 'Teacher', profilePictureUrl: 'https://picsum.photos/100/100?random=3', },
  ];

  // TODO: Implement chat request logic
  const handleChatRequest = (userId: string) => {
      console.log(`Requesting chat with user ${userId}`);
      // Implement actual request logic (e.g., send notification/request)
  };

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold">Teachers & Admins</h1>
       <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             {users.map((user) => (
               <Card key={user.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                       <Avatar>
                          <AvatarImage src={user.profilePictureUrl} alt={user.name} data-ai-hint="profile picture" />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.role}</p>
                      </div>
                  </div>
                  {/* TODO: Implement chat request logic properly - only show button if target accepts requests */}
                   <Button size="sm" onClick={() => handleChatRequest(user.id)}>
                      Chat
                   </Button>
                   {/* TODO: Or maybe navigate to a chat page: <Link href={`/chat/${user.id}`}><Button size="sm">Chat</Button></Link> */}
               </Card>
             ))}
          </div>
        </CardContent>
       </Card>
    </div>
  );
}
