
'use client'; // Add 'use client' because we need the useAuth hook

import * as React from 'react'; // Import React for hooks
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from '@/context/auth-context'; // Import useAuth
import { Loader2 } from 'lucide-react'; // Import Loader

export default function DashboardPage() {
  const { user, loading } = useAuth(); // Get user and loading state

  // TODO: Fetch and display relevant dashboard information based on user role

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-theme(spacing.24))]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold">Dashboard</h1>
       <Card>
        <CardHeader>
          <CardTitle>Welcome to Assigno{user?.schoolName ? ` @ ${user.schoolName}` : ''}!</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is your dashboard. Content will vary based on your role ({user?.role || 'N/A'}).</p>
          {/* Placeholder content - replace with actual dashboard widgets */}
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
             <Card>
               <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
               <CardContent><p>No recent activity.</p></CardContent>
             </Card>
              <Card>
               <CardHeader><CardTitle>Upcoming Events</CardTitle></CardHeader>
               <CardContent><p>No upcoming events.</p></CardContent>
             </Card>
              <Card>
               <CardHeader><CardTitle>Active Polls</CardTitle></CardHeader>
               <CardContent><p>No active polls.</p></CardContent>
             </Card>
           </div>
        </CardContent>
       </Card>
    </div>
  );
}
