
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useAuth } from '@/context/auth-context';
import { Loader2, Users } from 'lucide-react';
import { getSchoolStats, type SchoolStats } from '@/services/groups';

const POLLING_INTERVAL = 7000; // Changed from 15000 to 7000 (7 seconds)

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = React.useState<SchoolStats | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(false);
  const isPollingStatsRef = React.useRef(false);

  const fetchStats = React.useCallback(async (isPoll: boolean = false) => {
    if (!user || user.role !== 'Admin' || !user.schoolCode) return;

    if (!isPoll) {
      setStatsLoading(true);
    }
    isPollingStatsRef.current = true;

    try {
      const schoolStats = await getSchoolStats(user.schoolCode);
      setStats(prevStats => {
        if (JSON.stringify(prevStats) !== JSON.stringify(schoolStats)) {
          return schoolStats;
        }
        return prevStats;
      });
    } catch (error) {
      console.error("Failed to fetch school stats:", error);
      if (!isPoll) {
        setStats(null); 
      } else {
        console.warn("Polling for school stats failed, suppressing UI error.");
      }
    } finally {
      if (!isPoll) {
        setStatsLoading(false);
      }
      isPollingStatsRef.current = false;
    }
  }, [user]);

  React.useEffect(() => {
    if (user?.role === 'Admin') {
      fetchStats(); 
    }
  }, [user, fetchStats]); 

  React.useEffect(() => {
    if (user?.role !== 'Admin' || !user.schoolCode) return;

    const intervalId = setInterval(async () => {
      if (isPollingStatsRef.current) {
        console.log("Stats polling skipped, already in progress.");
        return;
      }
      console.log("Polling for school stats...");
      await fetchStats(true); 
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [user, fetchStats]); 

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
                <h2 className="text-xl font-semibold mb-3">School Statistics ({user.schoolName || user.schoolCode})</h2>
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
                      <div className="text-2xl font-bold">{stats.totalTeachersAndAdmins}</div>
                       <p className="text-xs text-muted-foreground">
                        {stats.staffInAnyGroup} in groups, {stats.staffNotInAnyGroup} not assigned
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




