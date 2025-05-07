
// TODO: Firebase - Import necessary Firebase modules (e.g., getFirestore, doc, setDoc, getDoc)
// import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
// import { db } from '@/lib/firebase'; // Assuming you have a firebase.ts setup file

import type { User } from '@/context/auth-context';


export interface OTPVerificationResponse {
  success: boolean;
  message?: string;
  user?: User; // User might be returned if OTP verification implies user existence/creation in some flows
}

// Mock OTP storage (in-memory, will not persist across server restarts or for different users in a real scenario)
const mockOtpStore: Map<string, { otp: string, timestamp: number }> = new Map();
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
export const DEFAULT_TEST_OTP = "000000"; // Default OTP for testing, EXPORTED


export async function sendOTP(identifier: string): Promise<void> {
  // For any user in a mock/dev environment, we'll use the default predictable OTP.
  const generatedOtp = DEFAULT_TEST_OTP; 
  console.log(`Using default OTP ${DEFAULT_TEST_OTP} for user: ${identifier} (for testing).`);
  
  mockOtpStore.set(identifier, { otp: generatedOtp, timestamp: Date.now() });
  
  // --- Real Email Sending Logic Would Go Here ---
  // Example: Using a service like Nodemailer or SendGrid if self-hosting, or Firebase Cloud Functions with an email service.
  // if (identifier.includes('@')) { // Assuming email
  //   await emailService.send({
  //     to: identifier,
  //     subject: 'Your Assigno OTP Code',
  //     text: `Your One-Time Password for Assigno is: ${generatedOtp}. It is valid for 5 minutes.`,
  //     html: `<p>Your One-Time Password for Assigno is: <strong>${generatedOtp}</strong>. It is valid for 5 minutes.</p>`,
  //   });
  // } else { // Assuming phone number
  //   await smsService.send({
  //     to: identifier, // Ensure it's in E.164 format
  //     body: `Your Assigno OTP is: ${generatedOtp}. Valid for 5 minutes.`
  //   });
  // }
  // --- End of Real Email Sending Logic ---

  console.log(`OTP for ${identifier}: ${generatedOtp}. (MOCK: This OTP is for testing. In a real app, it would be sent via email/SMS. It expires in 5 minutes).`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50)); 
  return;
}

export async function verifyOTP(identifier: string, otpToVerify: string): Promise<OTPVerificationResponse> {
  console.log(`Verifying OTP ${otpToVerify} for ${identifier}`);
  
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay

  const storedOtpData = mockOtpStore.get(identifier);

  if (!storedOtpData) {
    return { success: false, message: 'No OTP request found for this identifier or OTP expired. Please request a new OTP.' };
  }

  if (Date.now() - storedOtpData.timestamp > OTP_EXPIRY_MS) {
    mockOtpStore.delete(identifier); // OTP expired
    return { success: false, message: 'OTP has expired. Please request a new one.' };
  }

  if (storedOtpData.otp === otpToVerify) {
    mockOtpStore.delete(identifier); // OTP used, remove it

    // Attempt to find if the user already exists
    try {
        // Dynamically import users.ts to avoid circular dependencies at module load time
        const usersModule = await import('./users');
        if (typeof usersModule.ensureMockDataInitialized === 'function') { // Check if function exists
            await usersModule.ensureMockDataInitialized();
        }
        const allUsers = await usersModule.fetchAllUsers(); // Fetches all users, then filters
        const existingUser = allUsers.find(u => 
          (u.email && u.email.toLowerCase() === identifier.toLowerCase()) || 
          (u.phoneNumber && u.phoneNumber === identifier)
        );


        if (existingUser) {
            // User exists, successful verification and user found
            return { success: true, message: 'OTP verification successful.', user: existingUser };
        } else {
            // OTP is correct, but no user found. This might be part of a signup flow.
            // Or, if it's strictly login, it means user needs to sign up.
            return { success: true, message: 'OTP verification successful. User may be new.' }; // No user data to return yet
        }
    } catch (error) {
        console.error("Error fetching user after OTP verification:", error);
        // OTP was correct, but couldn't check/fetch user data.
        return { success: false, message: 'OTP verified, but failed to retrieve user details.' };
    }
  }

  return { success: false, message: 'The OTP entered is incorrect.' };
}
