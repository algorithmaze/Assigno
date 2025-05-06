
// TODO: Firebase - Import necessary Firebase modules (e.g., getFirestore, doc, setDoc, getDoc)
// import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
// import { db } from '@/lib/firebase'; // Assuming you have a firebase.ts setup file

import type { User } from '@/context/auth-context'; 
import { getSchoolDetails } from './school'; 

export interface OTPVerificationResponse {
  success: boolean;
  message?: string;
  user?: User;
}

export async function sendOTP(identifier: string): Promise<void> {
  console.log(`Simulating OTP sent to ${identifier}. In a real app, an SMS/email would be sent.`);
  // TODO: Firebase - No direct OTP sending logic in Firestore. This would be a separate service (e.g., Firebase Auth Phone, or a third-party SMS/email provider).
  const sampleUserEntry = Object.values(sampleCredentials).find(cred => cred.identifier.toLowerCase() === identifier.toLowerCase());
  if (sampleUserEntry) {
    console.log(`(For ${sampleUserEntry.name}, use Test OTP: ${sampleUserEntry.otp})`);
  } else {
    console.log(`(For other identifiers, a generic OTP might be needed or signup flow)`);
  }
  await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay
  return;
}

export async function verifyOTP(identifier: string, otp: string): Promise<OTPVerificationResponse> {
  console.log(`Verifying OTP ${otp} for ${identifier}`);
  // TODO: Firebase - OTP verification itself is usually handled by Firebase Auth.
  // If using a custom OTP system, you'd check against a temporary code stored (e.g., in Firestore or Redis).
  // Upon successful verification, you'd then fetch or create the user in your 'users' Firestore collection.

  // --- Mock implementation ---
  await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay

  const sampleUserEntry = Object.values(sampleCredentials).find(
    cred => cred.identifier.toLowerCase() === identifier.toLowerCase() && cred.otp === otp
  );

  if (sampleUserEntry) {
    console.log(`OTP successful for sample user: ${sampleUserEntry.name}`);
    const schoolDetails = await getSchoolDetails(sampleUserEntry.schoolCode);
    // TODO: Firebase - If user found via sample, ensure they exist in Firestore or create them.
    // const firestore = getFirestore();
    // const userRef = doc(firestore, 'users', sampleUserEntry.id);
    // const userSnap = await getDoc(userRef);
    // let userData = userSnap.exists() ? {id: userSnap.id, ...userSnap.data()} as User : null;
    // if (!userData) { /* create user in Firestore */ }
    
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
        designation: sampleUserEntry.designation,
      }
    };
  }

  // Fallback for any identifier with OTP '123456' for easier testing of signup/other flows
  // Ensure this logic aligns with how you want to handle non-predefined users.
  if (otp === '123456' && !sampleUserEntry) { 
     console.warn(`Generic OTP used for identifier: ${identifier}. This user might not be fully configured.`);
     // Attempt to derive school code or use a default
     const isEmail = identifier.includes('@');
     const schoolCodeForGeneric = isEmail && identifier.split('@')[1]?.startsWith('school.com') ? 'samp123' : 'samp123'; // Default to samp123
     const schoolDetails = await getSchoolDetails(schoolCodeForGeneric);
     const genericUserId = 'user-' + Math.random().toString(36).substring(7);
     
     const genericUser: User = {
         id: genericUserId,
         name: 'Generic User',
         email: isEmail ? identifier : undefined,
         phoneNumber: !isEmail ? identifier : undefined,
         role: 'Student', // Default role for generic OTP users
         schoolCode: schoolDetails?.schoolCode || schoolCodeForGeneric,
         schoolName: schoolDetails?.schoolName,
         schoolAddress: schoolDetails?.address,
         profilePictureUrl: `https://picsum.photos/100/100?random=${genericUserId.replace('-', '')}`,
     };
     // TODO: Firebase - Create this generic user in Firestore if they don't exist.
     // const firestore = getFirestore();
     // const userRef = doc(firestore, 'users', genericUserId);
     // await setDoc(userRef, genericUser, { merge: true }); // Create or merge
     return { success: true, message: 'Generic OTP verification successful.', user: genericUser };
  }

  console.log('Incorrect OTP or identifier mismatch.');
  return { success: false, message: 'The OTP entered is incorrect or identifier mismatch.' };
  // --- End mock implementation ---
}


// School Details for all sample users
const SCHOOL_CODE = 'samp123';
const DEFAULT_PROFILE_URL_BASE = 'https://picsum.photos/100/100?random=';

