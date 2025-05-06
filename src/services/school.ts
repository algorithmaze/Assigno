
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
  var mockSchoolInitialized_assigno_school: boolean | undefined;
}

const SCHOOL_STORAGE_KEY = 'assigno_mock_school_details_v1';

// Initialize mockSchoolDetails_assigno_school on globalThis if it doesn't exist (for dev environment)
function initializeGlobalSchoolStore(): SchoolDetails {
   if (typeof window === 'undefined') {
    // Default for server-side or if no window context, though primarily client-side logic
    return {
      schoolCode: 'samp123',
      schoolName: 'Sample Sr. Sec. School',
      address: '456 School Road, Testville',
    };
  }

  if (globalThis.mockSchoolDetails_assigno_school && globalThis.mockSchoolInitialized_assigno_school) {
    return globalThis.mockSchoolDetails_assigno_school;
  }

  try {
    const storedData = localStorage.getItem(SCHOOL_STORAGE_KEY);
    if (storedData) {
      const schoolDetails = JSON.parse(storedData) as SchoolDetails;
      globalThis.mockSchoolDetails_assigno_school = schoolDetails;
      globalThis.mockSchoolInitialized_assigno_school = true;
      console.log("[Service:school] Initialized global school store from localStorage.");
      return schoolDetails;
    }
  } catch (error) {
    console.error("[Service:school] Error reading school details from localStorage during global init:", error);
  }
  
  const defaultSchoolDetails: SchoolDetails = {
    schoolCode: 'samp123',
    schoolName: 'Sample Sr. Sec. School',
    address: '456 School Road, Testville',
  };
  globalThis.mockSchoolDetails_assigno_school = defaultSchoolDetails;
  globalThis.mockSchoolInitialized_assigno_school = true;
  localStorage.setItem(SCHOOL_STORAGE_KEY, JSON.stringify(defaultSchoolDetails));
  console.log("[Service:school] Initialized new global school store and saved to localStorage.");
  return defaultSchoolDetails;
}


function getMockSchoolDetails(): SchoolDetails {
   if (typeof window === 'undefined') {
     // Return a default or throw, as this should ideally be client-side for mock
     return {
      schoolCode: 'samp123',
      schoolName: 'Sample Sr. Sec. School',
      address: '456 School Road, Testville',
    };
   }
  if (!globalThis.mockSchoolDetails_assigno_school || !globalThis.mockSchoolInitialized_assigno_school) {
    return initializeGlobalSchoolStore();
  }
  return globalThis.mockSchoolDetails_assigno_school;
}

function updateMockSchoolDetails(details: SchoolDetails): void {
  if (typeof window !== 'undefined') {
    globalThis.mockSchoolDetails_assigno_school = details;
    globalThis.mockSchoolInitialized_assigno_school = true; // Ensure initialized flag is set
    localStorage.setItem(SCHOOL_STORAGE_KEY, JSON.stringify(details));
    console.log("[Service:school] Updated school details in global store and localStorage:", details);
  }
}

// Initialize on load for client-side
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  initializeGlobalSchoolStore();
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
  const currentSchoolData = getMockSchoolDetails(); // This now ensures initialization
  if (currentSchoolData && currentSchoolData.schoolCode.toLowerCase() === schoolCode.toLowerCase()) {
    return { ...currentSchoolData };
  }
  return null;
  // --- End mock implementation ---
}


export async function updateSchoolDetails(updatedDetails: Partial<SchoolDetails>): Promise<SchoolDetails | null> {
  const currentSchoolData = getMockSchoolDetails(); // Ensures initialized
  
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
    if (updatedDetails.schoolCode && updatedDetails.schoolCode !== newDetails.schoolCode) {
        console.warn(`[Service:school] Attempting to change schoolCode from "${newDetails.schoolCode}" to "${updatedDetails.schoolCode}" is not supported in this mock update. Sticking to original schoolCode.`);
    }

    updateMockSchoolDetails(newDetails); // This function now also saves to localStorage
    return { ...newDetails };
    // --- End mock implementation ---
}

