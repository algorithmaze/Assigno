'use client';

// TODO: Firebase - Import necessary Firebase modules (e.g., getFirestore, doc, setDoc from 'firebase/firestore')
// import { getFirestore, doc, setDoc } from 'firebase/firestore';
// import { db } from '@/lib/firebase'; // Assuming you have a firebase.ts setup file
// TODO: Firebase - Import Firebase Auth functions (e.g., createUserWithEmailAndPassword, sendEmailVerification) if using email/password auth
// import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';


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
import { Loader2, Mail, Phone } from 'lucide-react'; 
import { sendOTP, verifyOTP, DEFAULT_TEST_OTP, OTP_BYPASS_ADMIN_EMAIL, OTP_BYPASS_SCHOOL_CODE } from '@/services/otp'; 
import { getSchoolDetails } from '@/services/school'; 
import type { SchoolDetails } from '@/services/school';
import { useAuth, type User } from '@/context/auth-context'; 
import { useRouter } from 'next/navigation';
import { addUser as createUserService, sampleAdminCredentials, sampleStudentCredentials } from '@/services/users';

const signupStep1Schema = z.object({
  identifier: z.string().min(1, { message: 'Email or Phone number is required' })
    .refine(value => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[1-9]\d{1,14}$/; 
      return emailRegex.test(value) || phoneRegex.test(value);
    }, { message: 'Please enter a valid email or phone number (e.g., +1234567890).' }),
  schoolCode: z.string().min(3, { message: 'School code is required' }),
  role: z.enum(['Student', 'Teacher', 'Admin'], { required_error: 'Please select a role' }),
});

const signupStep2Schema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 digits' }),
  name: z.string().min(2, { message: 'Name is required' }),
  admissionNumber: z.string().optional(), 
  class: z.string().optional(),
  designation: z.enum(['Class Teacher', 'Subject Teacher']).optional(),
}).refine((data) => {
  return true; 
});


type SignupStep1Data = z.infer<typeof signupStep1Schema>;
type SignupStep2Data = z.infer<typeof signupStep2Schema>;

