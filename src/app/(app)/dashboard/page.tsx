'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useAuth } from '@/context/auth-context';
import { Loader2, Users, BarChart3, UserCheck, UserX } from 'lucide-react';
import { getSchoolStats, type SchoolStats } from '@/services/groups'; // Assuming stats are part of groups service for now

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = React.useState<SchoolStats | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(false);

  React.useEffect(() => {
    if (user?.role === 'Admin' && user.schoolCode) {
      const fetchStats = async () => {
        setStatsLoading(true);
        try {
          const schoolStats = await getSchoolStats(user.schoolCode);
          setStats(schoolStats);
        } catch (error) {
          console.error("Failed to fetch school stats:", error);
          // Optionally set an error state to display to the user
        } finally {
          setStatsLoading(false);
        }
      };
      fetchStats();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-theme(spacing.24))]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  const schoolDisplayName = user?.schoolName || user?.schoolCode || 'your school';

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold">Dashboard</h1>
       <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Welcome to Assigno @ {schoolDisplayName}!</CardTitle>
          <CardDescription>Overview of your activities and school information. Your role: {user?.role || 'N/A'}</CardDescription>
        </CardHeader>
        <CardContent>
          {user?.role === 'Admin' && (
            statsLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading school statistics...</span>
              </div>
            ) : stats ? (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-3">School Statistics ({user.schoolName})</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalGroups}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalStudents}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.studentsInAnyGroup} in groups, {stats.studentsNotInAnyGroup} not in any group
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Teachers & Admins</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalTeachers}</div>
                       <p className="text-xs text-muted-foreground">
                        {stats.teachersInAnyGroup} in groups, {stats.teachersNotInAnyGroup} not assigned
                      </p>
                    </CardContent>
                  </Card>
                </div>
                {stats.groupMembership.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Group Membership Overview</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                    {stats.groupMembership.map(group => (
                      <Card key={group.groupId} className="p-3">
                        <p className="font-medium text-sm">{group.groupName}</p>
                        <p className="text-xs text-muted-foreground">
                          Students: {group.studentCount}, Teachers: {group.teacherCount}
                        </p>
                      </Card>
                    ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Could not load school statistics.</p>
            )
          )}

          {user?.role !== 'Admin' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
             <Card>
               <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
               <CardContent><p className="text-sm text-muted-foreground">No recent activity to display.</p></CardContent>
             </Card>
              <Card>
               <CardHeader><CardTitle>Upcoming Events</CardTitle></CardHeader>
               <CardContent><p className="text-sm text-muted-foreground">No upcoming events scheduled.</p></CardContent>
             </Card>
              <Card>
               <CardHeader><CardTitle>Active Polls</CardTitle></CardHeader>
               <CardContent><p className="text-sm text-muted-foreground">No active polls currently.</p></CardContent>
             </Card>
           </div>
          )}
        </CardContent>
       </Card>
    </div>
  );
}
