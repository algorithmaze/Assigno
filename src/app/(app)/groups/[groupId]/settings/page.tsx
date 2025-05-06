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
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription as ShadcnCardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
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
  // Unwrap params using React.use()
  const resolvedParams = React.use(params);
  const groupId = resolvedParams.groupId;

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
      if (!groupId || !user) { // Ensure user is available before fetching
        setIsFetchingGroup(false); // Stop loading if no user/groupId
        if (!user && groupId) { // Only show error if groupId is present but user is not
            toast({ title: "Authentication Error", description: "User data not available. Please re-login.", variant: "destructive"});
            router.replace('/login');
        }
        return;
      }
      setIsFetchingGroup(true);
      try {
        const fetchedGroup = await fetchGroupDetails(groupId);
        if (fetchedGroup) {
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
    // Check if user is loaded before calling loadGroup
    if (user) {
        loadGroup();
    } else if (!user && groupId) { // If groupId known but user still loading/null
        setIsFetchingGroup(true); // Keep loading state until user is checked
    } else {
        setIsFetchingGroup(false); // If no groupId, nothing to fetch
    }
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
        setGroup(updatedGroup); // Update local state with new details
        form.reset(updatedGroup); // Reset form with updated values
        router.refresh();
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
    return (
        <div className="flex flex-col justify-center items-center h-[calc(100vh-theme(spacing.24))] space-y-4">
           <Card className="p-6 shadow-lg max-w-md w-full">
             <CardHeader className="p-0 mb-2"><CardTitle className="text-center">Group Not Found</CardTitle></CardHeader>
             <CardContent className="p-0 text-center">
               <p className="text-muted-foreground">The group settings could not be loaded or access was denied.</p>
               <Button onClick={() => router.push('/groups')} className="mt-4">Go to Groups</Button>
             </CardContent>
           </Card>
        </div>
      );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-4 print:hidden">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Group
      </Button>
      <h1 className="text-3xl font-bold">Group Settings: {group.name}</h1>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Edit Group Information</CardTitle>
          <ShadcnCardDescription>Modify the details for this group. Current Group Code: <strong>{group.groupCode}</strong></ShadcnCardDescription>
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
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-6">
              <Button type="button" variant="outline" onClick={() => form.reset({name: group.name, description: group.description || '', subject: group.subject || ''})} disabled={isLoading}>
                Reset
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Settings
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
