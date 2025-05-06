
'use client';

import * as React from 'react';
import { ChatInterface } from "@/components/chat/chat-interface";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fetchGroupDetails, type Group } from '@/services/groups'; // Import service
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation'; // Import useParams

// Remove params from props definition
// interface GroupDetailPageProps {
//   params: { groupId: string };
// }

export default function GroupDetailPage(/* { params }: GroupDetailPageProps */) {
  const params = useParams(); // Use the hook
  const groupId = params.groupId as string; // Get groupId from the hook's return value
  const [group, setGroup] = React.useState<Group | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch group details based on groupId
  React.useEffect(() => {
    if (!groupId) return; // Don't fetch if groupId is not available yet

    const loadGroupDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedGroup = await fetchGroupDetails(groupId);
        if (fetchedGroup) {
          setGroup(fetchedGroup);
        } else {
          setError('Group not found.');
        }
      } catch (err) {
        console.error("Error fetching group details:", err);
        setError('Failed to load group details.');
      } finally {
        setLoading(false);
      }
    };

    loadGroupDetails();
  }, [groupId]); // Depend on groupId from useParams


  // TODO: Fetch messages for this group
  // TODO: Implement chat functionality (sending messages, files, polls, events)

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
              <CardTitle>Group: {group?.name || groupId}</CardTitle>
              {group?.description && <p className="text-sm text-muted-foreground mt-1">{group.description}</p>}
              {/* TODO: Add other group info/actions here (e.g., members list button, settings for admins) */}
          </CardHeader>
      </Card>
       <div className="flex-grow min-h-0"> {/* Ensure ChatInterface takes remaining space */}
         <ChatInterface groupId={groupId} /> {/* Pass groupId to ChatInterface if needed */}
       </div>
    </div>
  );
}
