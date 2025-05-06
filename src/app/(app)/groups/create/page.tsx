
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
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { createGroup, type CreateGroupInput } from '@/services/groups'; // Import createGroup service
// TODO: Import services to fetch teachers/students if implementing member selection here

const createGroupSchema = z.object({
  name: z.string().min(3, { message: 'Group name must be at least 3 characters' }),
  description: z.string().optional(),
  subject: z.string().optional(),
  // TODO: Add fields for teachers and students if implementing member selection during creation
  // teacherIds: z.array(z.string()).min(1, { message: 'At least one teacher must be selected' }),
  // studentIds: z.array(z.string()).optional(),
});

type CreateGroupFormData = z.infer<typeof createGroupSchema>;

export default function CreateGroupPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  // TODO: Fetch teachers and students if needed for selection
  // const [teachers, setTeachers] = React.useState([]);
  // const [students, setStudents] = React.useState([]);

  // React.useEffect(() => {
  //   // Fetch teachers/students logic
  // }, []);

  const form = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      subject: '',
      // teacherIds: [],
      // studentIds: [],
    },
  });

  // Redirect if user is not authorized
  React.useEffect(() => {
      if (user && user.role !== 'Admin' && user.role !== 'Teacher') {
          toast({
              title: 'Unauthorized',
              description: 'You do not have permission to create groups.',
              variant: 'destructive',
          });
          router.replace('/groups'); // Redirect back to groups list
      }
  }, [user, router, toast]);


  const onSubmit = async (data: CreateGroupFormData) => {
    setIsLoading(true);
    try {
      const groupInput: CreateGroupInput = {
        ...data,
        // Ensure required fields like teacherIds are included if schema changes
      };
      const newGroup = await createGroup(groupInput); // Call the service function
      toast({
        title: 'Group Created',
        description: `Group "${newGroup.name}" has been successfully created.`,
      });
      router.push('/groups'); // Redirect to the groups list page
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: 'Error',
        description: 'Failed to create group. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If user data is loading or user is not authorized yet, show loading or null
  if (!user || (user.role !== 'Admin' && user.role !== 'Teacher')) {
     return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
     );
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Create New Group</h1>
      <Card>
        <CardHeader>
          <CardTitle>Group Details</CardTitle>
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
                      <Input placeholder="e.g., Class 10 Maths, Science Club" {...field} />
                    </FormControl>
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Provide a brief description of the group's purpose." {...field} />
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
                    <FormLabel>Subject (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mathematics, Physics" {...field} />
                    </FormControl>
                     <FormDescription>
                       Associate the group with a subject if applicable.
                     </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* TODO: Add Teacher Selection Field */}
              {/* Example using a multi-select component or checkboxes */}
              {/* <FormField
                  control={form.control}
                  name="teacherIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teachers *</FormLabel>
                      <FormControl>*/}
                         {/* Replace with actual multi-select component */}
                         {/*<Select multiple onValueChange={field.onChange} defaultValue={field.value}> ... </Select>
                      </FormControl>
                      <FormDescription>Select one or more teachers for this group.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                 {/* TODO: Add Student Selection Field (Optional during creation) */}
                {/* <FormField
                  control={form.control}
                  name="studentIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Students (Optional)</FormLabel>
                       <FormControl> */}
                          {/* Replace with actual multi-select component */}
                          {/* <Select multiple onValueChange={field.onChange} defaultValue={field.value}> ... </Select>
                       </FormControl>
                      <FormDescription>You can add students now or later.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}


            </CardContent>
            <CardFooter className="flex justify-end gap-2">
               <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Group
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
