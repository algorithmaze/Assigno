
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { sendOTP, verifyOTP, sampleCredentials } from '@/services/otp'; // Import sampleCredentials
import { useAuth, type User } from '@/context/auth-context'; // Import User type
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  identifier: z.string().min(1, { message: 'Email or Phone number is required' }),
  // Basic validation: check if it looks like an email or includes a '+' for phone
  // .refine(val => z.string().email().safeParse(val).success || val.includes('+'), {
  //   message: "Please enter a valid email or phone number (including country code)",
  // }),
});

const otpSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 digits' }),
});

type LoginFormData = z.infer<typeof loginSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResendingOtp, setIsResendingOtp] = React.useState(false);
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
    const isResend = otpSent; // Check if it's a resend request
    if (!isResend) setIsLoading(true);
    else setIsResendingOtp(true);

    try {
      await sendOTP(data.identifier);
      setIdentifierValue(data.identifier);
      setOtpSent(true); // Ensure OTP screen is shown/remains
      toast({
        title: isResend ? 'OTP Resent' : 'OTP Sent',
        description: `An OTP has been sent to ${data.identifier}. (For demo, use OTP from console or specific user's magic OTP).`,
      });
      // Clear previous OTP errors if any
      otpForm.clearErrors('otp');
      otpForm.resetField('otp'); // Clear the OTP input field on resend
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({
        title: 'Error',
        description: 'Failed to send OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
       if (!isResend) setIsLoading(false);
       else setIsResendingOtp(false);
    }
  };

  const handleOtpSubmit = async (data: OtpFormData) => {
    setIsLoading(true);
    try {
      const response = await verifyOTP(identifierValue, data.otp);
      if (response.success) {
          // If the response includes sample user data, use it
          if (response.user) {
              await login(response.user);
              toast({
                title: 'Login Successful',
                description: `Welcome back, ${response.user.name}!`,
              });
          } else {
             // Fallback for generic success (e.g., if magic OTP used with unknown identifier)
             // Create a very basic user object or handle as needed
             console.warn("OTP verified but no specific user data returned. Creating generic user.");
              const genericUser: User = {
                  id: 'user-' + Math.random().toString(36).substring(7),
                  name: 'Logged In User',
                  email: identifierValue.includes('@') ? identifierValue : undefined,
                  phoneNumber: !identifierValue.includes('@') ? identifierValue : undefined,
                  role: 'Student', // Default role or determine based on identifier pattern
                  schoolCode: 'samp123',
                  schoolName: 'Sample Sr. Sec. School',
                  schoolAddress: '456 School Road, Testville',
              };
              await login(genericUser);
              toast({
                title: 'Login Successful',
                description: 'Welcome back!',
              });
          }
         // Redirect is handled by AuthProvider's useEffect
         // router.push('/dashboard');
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

  // Function to quickly fill form for sample users
  const fillSampleUser = (role: 'student' | 'teacher' | 'admin') => {
    let targetIdentifier: string | undefined;
    switch (role) {
      case 'admin':
        targetIdentifier = sampleCredentials.adminAntony.identifier;
        break;
      case 'teacher':
        // You can pick one, e.g., Zara. Or add more buttons if needed.
        targetIdentifier = sampleCredentials.teacherZara.identifier;
        break;
      case 'student':
        // You can pick one, e.g., Mia.
        targetIdentifier = sampleCredentials.studentMia.identifier;
        break;
      default:
        console.warn(`No specific sample credential logic for role: ${role}`);
    }

    if (targetIdentifier) {
      loginForm.setValue('identifier', targetIdentifier);
    } else {
      toast({
        title: "Sample User Not Configured",
        description: `Quick login for '${role}' role is not set up for a specific user.`,
        variant: "destructive"
      });
    }
  }

  return (
    <>
      {!otpSent ? (
        <>
            <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                <FormField
                control={loginForm.control}
                name="identifier"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>School Email or Phone Number</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., student@school.com or +1234567890" {...field} />
                    </FormControl>
                    <FormDescription>
                        Use a sample email below or your own. OTP for samples is in console/user details.
                    </FormDescription>
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
            {/* Sample User Buttons */}
            <div className="mt-4 space-y-2 text-center">
                <p className="text-sm text-muted-foreground">Quick Login (Demo):</p>
                <div className="flex justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => fillSampleUser('student')}>Student (Mia)</Button>
                    <Button variant="outline" size="sm" onClick={() => fillSampleUser('teacher')}>Teacher (Zara)</Button>
                    <Button variant="outline" size="sm" onClick={() => fillSampleUser('admin')}>Admin (Antony)</Button>
                </div>
                 <p className="text-xs text-accent">
                    (Uses magic OTP: <strong>{sampleCredentials.adminAntony.otp}</strong> for above sample users)
                 </p>
            </div>
         </>
      ) : (
        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
             <p className="text-sm text-muted-foreground">
              Enter the 6-digit OTP sent to <strong>{identifierValue}</strong>.
             </p>
              <p className="text-xs text-center text-accent">
                 (For demo sample users, use OTP: <strong>{sampleCredentials.adminAntony.otp}</strong>)
              </p>
            <FormField
              control={otpForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OTP Code</FormLabel>
                  <FormControl>
                    {/* Consider using a dedicated OTP input component for better UX */}
                     <Input
                        placeholder="------"
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        {...field}
                        // Auto focus on OTP field when it appears
                        autoFocus
                      />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading || isResendingOtp}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Verify OTP & Login
            </Button>
             <div className="flex flex-col sm:flex-row justify-between gap-2">
                <Button variant="link" size="sm" onClick={() => { setOtpSent(false); loginForm.reset(); }} disabled={isLoading || isResendingOtp} className="flex-1">
                Change Email/Phone
                </Button>
                <Button
                    variant="link"
                    size="sm"
                    onClick={() => handleLoginSubmit({ identifier: identifierValue })}
                    disabled={isLoading || isResendingOtp}
                    className="flex-1"
                >
                    {isResendingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Resend OTP
                </Button>
             </div>
          </form>
        </Form>
      )}
    </>
  );
}
