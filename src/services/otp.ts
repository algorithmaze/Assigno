
import type { User } from '@/context/auth-context'; // Import User type
import { getSchoolDetails } from './school'; // To get school details

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
  // Log specific OTP for sample users
  const sampleUserEntry = Object.values(sampleCredentials).find(cred => cred.identifier.toLowerCase() === identifier.toLowerCase());
  if (sampleUserEntry) {
    console.log(`(For ${sampleUserEntry.name}, use Test OTP: ${sampleUserEntry.otp})`);
  } else {
    console.log(`(For other identifiers, a generic OTP might be needed or signup flow)`);
  }
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

  const sampleUserEntry = Object.values(sampleCredentials).find(
    cred => cred.identifier.toLowerCase() === identifier.toLowerCase() && cred.otp === otp
  );

  if (sampleUserEntry) {
    console.log(`OTP successful for sample user: ${sampleUserEntry.name}`);
    const schoolDetails = await getSchoolDetails(sampleUserEntry.schoolCode);
    return {
      success: true,
      message: 'Sample user login successful.',
      user: {
        id: sampleUserEntry.id,
        name: sampleUserEntry.name,
        email: sampleUserEntry.email,
        phoneNumber: sampleUserEntry.phoneNumber,
        role: sampleUserEntry.role,
        schoolCode: sampleUserEntry.schoolCode,
        schoolName: schoolDetails?.schoolName,
        schoolAddress: schoolDetails?.address,
        profilePictureUrl: sampleUserEntry.profilePictureUrl,
        admissionNumber: sampleUserEntry.admissionNumber,
        class: sampleUserEntry.class,
      }
    };
  }

  // Fallback for generic OTP verification if no sample user matches
  // This part might be removed if strict matching against sample OTPs is required
  if (otp === '123456' && !sampleUserEntry) { // A generic OTP for testing non-sample users
     console.warn(`Generic OTP used for identifier: ${identifier}. This user might not be fully configured.`);
     const schoolCodeForGeneric = identifier.split('@')[1]?.startsWith('school.com') ? 'samp123' : 'unknownSchool';
     const schoolDetails = await getSchoolDetails(schoolCodeForGeneric);
     const genericUser: User = {
         id: 'user-' + Math.random().toString(36).substring(7),
         name: 'Generic User',
         email: identifier.includes('@') ? identifier : undefined,
         phoneNumber: !identifier.includes('@') ? identifier : undefined,
         role: 'Student', // Default role
         schoolCode: schoolDetails?.schoolCode || schoolCodeForGeneric,
         schoolName: schoolDetails?.schoolName,
         schoolAddress: schoolDetails?.address,
     };
     return { success: true, message: 'Generic OTP verification successful.', user: genericUser };
  }


  console.log('Incorrect OTP or identifier mismatch.');
  return { success: false, message: 'The OTP entered is incorrect or identifier mismatch.' };
}


/**
 * Provides sample login credentials for testing purposes.
 * DO NOT USE IN PRODUCTION.
 */
export const sampleCredentials = {
    adminAntony: {
        id: 'admin-antony-001',
        name: 'Antony Admin',
        identifier: 'antony@school.com', // Unique identifier
        email: 'antony@school.com',
        phoneNumber: undefined,
        role: 'Admin' as 'Admin',
        otp: '000000', // Specific OTP for this user
        schoolCode: 'samp123',
        profilePictureUrl: `https://picsum.photos/100/100?random=${'admin-antony-001'}`,
        admissionNumber: undefined,
        class: undefined,
     },
    teacherZara: {
        id: 'teacher-zara-001',
        name: 'Zara Teacher',
        identifier: 'zara@school.com',
        email: 'zara@school.com',
        phoneNumber: undefined,
        role: 'Teacher' as 'Teacher',
        otp: '111111',
        schoolCode: 'samp123',
        profilePictureUrl: `https://picsum.photos/100/100?random=${'teacher-zara-001'}`,
        admissionNumber: undefined,
        class: 'Class 10A',
     },
    teacherLeo: {
        id: 'teacher-leo-002',
        name: 'Leo Teacher',
        identifier: 'leo@school.com',
        email: 'leo@school.com',
        phoneNumber: undefined,
        role: 'Teacher' as 'Teacher',
        otp: '222222',
        schoolCode: 'samp123',
        profilePictureUrl: `https://picsum.photos/100/100?random=${'teacher-leo-002'}`,
        admissionNumber: undefined,
        class: 'Class 9B',
     },
    studentMia: {
        id: 'student-mia-001',
        name: 'Mia Student',
        identifier: 'mia@school.com',
        email: 'mia@school.com',
        phoneNumber: undefined,
        role: 'Student' as 'Student',
        otp: '333333',
        schoolCode: 'samp123',
        profilePictureUrl: `https://picsum.photos/100/100?random=${'student-mia-001'}`,
        admissionNumber: 'SAMP9001',
        class: 'Class 8A',
     },
    studentOmar: {
        id: 'student-omar-002',
        name: 'Omar Student',
        identifier: 'omar@school.com',
        email: 'omar@school.com',
        phoneNumber: undefined,
        role: 'Student' as 'Student',
        otp: '444444',
        schoolCode: 'samp123',
        profilePictureUrl: `https://picsum.photos/100/100?random=${'student-omar-002'}`,
        admissionNumber: 'SAMP9002',
        class: 'Class 7C',
     },
     // Additional dummy users for general app population
     teacherEva: {
        id: 'teacher-eva-003',
        name: 'Eva Teacher',
        identifier: 'eva@school.com',
        email: 'eva@school.com',
        phoneNumber: undefined,
        role: 'Teacher' as 'Teacher',
        otp: '555555',
        schoolCode: 'samp123',
        profilePictureUrl: `https://picsum.photos/100/100?random=${'teacher-eva-003'}`,
        admissionNumber: undefined,
        class: 'Class 11 Science',
    },
    studentKen: {
        id: 'student-ken-003',
        name: 'Ken Student',
        identifier: 'ken@school.com',
        email: 'ken@school.com',
        phoneNumber: undefined,
        role: 'Student' as 'Student',
        otp: '666666',
        schoolCode: 'samp123',
        profilePictureUrl: `https://picsum.photos/100/100?random=${'student-ken-003'}`,
        admissionNumber: 'SAMP9003',
        class: 'Class 6B',
    },
};


export function logSampleCredentials() {
    console.log("--- Sample Login Credentials ---");
    Object.values(sampleCredentials).forEach(cred => {
        console.log(`${cred.role} ${cred.name}: ${cred.identifier} (OTP: ${cred.otp})`);
    });
    console.log("-------------------------------------------------");
}

if (process.env.NODE_ENV === 'development') {
    logSampleCredentials();
}