export function SignupForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [step, setStep] = React.useState(1); 
  const [formData, setFormData] = React.useState<Partial<SignupStep1Data & SignupStep2Data>>({});
  const [schoolDetails, setSchoolDetails] = React.useState<SchoolDetails | null>(null);
  const { toast } = useToast();
  const { login } = useAuth(); 
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
      designation: undefined,
    },
  });

  const handleStep1Submit = async (data: SignupStep1Data) => {
    setIsLoading(true);
    setFormData(data); 

    try {
       const fetchedSchoolDetails = await getSchoolDetails(data.schoolCode);
       if (!fetchedSchoolDetails) {
         step1Form.setError('schoolCode', { message: 'Invalid or unrecognized school code.' });
         throw new Error('Invalid school code');
       }
       setSchoolDetails(fetchedSchoolDetails);

       if (data.role === 'Admin' && fetchedSchoolDetails.adminEmail.toLowerCase() !== data.identifier.toLowerCase()) {
           step1Form.setError('identifier', { message: "For Admin role, email must match the registered institute admin email."});
           throw new Error("Admin email mismatch.");
       }

      let otpBypass = false;
      if (
        (data.role === 'Admin' && data.identifier === OTP_BYPASS_ADMIN_EMAIL && data.schoolCode === OTP_BYPASS_SCHOOL_CODE) ||
        (data.role === 'Student' && sampleStudentCredentials.some(s => s.identifier === data.identifier && s.schoolCode === data.schoolCode))
      ) {
        otpBypass = true;
        console.log(`OTP bypass activated for ${data.identifier}`);
      }

      if (!otpBypass) {
        await sendOTP(data.identifier); 
        toast({
          title: 'OTP Sent',
          description: `An OTP has been sent to ${data.identifier}. (MOCK: Use OTP "${DEFAULT_TEST_OTP}" or check browser console).`,
          duration: 7000,
        });
      } else {
         toast({
          title: 'OTP Bypassed (Demo User)',
          description: `Proceeding to next step for ${data.identifier}. Enter any 6 digits for OTP if prompted, or it will be auto-filled.`,
          duration: 7000,
        });
      }
      
      setStep(2); 
      const defaultName = (otpBypass && data.role === 'Admin' && data.identifier === OTP_BYPASS_ADMIN_EMAIL)
        ? sampleAdminCredentials.name
        : (otpBypass && data.role === 'Student' && sampleStudentCredentials.find(s => s.identifier === data.identifier))
        ? sampleStudentCredentials.find(s => s.identifier === data.identifier)?.name || ''
        : '';

      const defaultAdmissionNumber = (otpBypass && data.role === 'Student')
        ? sampleStudentCredentials.find(s => s.identifier === data.identifier)?.admissionNumber || ''
        : '';

      const defaultClass = (otpBypass && data.role === 'Student')
        ? sampleStudentCredentials.find(s => s.identifier === data.identifier)?.class || ''
        : '';
      
      const otpValueForReset = otpBypass ? DEFAULT_TEST_OTP : '';

      step2Form.reset({
        otp: otpValueForReset, 
        name: defaultName,
        admissionNumber: defaultAdmissionNumber,
        class: defaultClass,
        designation: undefined, 
      });

    } catch (error: any) {
      console.error('Signup Step 1 Error:', error);
      if (error.message !== 'Invalid school code' && error.message !== "Admin email mismatch.") {
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
      let otpVerifiedUser: User | undefined = undefined;
      if (
        (fullData.role === 'Admin' && fullData.identifier === OTP_BYPASS_ADMIN_EMAIL && fullData.schoolCode === OTP_BYPASS_SCHOOL_CODE && data.otp === DEFAULT_TEST_OTP) ||
        (fullData.role === 'Student' && sampleStudentCredentials.some(s => s.identifier === fullData.identifier && s.schoolCode === fullData.schoolCode) && data.otp === DEFAULT_TEST_OTP)
      ) {
        console.log(`OTP check bypassed and validated for demo user ${fullData.identifier}`);
        // For demo users, we can synthesize the user object or fetch if they were pre-added
        if (fullData.role === 'Admin') {
            otpVerifiedUser = { ...sampleAdminCredentials, id: sampleAdminCredentials.identifier, schoolCode: fullData.schoolCode, schoolName: schoolDetails?.schoolName, schoolAddress: schoolDetails?.address } as User;
        } else if (fullData.role === 'Student') {
            const studentCred = sampleStudentCredentials.find(s => s.identifier === fullData.identifier);
            if (studentCred) {
                 otpVerifiedUser = { ...studentCred, id: studentCred.identifier, schoolCode: fullData.schoolCode, schoolName: schoolDetails?.schoolName, schoolAddress: schoolDetails?.address } as User;
            }
        }

      } else {
        const otpResponse = await verifyOTP(fullData.identifier, data.otp);
        if (!otpResponse.success) {
          step2Form.setError('otp', { message: otpResponse.message || 'Invalid OTP' });
          throw new Error(otpResponse.message || 'Invalid OTP');
        }
        otpVerifiedUser = otpResponse.user; // User object from verification, if exists
      }


       const newUserInput: Omit<User, 'id'> & { id?: string} = { 
          name: fullData.name,
          email: fullData.identifier.includes('@') ? fullData.identifier : otpVerifiedUser?.email,
          phoneNumber: !fullData.identifier.includes('@') ? fullData.identifier : otpVerifiedUser?.phoneNumber,
          role: fullData.role,
          schoolCode: fullData.schoolCode,
          schoolName: schoolDetails?.schoolName,
          schoolAddress: schoolDetails?.address,
          profilePictureUrl: undefined, 
          admissionNumber: fullData.role === 'Student' ? fullData.admissionNumber : undefined,
          class: fullData.role === 'Student' || (fullData.role === 'Teacher' && fullData.designation === 'Class Teacher') ? fullData.class : (fullData.role === 'Teacher' ? fullData.class : undefined),
          designation: fullData.role === 'Teacher' ? fullData.designation : (fullData.role === 'Admin' ? 'Administrator' : undefined),
       };
       
       if (otpVerifiedUser?.id) {
           newUserInput.id = otpVerifiedUser.id;
       }

       const createdUser = await createUserService(newUserInput);

       await login(createdUser); 

      toast({
        title: 'Signup Successful',
        description: `Welcome, ${createdUser.name}! Your account has been created.`,
      });
      router.push('/dashboard'); 

    } catch (error: any) {
      console.error('Signup Step 2 Error:', error);
       if (error.message !== (formData.otp || 'Invalid OTP') ) { 
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

   const currentRole = step1Form.watch('role') || formData.role;
   const currentIdentifier = step1Form.watch('identifier') || formData.identifier || '';


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
                  <FormLabel>School Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your unique school code" {...field} className="py-5"/>
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
                  <FormLabel>Your Email or Phone Number *</FormLabel>
                  <FormControl>
                     <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         {field.value?.includes('@') ? <Mail className="h-5 w-5 text-muted-foreground" /> : <Phone className="h-5 w-5 text-muted-foreground" />}
                       </div>
                      <Input placeholder="e.g., user@school.com or +1234567890" {...field} className="py-5 pl-10"/>
                    </div>
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
                    <FormLabel>Your Role *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger className="py-5">
                            <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Student">Student</SelectItem>
                        <SelectItem value="Teacher">Teacher</SelectItem>
                        <SelectItem value="Admin">Admin (Requires matching institute admin email)</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <Button type="submit" className="w-full py-5" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Verify &amp; Send OTP
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...step2Form}>
          <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
             <p className="text-sm text-muted-foreground">
              Verifying for <strong>{schoolDetails?.schoolName}</strong>. Role: <strong>{currentRole}</strong>. Enter OTP sent to {currentIdentifier}.
             {(
                (formData.role === 'Admin' && formData.identifier === OTP_BYPASS_ADMIN_EMAIL && formData.schoolCode === OTP_BYPASS_SCHOOL_CODE) ||
                (formData.role === 'Student' && sampleStudentCredentials.some(s => s.identifier === formData.identifier && s.schoolCode === formData.schoolCode))
            ) && (
              <span className="font-semibold">(MOCK: Use OTP "{DEFAULT_TEST_OTP}")</span>
             )}

            </p>
            <FormField
              control={step2Form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OTP Code *</FormLabel>
                  <FormControl>
                    <Input
                        placeholder="------"
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        {...field}
                        className="py-5 text-center text-lg tracking-[0.3em]"
                        autoFocus
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
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} className="py-5"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {currentRole === 'Student' && (
                 <>
                    <FormField
                    control={step2Form.control}
                    name="admissionNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Admission Number *</FormLabel>
                        <FormControl>
                            <Input placeholder="Your admission number" {...field} className="py-5"/>
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
                        <FormLabel>Class *</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 10A, Grade 5B" {...field} className="py-5"/>
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
                        control={step2Form.control}
                        name="designation"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Designation *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger className="py-5">
                                    <SelectValue placeholder="Select your designation" />
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
                        control={step2Form.control}
                        name="class" 
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Class(es) Handling (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., 10A, 9B (comma-separated)" {...field} className="py-5"/>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </>
             )}

            <Button type="submit" className="w-full py-5" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Verify OTP &amp; Complete Signup
            </Button>
             <Button variant="link" size="sm" onClick={() => {setStep(1); step2Form.reset(); /* Keep step1Form values */ }} disabled={isLoading} className="w-full">
               Back to Previous Step
             </Button>
             {!(
                (formData.role === 'Admin' && formData.identifier === OTP_BYPASS_ADMIN_EMAIL && formData.schoolCode === OTP_BYPASS_SCHOOL_CODE) ||
                (formData.role === 'Student' && sampleStudentCredentials.some(s => s.identifier === formData.identifier && s.schoolCode === formData.schoolCode))
             ) && (
                <Button variant="link" size="sm" onClick={() => handleStep1Submit(formData as SignupStep1Data)} disabled={isLoading} className="w-full">
                  Resend OTP
                </Button>
             )}
          </form>
        </Form>
      )}
    </>
  );
}

