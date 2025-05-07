
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
import { Loader2, KeyRound, UserCheck, CornerDownLeft, Mail, Phone } from 'lucide-react';
import { sendOTP, verifyOTP, DEFAULT_TEST_OTP } from '@/services/otp';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';


const loginSchema = z.object({
  identifier: z.string().min(1, { message: 'Email or Phone number is required' })
  .refine(value => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[1-9]\d{1,14}$/; // Basic international phone number regex
    return emailRegex.test(value) || phoneRegex.test(value);
  }, { message: 'Please enter a valid email or phone number (e.g., +1234567890).' }),
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
  const [identifierValue, setIdentifierValue] = React.useState('');
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

  const verifyAndLogin = async (identifier: string, otp: string) => {
    setIsLoading(true);
    try {
      const response = await verifyOTP(identifier, otp);
      if (response.success && response.user) {
          await login(response.user); 
          toast({
            title: 'Login Successful',
            description: `Welcome back, ${response.user.name}!`,
          });
          // Router will redirect based on AuthProvider's logic
      } else if (response.success && !response.user) {
        toast({
          title: 'OTP Verified, User Not Found',
          description: 'OTP is correct, but no user account is associated with this identifier. Please ensure you have signed up.',
          variant: 'destructive',
        });
         setOtpSent(false); // Go back to identifier step if user not found
      } else {
        toast({
          title: 'Invalid OTP',
          description: response.message || 'The OTP entered is incorrect.',
          variant: 'destructive',
        });
        otpForm.setError('otp', { message: response.message || 'Invalid OTP' });
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
  }


  const handleLoginSubmit = async (data: LoginFormData) => {
    const isResend = otpSent;
    if (!isResend) setIsLoading(true);
    else setIsResendingOtp(true);

    try {
      await sendOTP(data.identifier);
      setIdentifierValue(data.identifier);
      setOtpSent(true);
      toast({
        title: isResend ? 'OTP Resent' : 'OTP Sent',
        description: `An OTP has been sent to ${data.identifier}. (MOCK: Use OTP "${DEFAULT_TEST_OTP}" or check browser console).`,
        duration: 7000,
      });
      otpForm.clearErrors('otp');
      otpForm.resetField('otp');
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
    await verifyAndLogin(identifierValue, data.otp);
  };


  return (
    <div className="space-y-6">
      {!otpSent ? (
        <>
            <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-6">
                <FormField
                control={loginForm.control}
                name="identifier"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-base">School Email or Phone</FormLabel>
                    <FormControl>
                       <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           {field.value?.includes('@') ? <Mail className="h-5 w-5 text-muted-foreground" /> : <Phone className="h-5 w-5 text-muted-foreground" />}
                         </div>
                        <Input
                            type="text"
                            placeholder="e.g., user@school.com or +1234567890"
                            {...field}
                            className="text-base py-6 pl-10" 
                            aria-describedby="identifier-description"
                         />
                        </div>
                    </FormControl>
                    <FormDescription id="identifier-description" className="text-xs">
                        Enter your registered credential. For testing, use OTP "<code className="bg-muted px-1 py-0.5 rounded text-xs">{DEFAULT_TEST_OTP}</code>" or check console.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full py-6 text-base" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <KeyRound className="mr-2 h-5 w-5" />}
                Send OTP / Login
                </Button>
            </form>
            </Form>
            
         </>
      ) : (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-semibold">Verify Your Identity</h3>
                <p className="text-muted-foreground">
                Enter the 6-digit OTP sent to <strong className="text-primary">{identifierValue}</strong>.
                (MOCK: Use OTP "<code className="bg-muted px-1 py-0.5 rounded text-xs">{DEFAULT_TEST_OTP}</code>" or check browser console).
                </p>
            </div>
            <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-6">
                <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-base">One-Time Password (OTP)</FormLabel>
                    <FormControl>
                        <Input
                            placeholder="------"
                            maxLength={6}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            {...field}
                            className="text-center text-2xl tracking-[0.5em] py-6 font-mono"
                            autoFocus
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full py-6 text-base" disabled={isLoading || isResendingOtp}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserCheck className="mr-2 h-5 w-5" />}
                Verify &amp; Login
                </Button>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => { setOtpSent(false); loginForm.reset({ identifier: identifierValue }); }}
                        disabled={isLoading || isResendingOtp}
                        className="w-full sm:w-auto"
                    >
                        <CornerDownLeft className="mr-2 h-4 w-4"/> Change Email/Phone
                    </Button>
                    <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => handleLoginSubmit({ identifier: identifierValue })}
                        disabled={isLoading || isResendingOtp}
                        className="w-full sm:w-auto"
                    >
                        {isResendingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Resend OTP
                    </Button>
                </div>
            </form>
            </Form>
        </div>
      )}
    </div>
  );
}
