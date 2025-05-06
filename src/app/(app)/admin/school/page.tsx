
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
import { Loader2, Save } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { getSchoolDetails, updateSchoolDetails as updateSchoolDetailsService } from '@/services/school';
import type { SchoolDetails } from '@/services/school';
import { useRouter } from 'next/navigation';

const schoolSettingsSchema = z.object({
  schoolName: z.string().min(3, { message: 'School name must be at least 3 characters' }).max(100),
  address: z.string().min(5, { message: 'Address must be at least 5 characters' }).max(200),
  // schoolCode is generally not editable this way, it's more of an identifier
});

type SchoolSettingsFormData = z.infer<typeof schoolSettingsSchema>;

export default function AdminSchoolSettingsPage() {
  const { user: adminUser, loading: authLoading, updateUserSession } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetchingSchool, setIsFetchingSchool] = React.useState(true);
  const [school, setSchool] = React.useState<SchoolDetails | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SchoolSettingsFormData>({
    resolver: zodResolver(schoolSettingsSchema),
    defaultValues: {
      schoolName: '',
      address: '',
    },
  });

  // Redirect if not admin
  React.useEffect(() => {
    if (!authLoading && adminUser?.role !== 'Admin') {
      toast({ title: "Unauthorized", description: "You do not have permission to access this page.", variant: "destructive" });
      router.replace('/dashboard');
    }
  }, [adminUser, authLoading, router, toast]);

  React.useEffect(() => {
    const loadSchoolDetails = async () => {
      if (!adminUser || adminUser.role !== 'Admin' || !adminUser.schoolCode) return;
      setIsFetchingSchool(true);
      try {
        const fetchedSchool = await getSchoolDetails(adminUser.schoolCode);
        if (fetchedSchool) {
          setSchool(fetchedSchool);
          form.reset({
            schoolName: fetchedSchool.schoolName,
            address: fetchedSchool.address,
          });
        } else {
          toast({ title: "Error", description: "School details not found for your school code.", variant: "destructive" });
          // Potentially redirect or show a more permanent error
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to load school details.", variant: "destructive" });
      } finally {
        setIsFetchingSchool(false);
      }
    };

    if (adminUser?.role === 'Admin') {
      loadSchoolDetails();
    }
  }, [adminUser, toast, form]);


  const onSubmit = async (data: SchoolSettingsFormData) => {
    if (!school || !adminUser || adminUser.role !== 'Admin') return;
    setIsLoading(true);
    try {
      // Pass schoolCode for identification, even if not directly editable in form
      const updatedSchool = await updateSchoolDetailsService({ schoolCode: school.schoolCode, ...data });
      if (updatedSchool) {
        setSchool(updatedSchool); // Update local state
        // Update schoolName and schoolAddress in user session if they changed
        if (adminUser.schoolName !== updatedSchool.schoolName || adminUser.schoolAddress !== updatedSchool.address) {
            updateUserSession({ schoolName: updatedSchool.schoolName, schoolAddress: updatedSchool.address });
        }
        toast({
          title: 'School Settings Updated',
          description: `Details for "${updatedSchool.schoolName}" saved.`,
        });
        router.refresh(); // To reflect changes in other parts like dashboard if needed
      } else {
        toast({ title: "Update Failed", description: "Could not save school settings.", variant: "destructive" });
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


  if (authLoading || (adminUser && adminUser.role !== 'Admin') || isFetchingSchool) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-theme(spacing.24))]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
         <span className="ml-2 text-muted-foreground">Loading school settings...</span>
      </div>
    );
  }

  if (!school) {
     return <div className="text-center mt-10 text-muted-foreground">Could not load school information.</div>;
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">School Settings</h1>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Manage School Information</CardTitle>
          <CardDescription>Update the details for your school. Current School Code: <strong>{school.schoolCode}</strong> (Read-only)</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="schoolName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Official name of the school" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Address *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Full address of the school" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Add other school settings fields if needed */}
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-6">
               <Button type="button" variant="outline" onClick={() => form.reset({schoolName: school.schoolName, address: school.address})} disabled={isLoading}>
                Reset
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

