'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { fetchGroupDetails, updateGroupSettings, type Group } from '@/services/groups';

const groupSettingsSchema = z.object({
  name: z.string().min(3, { message: 'Group name must be at least 3 characters' }).max(100),
  description: z.string().max(250).optional(),
  subject: z.string().max(50).optional(),
  // Add other settings fields here, e.g., studentPostPermission: z.boolean().optional(),
});

type GroupSettingsFormData = z.infer<typeof groupSettingsSchema>;

interface GroupSettingsPageProps {
  params: { groupId: string };
}

export default function GroupSettingsPage({ params }: GroupSettingsPageProps) {
  const { groupId } = params;
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetchingGroup, setIsFetchingGroup] = React.useState(true);
  const [group, setGroup] = React.useState<Group | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const form = useForm<GroupSettingsFormData>({
    resolver: zodResolver(groupSettingsSchema),
    defaultValues: {
      name: '',
      description: '',
      subject: '',
    },
  });

  React.useEffect(() => {
    const loadGroup = async () => {
      if (!groupId || !user) return;
      setIsFetchingGroup(true);
      try {
        const fetchedGroup = await fetchGroupDetails(groupId);
        if (fetchedGroup) {
          // Permission check: Only admins or teachers in the group can edit settings
          const canEdit = user.role === 'Admin' || fetchedGroup.teacherIds.includes(user.id);
          if (!canEdit) {
            toast({ title: "Unauthorized", description: "You don't have permission to edit this group's settings.", variant: "destructive" });
            router.replace(`/groups/${groupId}`);
            return;
          }
          setGroup(fetchedGroup);
          form.reset({
            name: fetchedGroup.name,
            description: fetchedGroup.description || '',
            subject: fetchedGroup.subject || '',
          });
        } else {
          toast({ title: "Error", description: "Group not found.", variant: "destructive" });
          router.replace('/groups');
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to load group details.", variant: "destructive" });
        router.replace('/groups');
      } finally {
        setIsFetchingGroup(false);
      }
    };
    loadGroup();
  }, [groupId, user, router, toast, form]);

  const onSubmit = async (data: GroupSettingsFormData) => {
    if (!group || !user) return;
    setIsLoading(true);
    try {
      const updatedGroup = await updateGroupSettings(groupId, data, user.id);
      if (updatedGroup) {
        toast({
          title: 'Settings Updated',
          description: `Group "${updatedGroup.name}" settings saved.`,
        });
        // Optionally, refresh group data or navigate back
        router.refresh(); // Refreshes server components on the current route
      } else {
        toast({ title: "Update Failed", description: "Could not save group settings.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({
        title: 'Error Updating Settings',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingGroup || !user) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-theme(spacing.24))]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading group settings...</span>
      </div>
    );
  }

  if (!group) {
    // This case should be handled by useEffect redirect, but as a fallback:
    return <div className="text-center mt-10 text-muted-foreground">Group not found or access denied.</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Group
      </Button>
      <h1 className="text-3xl font-bold">Group Settings: {group.name}</h1>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Edit Group Information</CardTitle>
          <CardDescription>Modify the details for this group. Current Group Code: <strong>{group.groupCode}</strong></CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief description (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Science (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* TODO: Add other settings like student posting permissions */}
              {/* <FormField
                control={form.control}
                name="studentPostPermission"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Allow Student Posts</FormLabel>
                      <FormDescription>
                        Can students post messages in this group?
                      </FormDescription>
                    </div>
                    <FormControl>
                       <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              /> */}
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-6">
              <Button type="button" variant="outline" onClick={() => form.reset({name: group.name, description: group.description || '', subject: group.subject || ''})} disabled={isLoading}>
                Reset
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
