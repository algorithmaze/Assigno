
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
  FormDescription, // This is from '@/components/ui/form'
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription as ShadcnCardDescription } from '@/components/ui/card'; // Imported CardDescription as ShadcnCardDescription
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { createGroup, type CreateGroupInput } from '@/services/groups';

const createGroupSchema = z.object({
  name: z.string().min(3, { message: 'Group name must be at least 3 characters' }).max(100, { message: 'Group name too long' }),
  description: z.string().max(250, { message: 'Description too long' }).optional(),
  subject: z.string().max(50, { message: 'Subject too long' }).optional(),
});

type CreateGroupFormData = z.infer<typeof createGroupSchema>;

export default function CreateGroupPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const form = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      subject: '',
    },
  });

  // Redirect if user is not authorized (Admin or Teacher)
  React.useEffect(() => {
      if (user && user.role !== 'Admin' && user.role !== 'Teacher') {
          toast({
              title: 'Unauthorized',
              description: 'You do not have permission to create groups.',
              variant: 'destructive',
          });
          router.replace('/groups');
      }
  }, [user, router, toast]);


  const onSubmit = async (data: CreateGroupFormData) => {
    if (!user || (user.role !== 'Admin' && user.role !== 'Teacher')) {
        toast({ title: 'Error', description: 'Unauthorized action.', variant: 'destructive'});
        return;
    }
    setIsLoading(true);
    try {
      const groupInput: CreateGroupInput = { ...data };
      const newGroup = await createGroup(groupInput, user.id, user.role, user.schoolCode);
      toast({
        title: 'Group Created',
        description: `Group "${newGroup.name}" (Code: ${newGroup.groupCode}) has been successfully created.`,
      });
      // Redirect to the new group's detail page or the groups list
      router.push(`/groups/${newGroup.id}`);
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast({
        title: 'Error Creating Group',
        description: error.message || 'Failed to create group. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || (user.role !== 'Admin' && user.role !== 'Teacher')) {
     return (
        <div className="flex justify-center items-center h-[calc(100vh-theme(spacing.24))]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
     );
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Create New Group</h1>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Enter Group Details</CardTitle>
          {/* Use ShadcnCardDescription (from ui/card) here as it's outside the Form context */}
          <ShadcnCardDescription>
            Admins and Teachers can create groups. The creator will automatically be added as a teacher/manager.
          </ShadcnCardDescription>
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
                      <Input placeholder="e.g., Class 10 Maths, Debate Club" {...field} />
                    </FormControl>
                    {/* This FormDescription (from ui/form) is correctly placed inside a FormField */}
                    <FormDescription>
                      A descriptive name for the group.
                    </FormDescription>
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
                      <Textarea placeholder="Provide a brief description of the group's purpose (optional)." {...field} />
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
                      <Input placeholder="e.g., Mathematics, Physics (optional)" {...field} />
                    </FormControl>
                     <FormDescription>
                       Associate the group with a subject if applicable.
                     </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-6">
               <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Group
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

