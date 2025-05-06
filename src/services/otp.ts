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
  console.log(`Simulating OTP sent to ${identifier}. In a real app, an SMS/email would be sent.`);
  console.log(`(Test OTP: Use '000000' for sample users)`);
  await new Promise(resolve => setTimeout(resolve, 500));
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
  console.log(`Verifying OTP ${otp} for ${identifier}`);
  await new Promise(resolve => setTimeout(resolve, 500));

  if (otp === '000000') {
    let sampleUser: User | undefined;

    if (identifier.toLowerCase() === sampleCredentials.adminAntony.identifier.toLowerCase()) {
      sampleUser = sampleCredentials.adminAntony as User;
    } else if (identifier.toLowerCase() === sampleCredentials.teacherZara.identifier.toLowerCase()) {
      sampleUser = sampleCredentials.teacherZara as User;
    } else if (identifier.toLowerCase() === sampleCredentials.teacherLeo.identifier.toLowerCase()) {
      sampleUser = sampleCredentials.teacherLeo as User;
    } else if (identifier.toLowerCase() === sampleCredentials.studentMia.identifier.toLowerCase()) {
       sampleUser = sampleCredentials.studentMia as User;
    } else if (identifier.toLowerCase() === sampleCredentials.studentOmar.identifier.toLowerCase()) {
       sampleUser = sampleCredentials.studentOmar as User;
    }

    if (sampleUser) {
      console.log(`Magic OTP successful for sample user: ${sampleUser.name}`);
      return { success: true, message: 'Sample user login successful.', user: sampleUser };
    } else {
       console.warn(`Magic OTP used, but no sample user found for identifier: ${identifier}. Defaulting to basic success.`);
        const genericUser: User = {
            id: 'user-' + Math.random().toString(36).substring(7),
            name: 'Logged In User',
            email: identifier.includes('@') ? identifier : undefined,
            phoneNumber: !identifier.includes('@') ? identifier : undefined,
            role: 'Student',
            schoolCode: 'samp123', // Fallback school code
            schoolName: 'Sample Sr. Sec. School',
            schoolAddress: '456 School Road, Testville',
        };
       return { success: true, message: 'OTP verification successful (generic).', user: genericUser };
    }
  }

  if (otp.length === 6) {
     console.log('Incorrect OTP (Simulation).');
     return { success: false, message: 'The OTP entered is incorrect.' };
  } else {
      console.log('Invalid OTP format.');
      return { success: false, message: 'OTP must be 6 digits.' };
  }
}


/**
 * Provides sample login credentials for testing purposes.
 * DO NOT USE IN PRODUCTION.
 */
export const sampleCredentials = {
    adminAntony: {
        id: 'admin-antony-001',
        name: 'Antony Admin',
        identifier: 'antony@school.com',
        email: 'antony@school.com',
        role: 'Admin',
        otp: '000000', // Magic OTP
        schoolCode: 'samp123',
        schoolName: 'Sample Sr. Sec. School',
        schoolAddress: '456 School Road, Testville',
        profilePictureUrl: 'https://picsum.photos/100/100?random=antony',
     },
    teacherZara: {
        id: 'teacher-zara-001',
        name: 'Zara Teacher',
        identifier: 'zara@school.com',
        email: 'zara@school.com',
        role: 'Teacher',
        otp: '000000',
        schoolCode: 'samp123',
        schoolName: 'Sample Sr. Sec. School',
        schoolAddress: '456 School Road, Testville',
        class: 'Class 10A', // Example class
        profilePictureUrl: 'https://picsum.photos/100/100?random=zara',
     },
    teacherLeo: {
        id: 'teacher-leo-002',
        name: 'Leo Teacher',
        identifier: 'leo@school.com',
        email: 'leo@school.com',
        role: 'Teacher',
        otp: '000000',
        schoolCode: 'samp123',
        schoolName: 'Sample Sr. Sec. School',
        schoolAddress: '456 School Road, Testville',
        class: 'Class 9B', // Example class
        profilePictureUrl: 'https://picsum.photos/100/100?random=leo',
     },
    studentMia: {
        id: 'student-mia-001',
        name: 'Mia Student',
        identifier: 'mia@school.com',
        email: 'mia@school.com',
        role: 'Student',
        otp: '000000',
        schoolCode: 'samp123',
        schoolName: 'Sample Sr. Sec. School',
        schoolAddress: '456 School Road, Testville',
        admissionNumber: 'SAMP9001',
        class: 'Class 8A',
        profilePictureUrl: 'https://picsum.photos/100/100?random=mia',
     },
    studentOmar: {
        id: 'student-omar-002',
        name: 'Omar Student',
        identifier: 'omar@school.com',
        email: 'omar@school.com',
        role: 'Student',
        otp: '000000',
        schoolCode: 'samp123',
        schoolName: 'Sample Sr. Sec. School',
        schoolAddress: '456 School Road, Testville',
        admissionNumber: 'SAMP9002',
        class: 'Class 7C',
        profilePictureUrl: 'https://picsum.photos/100/100?random=omar',
     },
};


export function logSampleCredentials() {
    console.log("--- Sample Login Credentials (Use OTP: 000000) ---");
    console.log("Admin Antony:", sampleCredentials.adminAntony.identifier);
    console.log("Teacher Zara:", sampleCredentials.teacherZara.identifier);
    console.log("Teacher Leo:", sampleCredentials.teacherLeo.identifier);
    console.log("Student Mia:", sampleCredentials.studentMia.identifier);
    console.log("Student Omar:", sampleCredentials.studentOmar.identifier);
    console.log("-------------------------------------------------");
}

if (process.env.NODE_ENV === 'development') {
    logSampleCredentials();
}
