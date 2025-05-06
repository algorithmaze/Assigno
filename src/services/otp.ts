
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
  await new Promise(resolve => setTimeout(resolve, 500));
  return;
}

export async function verifyOTP(identifier: string, otp: string): Promise<OTPVerificationResponse> {
  console.log(`Verifying OTP ${otp} for ${identifier}`);
  // TODO: Firebase - OTP verification itself is usually handled by Firebase Auth.
  // If using a custom OTP system, you'd check against a temporary code stored (e.g., in Firestore or Redis).
  // Upon successful verification, you'd then fetch or create the user in your 'users' Firestore collection.

  // --- Mock implementation ---
  await new Promise(resolve => setTimeout(resolve, 500));

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
      }
    };
  }

  if (otp === '123456' && !sampleUserEntry) { 
     console.warn(`Generic OTP used for identifier: ${identifier}. This user might not be fully configured.`);
     const schoolCodeForGeneric = identifier.split('@')[1]?.startsWith('school.com') ? 'samp123' : 'unknownSchool';
     const schoolDetails = await getSchoolDetails(schoolCodeForGeneric);
     const genericUserId = 'user-' + Math.random().toString(36).substring(7);
     const genericUser: User = {
         id: genericUserId,
         name: 'Generic User',
         email: identifier.includes('@') ? identifier : undefined,
         phoneNumber: !identifier.includes('@') ? identifier : undefined,
         role: 'Student', 
         schoolCode: schoolDetails?.schoolCode || schoolCodeForGeneric,
         schoolName: schoolDetails?.schoolName,
         schoolAddress: schoolDetails?.address,
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


export const sampleCredentials = {
    adminAntony: {
        id: 'admin-antony-001',
        name: 'Antony Admin',
        identifier: 'antony@school.com', 
        email: 'antony@school.com',
        phoneNumber: undefined,
        role: 'Admin' as 'Admin',
        otp: '000000', 
        schoolCode: 'samp123',
        profilePictureUrl: `https://picsum.photos/100/100?random=admin-antony-001`,
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
        profilePictureUrl: `https://picsum.photos/100/100?random=teacher-zara-001`,
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
        profilePictureUrl: `https://picsum.photos/100/100?random=teacher-leo-002`,
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
        profilePictureUrl: `https://picsum.photos/100/100?random=student-mia-001`,
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
        profilePictureUrl: `https://picsum.photos/100/100?random=student-omar-002`,
        admissionNumber: 'SAMP9002',
        class: 'Class 7C',
     },
     teacherEva: {
        id: 'teacher-eva-003',
        name: 'Eva Teacher',
        identifier: 'eva@school.com',
        email: 'eva@school.com',
        phoneNumber: undefined,
        role: 'Teacher' as 'Teacher',
        otp: '555555',
        schoolCode: 'samp123',
        profilePictureUrl: `https://picsum.photos/100/100?random=teacher-eva-003`,
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
        profilePictureUrl: `https://picsum.photos/100/100?random=student-ken-003`,
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
