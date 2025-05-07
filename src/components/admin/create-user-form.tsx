
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus } from 'lucide-react';
import { addUser } from '@/services/users';
import type { User } from '@/context/auth-context';

const userCreateSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  identifier: z.string().min(1, { message: "Email or Phone is required." })
    .refine(value => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[1-9]\d{1,14}$/; // Basic international phone number regex
      return emailRegex.test(value) || phoneRegex.test(value);
    }, { message: "Invalid email or phone format (e.g., user@example.com or +1234567890)." }),
  role: z.enum(["Student", "Teacher"], { required_error: "Please select a role." }),
  admissionNumber: z.string().optional(),
  studentClass: z.string().optional(),
  teacherDesignation: z.enum(["Class Teacher", "Subject Teacher"]).optional(),
  teacherClass: z.string().optional(),
}).refine(data => {
  if (data.role === "Student") {
    return !!data.admissionNumber && data.admissionNumber.trim() !== '' && !!data.studentClass && data.studentClass.trim() !== '';
  }
  return true;
}, { message: "Admission Number and Class are required for Students.", path: ["admissionNumber"] }) // Apply to first field for now
.refine(data => {
  if (data.role === "Student" && (!data.studentClass || data.studentClass.trim() === '')) {
    return false;
  }
  return true;
}, { message: "Class is required for Students.", path: ["studentClass"]})
.refine(data => {
  if (data.role === "Teacher") {
    return !!data.teacherDesignation;
  }
  return true;
}, { message: "Designation is required for Teachers.", path: ["teacherDesignation"] });


type UserCreateFormData = z.infer<typeof userCreateSchema>;

interface CreateUserFormProps {
  schoolCode: string;
  schoolName: string;
  schoolAddress: string;
  onUserCreated: () => void;
  onCloseDialog: () => void;
}

export function CreateUserForm({ schoolCode, schoolName, schoolAddress, onUserCreated, onCloseDialog }: CreateUserFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<UserCreateFormData>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      name: '',
      identifier: '',
      role: undefined,
      admissionNumber: '',
      studentClass: '',
      teacherDesignation: undefined,
      teacherClass: '',
    },
  });

  const currentRole = form.watch('role');

  const onSubmit = async (data: UserCreateFormData) => {
    setIsLoading(true);
    try {
      const newUserInput: Omit<User, 'id' | 'profilePictureUrl'> = {
        name: data.name,
        email: data.identifier.includes('@') ? data.identifier : undefined,
        phoneNumber: !data.identifier.includes('@') ? data.identifier : undefined,
        role: data.role,
        schoolCode: schoolCode,
        schoolName: schoolName,
        schoolAddress: schoolAddress,
        admissionNumber: data.role === 'Student' ? data.admissionNumber : undefined,
        class: data.role === 'Student' ? data.studentClass : (data.role === 'Teacher' ? data.teacherClass : undefined),
        designation: data.role === 'Teacher' ? data.teacherDesignation : undefined,
      };

      const createdUser = await addUser(newUserInput);
      toast({
        title: 'User Created',
        description: `${createdUser.role} "${createdUser.name}" has been successfully added.`,
      });
      onUserCreated(); 
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error Creating User',
        description: error.message || 'Failed to add user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email or Phone Number *</FormLabel>
              <FormControl>
                <Input placeholder="user@example.com or +1234567890" {...field} />
              </FormControl>
              <FormDescription>Used for login and communication.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {currentRole === 'Student' && (
          <>
            <FormField
              control={form.control}
              name="admissionNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admission Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., S1001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="studentClass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 10A, Grade 5 Section B" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {currentRole === 'Teacher' && (
          <>
            <FormField
              control={form.control}
              name="teacherDesignation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select designation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Class Teacher">Class Teacher</SelectItem>
                      <SelectItem value="Subject Teacher">Subject Teacher</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="teacherClass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class(es) Handling</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 10A, 9B, 8C (comma-separated)" {...field} />
                  </FormControl>
                  <FormDescription>Optional. If Class Teacher, specify the main class here too.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCloseDialog} disabled={isLoading}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Create User
          </Button>
        </div>
      </form>
    </Form>
  );
}
