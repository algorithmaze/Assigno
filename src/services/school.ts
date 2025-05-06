// TODO: Firebase - Import necessary Firebase modules (e.g., getFirestore, doc, getDoc, setDoc)
// import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
// import { db } from '@/lib/firebase'; // Assuming you have a firebase.ts setup file

export interface SchoolDetails {
  schoolCode: string;
  schoolName: string;
  address: string;
}

declare global {
  var mockSchoolDetails_assigno_school: SchoolDetails | undefined;
}

// Initialize mockSchoolDetails_assigno_school on globalThis if it doesn't exist (for dev environment)
if (process.env.NODE_ENV !== 'production') {
  if (!globalThis.mockSchoolDetails_assigno_school) {
    globalThis.mockSchoolDetails_assigno_school = {
      schoolCode: 'samp123',
      schoolName: 'Sample Sr. Sec. School',
      address: '456 School Road, Testville',
    };
    console.log("[Service:school] Initialized global mockSchoolDetails_assigno_school.");
  }
}

function getMockSchoolDetails(): SchoolDetails | null {
  if (process.env.NODE_ENV === 'production') {
    // In production, this would interact with a database. For now, return null.
    return null;
  }
  // Ensure globalThis.mockSchoolDetails_assigno_school is initialized
  if (!globalThis.mockSchoolDetails_assigno_school) {
    // This case should ideally not be hit if top-level initialization worked,
    // but as a fallback:
    globalThis.mockSchoolDetails_assigno_school = {
      schoolCode: 'samp123',
      schoolName: 'Sample Sr. Sec. School',
      address: '456 School Road, Testville',
    };
  }
  return globalThis.mockSchoolDetails_assigno_school;
}

function updateMockSchoolDetails(details: SchoolDetails): void {
  if (process.env.NODE_ENV !== 'production') {
    globalThis.mockSchoolDetails_assigno_school = details;
  }
}


export async function getSchoolDetails(schoolCode: string): Promise<SchoolDetails | null> {
  console.log(`[Service:school] Fetching details for school code: ${schoolCode}`);
  // TODO: Firebase - Replace with Firestore getDoc
  // const firestore = getFirestore();
  // const schoolRef = doc(firestore, 'schools', schoolCode.toLowerCase()); // Normalize schoolCode if needed
  // const schoolSnap = await getDoc(schoolRef);
  // if (schoolSnap.exists()) {
  //   return schoolSnap.data() as SchoolDetails;
  // }
  // return null;

  // --- Mock implementation ---
  await new Promise(resolve => setTimeout(resolve, 10)); // Reduced delay
  const currentSchoolData = getMockSchoolDetails();
  if (currentSchoolData && currentSchoolData.schoolCode.toLowerCase() === schoolCode.toLowerCase()) {
    return { ...currentSchoolData };
  }
  return null;
  // --- End mock implementation ---
}


export async function updateSchoolDetails(updatedDetails: Partial<SchoolDetails>): Promise<SchoolDetails | null> {
  const currentSchoolData = getMockSchoolDetails();
  if (!currentSchoolData) {
    console.error("[Service:school] Cannot update, mock school details not found.");
    return null;
  }
  
  console.log(`[Service:school] Updating school: ${currentSchoolData.schoolCode}`);
    // TODO: Firebase - Replace with Firestore setDoc or updateDoc
    // const firestore = getFirestore();
    // if (!updatedDetails.schoolCode) { // Assume schoolCode is key and not updatable this way
    //     console.error("[Service:school] School code must be provided for update in Firestore.");
    //     return null;
    // }
    // const schoolRef = doc(firestore, 'schools', updatedDetails.schoolCode.toLowerCase());
    // await setDoc(schoolRef, updatedDetails, { merge: true }); // Use merge to update fields or create if not exists
    // const newDetailsSnap = await getDoc(schoolRef);
    // return newDetailsSnap.exists() ? newDetailsSnap.data() as SchoolDetails : null;

    // --- Mock implementation ---
    await new Promise(resolve => setTimeout(resolve, 10)); // Reduced delay
    
    const newDetails = { ...currentSchoolData };
    if (updatedDetails.schoolName) {
        newDetails.schoolName = updatedDetails.schoolName;
    }
    if (updatedDetails.address) {
        newDetails.address = updatedDetails.address;
    }
    // schoolCode itself is typically not updated this way, it's an identifier.
    // If updatedDetails.schoolCode is provided and different, it implies changing the key,
    // which is a more complex operation (delete old, create new).
    // For simplicity, we assume schoolCode in updatedDetails matches currentSchoolData.schoolCode if provided for update.
    if (updatedDetails.schoolCode && updatedDetails.schoolCode !== newDetails.schoolCode) {
        console.warn(`[Service:school] Attempting to change schoolCode from "${newDetails.schoolCode}" to "${updatedDetails.schoolCode}" is not supported in this mock update. Sticking to original schoolCode.`);
    }

    updateMockSchoolDetails(newDetails);
    console.log("[Service:school] Updated school details (mock):", newDetails);
    return { ...newDetails };
    // --- End mock implementation ---
}
