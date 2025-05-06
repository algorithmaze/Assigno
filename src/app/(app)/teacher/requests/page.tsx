
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, UserCheck, UserX, Inbox, User as UserIcon } from "lucide-react";
import { useAuth, type User as AuthUserType } from '@/context/auth-context';
import { fetchUserGroups, fetchGroupJoinRequests, approveJoinRequest, rejectJoinRequest } from '@/services/groups';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface JoinRequestWithGroupInfo {
    user: AuthUserType;
    groupId: string;
    groupName: string;
}

export default function TeacherJoinRequestsPage() {
  const { user: teacherUser, loading: authLoading } = useAuth();
  const [joinRequests, setJoinRequests] = React.useState<JoinRequestWithGroupInfo[]>([]);
  const [loadingRequests, setLoadingRequests] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState<string | null>(null); // Stores "approve-userId-groupId" or "reject-userId-groupId"
  const { toast } = useToast();
  const router = useRouter();

  // Redirect if not teacher
  React.useEffect(() => {
    if (!authLoading && teacherUser?.role !== 'Teacher' && teacherUser?.role !== 'Admin') { // Admins can also see this
      toast({ title: "Unauthorized", description: "You do not have permission to access this page.", variant: "destructive" });
      router.replace('/dashboard');
    }
  }, [teacherUser, authLoading, router, toast]);

  const loadJoinRequests = React.useCallback(async () => {
    if (!teacherUser || (teacherUser.role !== 'Teacher' && teacherUser.role !== 'Admin')) return;
    setLoadingRequests(true);
    try {
      const managedGroups = await fetchUserGroups(teacherUser.id, teacherUser.role);
      let allRequests: JoinRequestWithGroupInfo[] = [];

      for (const group of managedGroups) {
        if (group.joinRequests && group.joinRequests.length > 0) {
             // Fetch user details for each requester ID
            const requesters = await fetchGroupJoinRequests(group.id, teacherUser.id);
            requesters.forEach(reqUser => {
                allRequests.push({ user: reqUser, groupId: group.id, groupName: group.name });
            });
        }
      }
      setJoinRequests(allRequests);
    } catch (error) {
      console.error("Failed to fetch join requests:", error);
      toast({ title: "Error", description: "Could not load join requests.", variant: "destructive" });
    } finally {
      setLoadingRequests(false);
    }
  }, [teacherUser, toast]);

  React.useEffect(() => {
    if (teacherUser && (teacherUser.role === 'Teacher' || teacherUser.role === 'Admin')) {
      loadJoinRequests();
    }
  }, [teacherUser, loadJoinRequests]);

  const handleApproveRequest = async (studentId: string, groupId: string, studentName: string, groupName: string) => {
    if (!teacherUser) return;
    setIsProcessing(`approve-${studentId}-${groupId}`);
    try {
      const success = await approveJoinRequest(groupId, studentId, teacherUser.id);
      if (success) {
        toast({ title: "Request Approved", description: `${studentName} has been added to ${groupName}.` });
        loadJoinRequests(); // Refresh the list
      } else {
        toast({ title: "Approval Failed", description: `Could not approve ${studentName}.`, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An error occurred during approval.", variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRejectRequest = async (studentId: string, groupId: string, studentName: string) => {
    if (!teacherUser) return;
    setIsProcessing(`reject-${studentId}-${groupId}`);
    try {
      const success = await rejectJoinRequest(groupId, studentId, teacherUser.id);
      if (success) {
        toast({ title: "Request Rejected", description: `Join request for ${studentName} has been rejected.` });
        loadJoinRequests(); // Refresh the list
      } else {
        toast({ title: "Rejection Failed", description: `Could not reject ${studentName}.`, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An error occurred during rejection.", variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };


  if (authLoading || (teacherUser && teacherUser.role !== 'Teacher' && teacherUser.role !== 'Admin')) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-theme(spacing.24))]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Group requests by group for better UI
  const requestsByGroup = joinRequests.reduce((acc, req) => {
    if (!acc[req.groupId]) {
      acc[req.groupId] = { groupName: req.groupName, requests: [] };
    }
    acc[req.groupId].requests.push(req.user);
    return acc;
  }, {} as Record<string, { groupName: string; requests: AuthUserType[] }>);


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Group Join Requests</h1>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>Review and manage student requests to join your groups.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : Object.keys(requestsByGroup).length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
                <Inbox className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-lg">No pending join requests at the moment.</p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {Object.entries(requestsByGroup).map(([groupId, groupData]) => (
                <AccordionItem value={groupId} key={groupId}>
                  <AccordionTrigger className="text-lg font-medium hover:bg-muted/50 px-4 py-3 rounded-md">
                    {groupData.groupName} ({groupData.requests.length} request(s))
                  </AccordionTrigger>
                  <AccordionContent className="pt-0">
                    <div className="space-y-3 p-4 border-t">
                    {groupData.requests.map((student) => (
                      <Card key={student.id} className="p-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={student.profilePictureUrl || `https://picsum.photos/40/40?random=${student.id}`} alt={student.name} data-ai-hint="student avatar"/>
                              <AvatarFallback>
                                {student.name ? student.name.charAt(0).toUpperCase() : <UserIcon/>}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-sm text-muted-foreground">{student.email || student.admissionNumber}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                              onClick={() => handleRejectRequest(student.id, groupId, student.name)}
                              disabled={isProcessing === `reject-${student.id}-${groupId}` || !!isProcessing}
                            >
                              {isProcessing === `reject-${student.id}-${groupId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                              <span className="ml-1 hidden sm:inline">Reject</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                              onClick={() => handleApproveRequest(student.id, groupId, student.name, groupData.groupName)}
                              disabled={isProcessing === `approve-${student.id}-${groupId}` || !!isProcessing}
                            >
                              {isProcessing === `approve-${student.id}-${groupId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                               <span className="ml-1 hidden sm:inline">Approve</span>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
