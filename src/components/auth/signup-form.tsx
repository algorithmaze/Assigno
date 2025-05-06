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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { sendOTP, verifyOTP } from '@/services/otp'; // Assuming service functions
import { getSchoolDetails } from '@/services/school'; // Assuming service function
import type { SchoolDetails } from '@/services/school';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

const signupStep1Schema = z.object({
  identifier: z.string().min(1, { message: 'Email or Phone number is required' }),
  schoolCode: z.string().min(3, { message: 'School code is required' }),
  role: z.enum(['Student', 'Teacher', 'Admin'], { required_error: 'Please select a role' }),
});

const signupStep2Schema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 digits' }),
  name: z.string().min(2, { message: 'Name is required' }),
  admissionNumber: z.string().optional(), // Required for students conditionally
  class: z.string().optional(), // Required for students conditionally, optional for teachers
}).refine((data) => {
  // Conditional validation: admissionNumber and class required if role is Student
  if (/* role === 'Student' && */ (!data.admissionNumber || !data.class)) {
    // We can't access the role directly here easily without more complex state/context.
    // A better approach might be server-side validation or splitting forms further.
    // For now, rely on UI logic to show/hide fields and basic optionality.
    // More robust validation would happen on the backend.
    // console.warn("Client-side conditional validation skipped for admissionNumber/class");
  }
  return true;
});


type SignupStep1Data = z.infer<typeof signupStep1Schema>;
type SignupStep2Data = z.infer<typeof signupStep2Schema>;

export function SignupForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [step, setStep] = React.useState(1); // 1: Initial info, 2: OTP + Details
  const [formData, setFormData] = React.useState<Partial<SignupStep1Data & SignupStep2Data>>({});
  const [schoolDetails, setSchoolDetails] = React.useState<SchoolDetails | null>(null);
  const { toast } = useToast();
  const { login } = useAuth(); // Use login after successful signup
  const router = useRouter();

  const step1Form = useForm<SignupStep1Data>({
    resolver: zodResolver(signupStep1Schema),
    defaultValues: {
      identifier: '',
      schoolCode: '',
      role: undefined,
    },
  });

  const step2Form = useForm<SignupStep2Data>({
    resolver: zodResolver(signupStep2Schema),
    defaultValues: {
      otp: '',
      name: '',
      admissionNumber: '',
      class: '',
    },
  });

  const handleStep1Submit = async (data: SignupStep1Data) => {
    setIsLoading(true);
    setFormData(data); // Store step 1 data

    try {
       // 1. Verify School Code
       const fetchedSchoolDetails = await getSchoolDetails(data.schoolCode);
       if (!fetchedSchoolDetails) {
         step1Form.setError('schoolCode', { message: 'Invalid school code' });
         throw new Error('Invalid school code');
       }
       setSchoolDetails(fetchedSchoolDetails);


      // 2. Send OTP
      // TODO: Validate if identifier is email or phone if needed
      await sendOTP(data.identifier); // Call your API to send OTP
      setStep(2); // Move to OTP and details step
      toast({
        title: 'OTP Sent',
        description: `An OTP has been sent to ${data.identifier}.`,
      });
    } catch (error: any) {
      console.error('Signup Step 1 Error:', error);
      if (error.message !== 'Invalid school code') {
        toast({
            title: 'Error',
            description: error.message || 'Failed to send OTP or verify school. Please check details and try again.',
            variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (data: SignupStep2Data) => {
    setIsLoading(true);
    const fullData = { ...formData, ...data } as SignupStep1Data & SignupStep2Data;

    try {
      // 1. Verify OTP
      const otpResponse = await verifyOTP(fullData.identifier, data.otp);
      if (!otpResponse.success) {
        step2Form.setError('otp', { message: otpResponse.message || 'Invalid OTP' });
        throw new Error('Invalid OTP');
      }

      // 2. Call Backend Signup API with all data
      console.log('Submitting signup data:', fullData);
      // const signupResponse = await yourSignupApiCall(fullData); // Replace with your actual API call

      // TODO: Replace with actual backend signup logic
      // Simulate successful signup and login
       const newUser = {
          id: 'user-' + Math.random().toString(36).substring(7),
          name: fullData.name,
          email: fullData.identifier.includes('@') ? fullData.identifier : undefined,
          phoneNumber: !fullData.identifier.includes('@') ? fullData.identifier : undefined,
          role: fullData.role,
          schoolCode: fullData.schoolCode,
          admissionNumber: fullData.role === 'Student' ? fullData.admissionNumber : undefined,
          class: fullData.role === 'Student' || fullData.role === 'Teacher' ? fullData.class : undefined,
          // Add profile picture later
       };
       await login(newUser); // Log the user in


      toast({
        title: 'Signup Successful',
        description: 'Your account has been created. Welcome!',
      });
      router.push('/dashboard'); // Redirect to dashboard

    } catch (error: any) {
      console.error('Signup Step 2 Error:', error);
       if (error.message !== 'Invalid OTP') {
        toast({
            title: 'Signup Failed',
            description: error.message || 'Could not complete signup. Please try again.',
            variant: 'destructive',
        });
       }
    } finally {
      setIsLoading(false);
    }
  };

   const isStudentRole = step1Form.watch('role') === 'Student';
   const isTeacherRole = step1Form.watch('role') === 'Teacher';


  return (
    <>
      {step === 1 ? (
        <Form {...step1Form}>
          <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
             <FormField
              control={step1Form.control}
              name="schoolCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your unique school code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={step1Form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Email or Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., user@school.com or +1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={step1Form.control}
                name="role"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Your Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Student">Student</SelectItem>
                        <SelectItem value="Teacher">Teacher</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Verify & Send OTP
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...step2Form}>
          <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
             <p className="text-sm text-muted-foreground">
              Verifying for <strong>{schoolDetails?.schoolName}</strong>. Enter OTP sent to {formData.identifier}.
            </p>
            <FormField
              control={step2Form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OTP Code</FormLabel>
                  <FormControl>
                    <Input
                        placeholder="------"
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        {...field}
                     />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={step2Form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isStudentRole && (
                 <>
                    <FormField
                    control={step2Form.control}
                    name="admissionNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Admission Number</FormLabel>
                        <FormControl>
                            <Input placeholder="Your admission number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={step2Form.control}
                    name="class"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Class</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 10A, Grade 5B" {...field} />
                        </FormControl>
                         <FormMessage />
                        </FormItem>
                    )}
                    />
                 </>
            )}
             {isTeacherRole && (
                <FormField
                    control={step2Form.control}
                    name="class"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Class Teacher For (Optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 10A, Grade 5B" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
             )}
            {/* TODO: Add Profile Picture upload field */}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Verify OTP & Complete Signup
            </Button>
             <Button variant="link" size="sm" onClick={() => setStep(1)} disabled={isLoading} className="w-full">
               Back to Previous Step
             </Button>
              {/* TODO: Add Resend OTP functionality */}
              <Button variant="link" size="sm" onClick={() => handleStep1Submit(formData as SignupStep1Data)} disabled={isLoading} className="w-full">
               Resend OTP
             </Button>
          </form>
        </Form>
      )}
    </>
  );
}
