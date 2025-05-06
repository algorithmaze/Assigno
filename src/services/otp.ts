

// TODO: Firebase - Import necessary Firebase modules (e.g., getFirestore, doc, setDoc, getDoc)
// import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
// import { db } from '@/lib/firebase'; // Assuming you have a firebase.ts setup file

import type { User } from '@/context/auth-context';
import { getSchoolDetails } from './school';
// Dynamically import sampleCredentials and ensure users module is initialized.
// import { sampleCredentials } from './users'; // This will be imported dynamically

export interface OTPVerificationResponse {
  success: boolean;
  message?: string;
  user?: User;
}

export async function sendOTP(identifier: string): Promise<void> {
  console.log(`Simulating OTP sent to ${identifier}. In a real app, an SMS/email would be sent.`);
  // TODO: Firebase - No direct OTP sending logic in Firestore. This would be a separate service (e.g., Firebase Auth Phone, or a third-party SMS/email provider).
  const usersModule = await import('./users'); // Import dynamically
  if (typeof usersModule.ensureMockDataInitialized === 'function') {
    await usersModule.ensureMockDataInitialized();
  }

  const sampleUserEntry = Object.values(usersModule.sampleCredentials).find(cred => cred.identifier.toLowerCase() === identifier.toLowerCase());
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
  const usersModule = await import('./users'); // Import dynamically
  if (typeof usersModule.ensureMockDataInitialized === 'function') {
    await usersModule.ensureMockDataInitialized(); // Make sure data is loaded before accessing sampleCredentials
  }
  // TODO: Firebase - OTP verification itself is usually handled by Firebase Auth.
  // If using a custom OTP system, you'd check against a temporary code stored (e.g., in Firestore or Redis).
  // Upon successful verification, you'd then fetch or create the user in your 'users' Firestore collection.

  // --- Mock implementation ---
  await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay

  const sampleUserEntry = Object.values(usersModule.sampleCredentials).find(
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
     const isEmail = identifier.includes('@');
     let schoolCodeForGeneric = 'samp123'; // Default
      // A simple heuristic for demo, might need refinement or explicit school code during signup
      if (identifier.includes('@school.com')) {
          schoolCodeForGeneric = 'samp123';
      } else if (identifier.includes('@anotherschool.edu')) {
          // schoolCodeForGeneric = 'another123'; // If you had another school
      }

     const schoolDetails = await getSchoolDetails(schoolCodeForGeneric);
     const genericUserId = 'user-' + Math.random().toString(36).substring(7);
     
     const genericUser: User = {
         id: genericUserId,
         name: 'Generic User (' + identifier.substring(0, identifier.indexOf('@') > 0 ? identifier.indexOf('@') : 5) + ')',
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


export async function logSampleCredentials() {
    const usersModule = await import('./users');
    if (typeof usersModule.ensureMockDataInitialized === 'function') {
      await usersModule.ensureMockDataInitialized();
    }
    console.log("--- Sample Login Credentials (School: samp123 - Sample Sr. Sec. School) ---");
    Object.values(usersModule.sampleCredentials).forEach(cred => {
        console.log(`${cred.role} ${cred.name}: ${cred.identifier} (OTP: ${cred.otp})`);
    });
    console.log("-------------------------------------------------");
}

// Log credentials only in development environment
if (process.env.NODE_ENV === 'development') {
    logSampleCredentials();
}

// The initialization of mock users will now be handled within users.ts itself.
// No longer need to call initializeMockUsersWithCredentials from here.