export const sampleCredentials = {
    adminAntony: {
        id: 'admin-antony-001',
        name: 'Antony Admin',
        identifier: 'antony@school.com', 
        email: 'antony@school.com',
        phoneNumber: undefined,
        role: 'Admin' as 'Admin',
        otp: '000000', 
        schoolCode: SCHOOL_CODE,
        profilePictureUrl: `${DEFAULT_PROFILE_URL_BASE}adminantony001`,
        admissionNumber: undefined,
        class: undefined,
        designation: undefined,
     },
    teacherZara: {
        id: 'teacher-zara-001',
        name: 'Zara Teacher',
        identifier: 'zara@school.com',
        email: 'zara@school.com',
        phoneNumber: undefined,
        role: 'Teacher' as 'Teacher',
        otp: '111111',
        schoolCode: SCHOOL_CODE,
        profilePictureUrl: `${DEFAULT_PROFILE_URL_BASE}teacherzara001`,
        admissionNumber: undefined,
        class: 'Class 10A',
        designation: 'Class Teacher' as 'Class Teacher',
     },
    teacherLeo: {
        id: 'teacher-leo-002',
        name: 'Leo Teacher',
        identifier: 'leo@school.com',
        email: 'leo@school.com',
        phoneNumber: undefined,
        role: 'Teacher' as 'Teacher',
        otp: '222222',
        schoolCode: SCHOOL_CODE,
        profilePictureUrl: `${DEFAULT_PROFILE_URL_BASE}teacherleo002`,
        admissionNumber: undefined,
        class: 'Class 9B, Class 10B',
        designation: 'Subject Teacher' as 'Subject Teacher',
     },
    studentMia: {
        id: 'student-mia-001',
        name: 'Mia Student',
        identifier: 'mia@school.com',
        email: 'mia@school.com',
        phoneNumber: undefined,
        role: 'Student' as 'Student',
        otp: '333333',
        schoolCode: SCHOOL_CODE,
        profilePictureUrl: `${DEFAULT_PROFILE_URL_BASE}studentmia001`,
        admissionNumber: 'SAMP9001',
        class: 'Class 8A',
        designation: undefined,
     },
    studentOmar: {
        id: 'student-omar-002',
        name: 'Omar Student',
        identifier: 'omar@school.com',
        email: 'omar@school.com',
        phoneNumber: undefined,
        role: 'Student' as 'Student',
        otp: '444444',
        schoolCode: SCHOOL_CODE,
        profilePictureUrl: `${DEFAULT_PROFILE_URL_BASE}studentomar002`,
        admissionNumber: 'SAMP9002',
        class: 'Class 7C',
        designation: undefined,
     },
     teacherEva: {
        id: 'teacher-eva-003',
        name: 'Eva Teacher',
        identifier: 'eva@school.com',
        email: 'eva@school.com',
        phoneNumber: undefined,
        role: 'Teacher' as 'Teacher',
        otp: '555555',
        schoolCode: SCHOOL_CODE,
        profilePictureUrl: `${DEFAULT_PROFILE_URL_BASE}teachereva003`,
        admissionNumber: undefined,
        class: 'Class 11 Science',
        designation: 'Class Teacher' as 'Class Teacher',
    },
    studentKen: {
        id: 'student-ken-003',
        name: 'Ken Student',
        identifier: 'ken@school.com',
        email: 'ken@school.com',
        phoneNumber: undefined,
        role: 'Student' as 'Student',
        otp: '666666',
        schoolCode: SCHOOL_CODE,
        profilePictureUrl: `${DEFAULT_PROFILE_URL_BASE}studentken003`,
        admissionNumber: 'SAMP9003',
        class: 'Class 6B',
        designation: undefined,
    },
};


export function logSampleCredentials() {
    console.log("--- Sample Login Credentials (School: samp123 - Sample Sr. Sec. School) ---");
    Object.values(sampleCredentials).forEach(cred => {
        console.log(`${cred.role} ${cred.name}: ${cred.identifier} (OTP: ${cred.otp})`);
    });
    console.log("-------------------------------------------------");
}

// Log credentials only in development environment
if (process.env.NODE_ENV === 'development') {
    logSampleCredentials();
}

// Initialize the mock users in the users service with these credentials
// This is a bit of a hack due to module dependencies, but ensures users service is populated
// with these sample users for other parts of the app (like group management).
// A more robust solution might involve a shared mock data initialization module.
import { initializeMockUsersWithCredentials } from './users';
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Ensure this runs client-side only or where globalThis is reliable for mocks
    initializeMockUsersWithCredentials(sampleCredentials);
}
