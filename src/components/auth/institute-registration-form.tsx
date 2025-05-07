
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building, CalendarDays, CheckCircle, AlertTriangle } from 'lucide-react';
import { registerInstitute } from '@/services/school';
import type { InstituteRegistrationInput } from '@/services/school';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

const instituteTypes = ['School', 'College', 'Coaching Center', 'University', 'Other'] as const;

const instituteRegistrationSchema = z.object({
  instituteName: z.string().min(3, { message: 'Institute name must be at least 3 characters' }).max(100),
  instituteType: z.enum(instituteTypes, { required_error: 'Please select an institute type' }),
  address: z.string().min(5, { message: 'Address must be at least 5 characters' }).max(200),
  city: z.string().min(2, { message: 'City must be at least 2 characters' }).max(50),
  state: z.string().min(2, { message: 'State must be at least 2 characters' }).max(50),
  pincode: z.string().regex(/^\d{5,6}$/, { message: 'Pincode must be 5 or 6 digits' }),
  contactNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' }),
  adminEmail: z.string().email({ message: 'Invalid email address' }),
});

type InstituteRegistrationFormData = z.infer<typeof instituteRegistrationSchema>;

export function InstituteRegistrationForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [registrationSuccess, setRegistrationSuccess] = React.useState(false);
  const [generatedSchoolCode, setGeneratedSchoolCode] = React.useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<InstituteRegistrationFormData>({
    resolver: zodResolver(instituteRegistrationSchema),
    defaultValues: {
      instituteName: '',
      instituteType: undefined,
      address: '',
      city: '',
      state: '',
      pincode: '',
      contactNumber: '',
      adminEmail: '',
    },
  });

  const onSubmit = async (data: InstituteRegistrationFormData) => {
    setIsLoading(true);
    setRegistrationSuccess(false);
    setGeneratedSchoolCode(null);
    try {
      const input: InstituteRegistrationInput = { ...data };
      const result = await registerInstitute(input);
      if (result && result.schoolCode) {
        setGeneratedSchoolCode(result.schoolCode);
        setRegistrationSuccess(true);
        toast({
          title: 'Institute Registered Successfully!',
          description: (
            <div>
              <p>School Code: <strong>{result.schoolCode}</strong></p>
              <p>Admin Email: {data.adminEmail}</p>
              <p className="mt-2">Please use this School Code and Admin Email to create the admin account via the Signup page.</p>
            </div>
          ),
          variant: 'default',
          duration: 15000, // Keep toast longer for copying code
        });
        form.reset(); // Clear the form
      } else {
        throw new Error(result?.message || 'Registration failed. School code might not have been generated.');
      }
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (registrationSuccess && generatedSchoolCode) {
    return (
      <div className="space-y-6 text-center p-8 bg-card rounded-lg shadow-md border border-primary">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-semibold">Registration Successful!</h2>
        <p className="text-muted-foreground">
          Your institute, <strong>{form.getValues('instituteName') || 'Your Institute'}</strong>, has been registered.
        </p>
        <div className="p-4 bg-muted rounded-md">
          <p className="text-sm">Your unique School Code is:</p>
          <p className="text-2xl font-bold text-primary tracking-wider my-2">{generatedSchoolCode}</p>
          <p className="text-sm">Admin Email: <strong>{form.getValues('adminEmail')}</strong></p>
        </div>
        <p className="text-sm text-muted-foreground">
          Please use this School Code and Admin Email to create the primary admin account through the regular signup process.
        </p>
        <Button onClick={() => router.push('/signup')} className="w-full mt-4">
          Go to Signup Page
        </Button>
        <Button onClick={() => { setRegistrationSuccess(false); setGeneratedSchoolCode(null); }} variant="link" className="w-full mt-2">
          Register Another Institute
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="instituteName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Institute Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., City Public School" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="instituteType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Institute Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {instituteTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Address (Street, Area) *</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., 123 Main Street, Knowledge Park" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., New Delhi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Delhi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pincode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pincode *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 110001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="contactNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Number *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., +919876543210" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="adminEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Admin Email ID *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., admin@institute.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-1 bg-muted p-3 rounded-md">
            <FormLabel className="flex items-center text-muted-foreground"><CalendarDays className="mr-2 h-4 w-4" />Date of Registration</FormLabel>
            <Input value={format(new Date(), "PPP p")} readOnly className="text-base border-0 bg-transparent shadow-none"/>
            <FormDescription>This is automatically set to the current date and time upon submission.</FormDescription>
        </div>


        <Button type="submit" className="w-full py-3 text-lg" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Building className="mr-2 h-5 w-5" />}
          Register Institute
        </Button>
      </form>
    </Form>
  );
}
