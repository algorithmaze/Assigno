import type { User } from '@/context/auth-context'; // Import User type

/**
 * Interface representing the response from an OTP verification request.
 */
export interface OTPVerificationResponse {
  /**
   * Indicates whether the OTP verification was successful.
   */
  success: boolean;

  /**
   * An optional message providing additional information about the verification result.
   */
  message?: string;

  /**
   * Optional user data returned upon successful verification.
   * This is a temporary addition for sample user login.
   * In a real backend, this might be a token or user session details.
   */
  user?: User;
}

/**
 * Sends an OTP (One-Time Password) to the specified identifier (email or phone).
 *
 * @param identifier The email or phone number to send the OTP to.
 * @returns A promise that resolves when the OTP has been successfully sent (simulated).
 */
export async function sendOTP(identifier: string): Promise<void> {
  // TODO: Implement this by calling a real OTP service API.
  console.log(`Simulating OTP sent to ${identifier}. In a real app, an SMS/email would be sent.`);
  // For testing, you might log a specific OTP like '123456'
  console.log(`(Test OTP: Use '000000' for sample users)`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  return;
}

/**
 * Verifies the provided OTP (One-Time Password) against the expected value.
 * Includes logic for sample user login using a magic OTP.
 *
 * @param identifier The identifier (email/phone) the OTP was sent to.
 * @param otp The OTP to verify.
 * @returns A promise that resolves with an OTPVerificationResponse indicating the verification result.
 */
export async function verifyOTP(identifier: string, otp: string): Promise<OTPVerificationResponse> {
  // TODO: Implement this by calling a real backend API to verify the OTP.
  console.log(`Verifying OTP ${otp} for ${identifier}`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

  // --- Sample User Login Logic ---
  // Use a magic OTP '000000' to log in as predefined sample users based on identifier
  if (otp === '000000') {
    let sampleUser: User | undefined;

    if (identifier.toLowerCase() === 'admin@school.com') {
      sampleUser = {
        id: 'admin-001',
        name: 'Admin User',
        email: 'admin@school.com',
        role: 'Admin',
        schoolCode: 'XYZ123',
        profilePictureUrl: 'https://picsum.photos/100/100?random=admin',
      };
    } else if (identifier.toLowerCase() === 'teacher@school.com') {
      sampleUser = {
        id: 'teacher-001',
        name: 'Teacher User',
        email: 'teacher@school.com',
        role: 'Teacher',
        schoolCode: 'XYZ123',
        class: 'Class 10A', // Example class teacher assignment
        profilePictureUrl: 'https://picsum.photos/100/100?random=teacher',
      };
    } else if (identifier.toLowerCase() === 'student@school.com') {
       sampleUser = {
        id: 'student-001',
        name: 'Student User',
        email: 'student@school.com',
        role: 'Student',
        schoolCode: 'XYZ123',
        admissionNumber: 'S12345',
        class: 'Class 10A',
        profilePictureUrl: 'https://picsum.photos/100/100?random=student',
      };
    }
    // Add more sample users here if needed
    // else if (identifier === 'another@example.com') { ... }


    if (sampleUser) {
      console.log(`Magic OTP successful for sample user: ${sampleUser.name}`);
      return { success: true, message: 'Sample user login successful.', user: sampleUser };
    } else {
       console.warn(`Magic OTP used, but no sample user found for identifier: ${identifier}. Defaulting to basic success.`);
       // Fallback: If identifier doesn't match a sample user, still succeed but without specific user data
       // The login form will need to handle this case (e.g., create a generic user)
       return { success: true, message: 'OTP verification successful (generic).' };
    }
  }
  // --- End Sample User Login Logic ---


  // --- Real OTP Verification Logic (Placeholder) ---
  // In a real app, you'd compare the OTP with the one stored for the identifier.
  // For this simulation, let's assume any 6-digit OTP other than '000000' is invalid for simplicity.
  if (otp.length === 6) {
     // Simulate failure for any other OTP in this demo
     console.log('Incorrect OTP (Simulation).');
     return { success: false, message: 'The OTP entered is incorrect.' };
  } else {
      console.log('Invalid OTP format.');
      return { success: false, message: 'OTP must be 6 digits.' };
  }
  // --- End Real OTP Verification Logic ---

}


/**
 * Provides sample login credentials for testing purposes.
 * DO NOT USE IN PRODUCTION.
 */
export const sampleCredentials = {
    admin: { identifier: 'admin@school.com', otp: '000000', role: 'Admin' },
    teacher: { identifier: 'teacher@school.com', otp: '000000', role: 'Teacher' },
    student: { identifier: 'student@school.com', otp: '000000', role: 'Student' },
};

/**
 * Logs sample credentials to the console for easy testing access.
 */
export function logSampleCredentials() {
    console.log("--- Sample Login Credentials (Use OTP: 000000) ---");
    console.log("Admin:", sampleCredentials.admin.identifier);
    console.log("Teacher:", sampleCredentials.teacher.identifier);
    console.log("Student:", sampleCredentials.student.identifier);
    console.log("-------------------------------------------------");
}

// Log sample credentials when the module is loaded in development
if (process.env.NODE_ENV === 'development') {
    logSampleCredentials();
}
