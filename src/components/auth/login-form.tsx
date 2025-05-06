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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { sendOTP, verifyOTP } from '@/services/otp'; // Assuming you have these service functions
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  identifier: z.string().min(1, { message: 'Email or Phone number is required' }),
});

const otpSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 digits' }),
});

type LoginFormData = z.infer<typeof loginSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [otpSent, setOtpSent] = React.useState(false);
  const [identifierValue, setIdentifierValue] = React.useState(''); // Store identifier for OTP step
  const { toast } = useToast();
  const { login } = useAuth();
  const router = useRouter();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
    },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const handleLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // TODO: Validate if identifier is email or phone if needed
      await sendOTP(data.identifier); // Call your API to send OTP
      setIdentifierValue(data.identifier); // Store the identifier
      setOtpSent(true);
      toast({
        title: 'OTP Sent',
        description: `An OTP has been sent to ${data.identifier}.`,
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({
        title: 'Error',
        description: 'Failed to send OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (data: OtpFormData) => {
    setIsLoading(true);
    try {
      const response = await verifyOTP(identifierValue, data.otp); // Call your API to verify OTP
      if (response.success) {
        // TODO: On successful verification, get user details/token from backend
        // For now, simulate login with placeholder data
        await login({
          id: 'user-' + Math.random().toString(36).substring(7),
          name: 'Logged In User',
          email: identifierValue.includes('@') ? identifierValue : undefined,
          phoneNumber: !identifierValue.includes('@') ? identifierValue : undefined,
          role: 'Student', // Determine role from backend response
          schoolCode: 'XYZ123', // Determine from backend
        });
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });
         router.push('/dashboard'); // Redirect to dashboard or appropriate page
      } else {
        toast({
          title: 'Invalid OTP',
          description: response.message || 'The OTP entered is incorrect.',
          variant: 'destructive',
        });
        otpForm.setError('otp', { message: 'Invalid OTP' });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!otpSent ? (
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
            <FormField
              control={loginForm.control}
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send OTP
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
             <p className="text-sm text-muted-foreground">
              Enter the 6-digit OTP sent to {identifierValue}.
            </p>
            <FormField
              control={otpForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OTP Code</FormLabel>
                  <FormControl>
                    {/* Basic OTP Input - Consider using a dedicated OTP input component for better UX */}
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Verify OTP & Login
            </Button>
             <Button variant="link" size="sm" onClick={() => setOtpSent(false)} disabled={isLoading} className="w-full">
               Change Email/Phone
             </Button>
             {/* TODO: Add Resend OTP functionality */}
             <Button variant="link" size="sm" onClick={() => handleLoginSubmit({ identifier: identifierValue })} disabled={isLoading} className="w-full">
               Resend OTP
             </Button>
          </form>
        </Form>
      )}
    </>
  );
}
