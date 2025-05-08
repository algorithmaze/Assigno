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
import { Loader2, KeyRound, UserCheck, CornerDownLeft, Mail, Phone, Users } from 'lucide-react';
import { sendOTP, verifyOTP, DEFAULT_TEST_OTP, OTP_BYPASS_ADMIN_EMAIL, OTP_BYPASS_SCHOOL_CODE } from '@/services/otp';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { sampleCredentials, type SampleUserKey } from '@/services/users';


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
          // Router will redirect based on AuthProvider's logic (typically to /dashboard)
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

    let otpBypass = false;
    
    // Check for OTP_BYPASS_ADMIN_EMAIL first
    if (data.identifier === OTP_BYPASS_ADMIN_EMAIL) {
        otpBypass = true;
    } else {
        // Check against sampleCredentials (students or other bypass roles)
        const sampleUserKeys = Object.keys(sampleCredentials) as SampleUserKey[];
        for (const key of sampleUserKeys) {
            const cred = sampleCredentials[key];
            if (cred.identifier === data.identifier && cred.schoolCode === OTP_BYPASS_SCHOOL_CODE) {
                otpBypass = true;
                break;
            }
        }
    }


    try {
      if (!otpBypass) {
        await sendOTP(data.identifier);
        toast({
            title: isResend ? 'OTP Resent' : 'OTP Sent',
            description: `An OTP has been sent to ${data.identifier}. (MOCK: Use OTP "${DEFAULT_TEST_OTP}" or check browser console).`,
            duration: 7000,
        });
      } else {
        toast({
            title: 'OTP Bypassed (Demo User)',
            description: `Proceeding to next step for ${data.identifier}. Enter OTP "${DEFAULT_TEST_OTP}".`,
            duration: 7000,
        });
      }
      setIdentifierValue(data.identifier);
      setOtpSent(true);
      otpForm.clearErrors('otp');
      otpForm.resetField('otp');
      if (otpBypass) {
        otpForm.setValue('otp', DEFAULT_TEST_OTP);
      }

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

  // Function to quickly fill form for sample users
  const fillSampleUser = (role: SampleUserKey) => {
     if (sampleCredentials && sampleCredentials[role]) {
        loginForm.setValue('identifier', sampleCredentials[role].identifier);
     } else {
        console.warn(`Sample credentials for role "${role}" not found.`);
        toast({title: "Error", description: `Sample user data for "${role}" is missing.`, variant: "destructive"});
     }
  }


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
                    <FormLabel className="text-sm sm:text-base">School Email or Phone</FormLabel>
                    <FormControl>
                       <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           {field.value?.includes('@') ? <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" /> : <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />}
                         </div>
                        <Input
                            type="text"
                            placeholder="e.g., user@school.com or +1234567890"
                            {...field}
                            className="text-sm sm:text-base py-5 sm:py-6 pl-10" 
                            aria-describedby="identifier-description"
                         />
                        </div>
                    </FormControl>
                    <FormDescription id="identifier-description" className="text-xs">
                        Enter your registered credential. For testing admin, use "<code className="bg-muted px-1 py-0.5 rounded text-xs">{OTP_BYPASS_ADMIN_EMAIL}</code>". OTP "<code className="bg-muted px-1 py-0.5 rounded text-xs">{DEFAULT_TEST_OTP}</code>" will be pre-filled.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full py-5 sm:py-6 text-sm sm:text-base" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <KeyRound className="mr-2 h-5 w-5" />}
                Send OTP / Login
                </Button>
            </form>
            </Form>
            
            {/* Sample User Login Buttons */}
            {process.env.NODE_ENV !== 'production' && sampleCredentials && Object.keys(sampleCredentials).length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-2"><Users className="h-4 w-4"/>Quick Logins (Demo Users)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(Object.keys(sampleCredentials) as SampleUserKey[]).map((key) => (
                        <Button 
                            key={key}
                            variant="outline" 
                            size="sm" 
                            onClick={() => fillSampleUser(key)}
                            className="text-xs py-4"
                        >
                            Login as {sampleCredentials[key]?.name || key}
                        </Button>
                    ))}
                </div>
                </div>
            )}
         </>
      ) : (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg sm:text-xl font-semibold">Verify Your Identity</h3>
                <p className="text-muted-foreground text-sm">
                Enter the 6-digit OTP sent to <strong className="text-primary">{identifierValue}</strong>.
                {(identifierValue === OTP_BYPASS_ADMIN_EMAIL || 
                 Object.values(sampleCredentials).some(cred => cred.identifier === identifierValue && cred.schoolCode === OTP_BYPASS_SCHOOL_CODE)
                )
                ? ` (MOCK: Use OTP "${DEFAULT_TEST_OTP}", it should be pre-filled).`
                : ` (MOCK: Use OTP "${DEFAULT_TEST_OTP}" or check browser console).`}
                </p>
            </div>
            <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-6">
                <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-sm sm:text-base">One-Time Password (OTP)</FormLabel>
                    <FormControl>
                        <Input
                            placeholder="------"
                            maxLength={6}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            {...field}
                            className="text-center text-xl sm:text-2xl tracking-[0.3em] sm:tracking-[0.5em] py-5 sm:py-6 font-mono"
                            autoFocus
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full py-5 sm:py-6 text-sm sm:text-base" disabled={isLoading || isResendingOtp}>
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
                        className="w-full sm:w-auto text-xs"
                    >
                        <CornerDownLeft className="mr-2 h-4 w-4"/> Change Email/Phone
                    </Button>
                   {identifierValue !== OTP_BYPASS_ADMIN_EMAIL &&
                    !Object.values(sampleCredentials).some(cred => cred.identifier === identifierValue && cred.schoolCode === OTP_BYPASS_SCHOOL_CODE) && (
                     <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => handleLoginSubmit({ identifier: identifierValue })}
                        disabled={isLoading || isResendingOtp}
                        className="w-full sm:w-auto text-xs"
                      >
                        {isResendingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Resend OTP
                    </Button>
                   )}
                </div>
            </form>
            </Form>
        </div>
      )}
    </div>
  );
}
