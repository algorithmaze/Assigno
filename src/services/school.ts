
import type { User } from '@/context/auth-context';
import { addUser } from './users'; // For creating admin user

export interface SchoolDetails {
  schoolCode: string;
  schoolName: string;
  instituteType: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactNumber: string;
  adminEmail: string;
  registrationDate: string; // ISO string
}

export interface InstituteRegistrationInput {
  instituteName: string;
  instituteType: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactNumber: string;
  adminEmail: string;
}

export interface InstituteRegistrationResult {
  success: boolean;
  schoolCode?: string;
  message?: string;
  adminUser?: User; // Optionally return created admin user
}


// Use a global variable for mock data in non-production environments
declare global {
  // For single school details (legacy, might be phased out or used for 'current' school)
  var mockSchoolDetails_assigno_school: SchoolDetails | undefined;
  var mockSchoolInitialized_assigno_school: boolean | undefined;

  // For list of all registered institutes
  var mockRegisteredInstitutes_assigno_school_list: SchoolDetails[] | undefined;
  var mockRegisteredInstitutesInitialized_assigno_school_list: boolean | undefined;
}

const SINGLE_SCHOOL_STORAGE_KEY = 'assigno_mock_school_details_v2_institute'; // v2 for new fields
const REGISTERED_INSTITUTES_STORAGE_KEY = 'assigno_mock_registered_institutes_v2';


// Initialize global store for a LIST of registered institutes
function initializeGlobalInstitutesListStore(): SchoolDetails[] {
  if (typeof window === 'undefined') {
    return []; // Server-side, start empty
  }

  if (globalThis.mockRegisteredInstitutes_assigno_school_list && globalThis.mockRegisteredInstitutesInitialized_assigno_school_list) {
    return globalThis.mockRegisteredInstitutes_assigno_school_list;
  }

  try {
    const storedData = localStorage.getItem(REGISTERED_INSTITUTES_STORAGE_KEY);
    if (storedData) {
      const institutesList = JSON.parse(storedData) as SchoolDetails[];
      globalThis.mockRegisteredInstitutes_assigno_school_list = institutesList;
      globalThis.mockRegisteredInstitutesInitialized_assigno_school_list = true;
      console.log("[Service:school] Initialized global institutes LIST from localStorage:", institutesList.length, "institutes loaded.");
      return institutesList;
    }
  } catch (error) {
    console.error("[Service:school] Error reading institutes LIST from localStorage:", error);
  }
  
  const defaultList: SchoolDetails[] = [{ // Keep the default school in the list for backward compatibility/demo
    schoolCode: 'samp123',
    schoolName: 'Sample Sr. Sec. School',
    instituteType: 'School',
    address: '456 School Road',
    city: 'Testville',
    state: 'Test State',
    pincode: '000000',
    contactNumber: '+10000000000',
    adminEmail: 'antony@school.com',
    registrationDate: new Date().toISOString(),
  }];
  globalThis.mockRegisteredInstitutes_assigno_school_list = defaultList;
  globalThis.mockRegisteredInstitutesInitialized_assigno_school_list = true;
  localStorage.setItem(REGISTERED_INSTITUTES_STORAGE_KEY, JSON.stringify(defaultList));
  console.log("[Service:school] Initialized new global institutes LIST and saved to localStorage.");
  return defaultList;
}


// Get the list of all registered institutes
function getMockRegisteredInstitutes(): SchoolDetails[] {
   if (typeof window === 'undefined') {
     return globalThis.mockRegisteredInstitutes_assigno_school_list || [];
   }
  if (!globalThis.mockRegisteredInstitutes_assigno_school_list || !globalThis.mockRegisteredInstitutesInitialized_assigno_school_list) {
    return initializeGlobalInstitutesListStore();
  }
  return globalThis.mockRegisteredInstitutes_assigno_school_list;
}

// Update the list of registered institutes
function updateMockRegisteredInstitutes(list: SchoolDetails[]): void {
  if (typeof window !== 'undefined') {
    globalThis.mockRegisteredInstitutes_assigno_school_list = list;
    globalThis.mockRegisteredInstitutesInitialized_assigno_school_list = true;
    localStorage.setItem(REGISTERED_INSTITUTES_STORAGE_KEY, JSON.stringify(list));
    console.log("[Service:school] Updated institutes LIST in global store and localStorage:", list.length, "total institutes.");
  } else {
    globalThis.mockRegisteredInstitutes_assigno_school_list = list;
    globalThis.mockRegisteredInstitutesInitialized_assigno_school_list = true;
  }
}


// ----- Single School Detail Management (Legacy/Current School Focus) -----
function initializeGlobalSingleSchoolStore(): SchoolDetails {
   if (typeof window === 'undefined') {
    return getMockRegisteredInstitutes()[0] || { // Fallback to first in list or very basic default
        schoolCode: 'TEMP000', schoolName: 'Temporary School', instituteType: 'School', address: 'N/A', city: 'N/A', state: 'N/A', pincode: '000000', contactNumber: '+0000000000', adminEmail: 'temp@example.com', registrationDate: new Date().toISOString()
    };
  }

  if (globalThis.mockSchoolDetails_assigno_school && globalThis.mockSchoolInitialized_assigno_school) {
    return globalThis.mockSchoolDetails_assigno_school;
  }

  try {
    const storedData = localStorage.getItem(SINGLE_SCHOOL_STORAGE_KEY);
    if (storedData) {
      const schoolDetails = JSON.parse(storedData) as SchoolDetails;
      globalThis.mockSchoolDetails_assigno_school = schoolDetails;
      globalThis.mockSchoolInitialized_assigno_school = true;
      console.log("[Service:school] Initialized SINGLE school store from localStorage.");
      return schoolDetails;
    }
  } catch (error) {
    console.error("[Service:school] Error reading SINGLE school details from localStorage:", error);
  }
  
  // Default to the first school in the list if available, or the SSS school
  const institutesList = getMockRegisteredInstitutes();
  const defaultSchoolDetails: SchoolDetails = institutesList.length > 0 ? institutesList[0] : {
    schoolCode: 'samp123', schoolName: 'Sample Sr. Sec. School', instituteType: 'School', address: '456 School Road', city: 'Testville', state: 'Test State', pincode: '000000', contactNumber: '+10000000000', adminEmail: 'antony@school.com', registrationDate: new Date().toISOString()
  };

  globalThis.mockSchoolDetails_assigno_school = defaultSchoolDetails;
  globalThis.mockSchoolInitialized_assigno_school = true;
  localStorage.setItem(SINGLE_SCHOOL_STORAGE_KEY, JSON.stringify(defaultSchoolDetails));
  console.log("[Service:school] Initialized new SINGLE school store and saved to localStorage.");
  return defaultSchoolDetails;
}

function getMockSchoolDetails(): SchoolDetails {
   if (typeof window === 'undefined') {
     return globalThis.mockSchoolDetails_assigno_school || initializeGlobalSingleSchoolStore();
   }
  if (!globalThis.mockSchoolDetails_assigno_school || !globalThis.mockSchoolInitialized_assigno_school) {
    return initializeGlobalSingleSchoolStore();
  }
  return globalThis.mockSchoolDetails_assigno_school;
}

function updateMockSchoolDetails(details: SchoolDetails): void {
  if (typeof window !== 'undefined') {
    globalThis.mockSchoolDetails_assigno_school = details;
    globalThis.mockSchoolInitialized_assigno_school = true; 
    localStorage.setItem(SINGLE_SCHOOL_STORAGE_KEY, JSON.stringify(details));
    console.log("[Service:school] Updated SINGLE school details in global store and localStorage:", details);
  } else {
     globalThis.mockSchoolDetails_assigno_school = details;
     globalThis.mockSchoolInitialized_assigno_school = true;
  }
}


// Initialize stores on load for client-side
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  initializeGlobalInstitutesListStore();
  initializeGlobalSingleSchoolStore();
}


function generateSchoolCode(instituteName: string): string {
  const namePart = instituteName.replace(/[^a-zA-Z\s]/g, '').slice(0, 3).toUpperCase();
  const numberPart = Math.floor(1000 + Math.random() * 9000).toString();
  let schoolCode = `${namePart}${numberPart}`;
  
  // Mock uniqueness check (simple version)
  const existingCodes = new Set(getMockRegisteredInstitutes().map(s => s.schoolCode));
  let attempts = 0;
  while (existingCodes.has(schoolCode) && attempts < 10) {
    const newNumberPart = Math.floor(1000 + Math.random() * 9000).toString();
    schoolCode = `${namePart}${newNumberPart}`;
    attempts++;
  }
  if (attempts >= 10) console.warn("Could not guarantee school code uniqueness after 10 attempts for mock.");
  return schoolCode;
}

export async function registerInstitute(
  input: InstituteRegistrationInput
): Promise<InstituteRegistrationResult> {
  console.log('[Service:school] Attempting to register institute:', input.instituteName);
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay

  const existingInstitutes = getMockRegisteredInstitutes();
  
  // Basic check if an institute with the same admin email already exists (simple mock check)
  if (existingInstitutes.some(inst => inst.adminEmail.toLowerCase() === input.adminEmail.toLowerCase())) {
    return { success: false, message: 'An institute with this admin email is already registered.' };
  }

  const schoolCode = generateSchoolCode(input.instituteName);
  const registrationDate = new Date().toISOString();

  const newSchool: SchoolDetails = {
    schoolCode,
    schoolName: input.instituteName,
    instituteType: input.instituteType,
    address: input.address,
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    contactNumber: input.contactNumber,
    adminEmail: input.adminEmail,
    registrationDate,
  };

  // Add to the list of all institutes
  const updatedInstitutesList = [...existingInstitutes, newSchool];
  updateMockRegisteredInstitutes(updatedInstitutesList);

  // Also, update the "current" school details to this newly registered one.
  // This makes it the active school for subsequent operations in the mock setup.
  updateMockSchoolDetails(newSchool);
  
  // Create an admin user for this new school
  try {
    const adminUserData: Omit<User, 'id' | 'schoolName' | 'schoolAddress'> & {schoolName: string, schoolAddress: string} = {
      name: `${input.instituteName} Admin`, // Or a generic name
      email: input.adminEmail,
      role: 'Admin',
      schoolCode: schoolCode,
      schoolName: newSchool.schoolName,
      schoolAddress: `${newSchool.address}, ${newSchool.city}, ${newSchool.state} ${newSchool.pincode}`,
      designation: 'Administrator', // Default designation for admin
    };
    const adminUser = await addUser(adminUserData);
    console.log('[Service:school] Admin user created for new institute:', adminUser.name);
    return { success: true, schoolCode, message: 'Institute registered successfully.', adminUser };

  } catch (userError: any) {
    console.error('[Service:school] Failed to create admin user for new institute:', userError);
    // Even if admin user creation fails, the institute is registered.
    // The admin can try signing up manually using the school code and email.
    return { success: true, schoolCode, message: `Institute registered, but admin user creation failed: ${userError.message}. Please try signup manually.` };
  }
}


export async function getSchoolDetails(schoolCodeQuery: string): Promise<SchoolDetails | null> {
  console.log(`[Service:school] Fetching details for school code: ${schoolCodeQuery}`);
  await new Promise(resolve => setTimeout(resolve, 10));
  
  const institutes = getMockRegisteredInstitutes();
  const foundSchool = institutes.find(s => s.schoolCode.toLowerCase() === schoolCodeQuery.toLowerCase());
  
  if (foundSchool) {
    // If a specific school is found by code, make it the "current" school for the mock.
    updateMockSchoolDetails(foundSchool);
    return { ...foundSchool };
  }
  // If not found by code, return the "current" single mock school if its code matches, or null.
  const currentSchool = getMockSchoolDetails();
  if (currentSchool && currentSchool.schoolCode.toLowerCase() === schoolCodeQuery.toLowerCase()) {
     return { ...currentSchool };
  }
  return null;
}


export async function updateSchoolDetails(updatedDetailsInput: Partial<SchoolDetails>): Promise<SchoolDetails | null> {
  // This function will update the "current" school in the single mock details store,
  // and also find and update it in the list of registered institutes.
  
  const currentSchoolToUpdate = getMockSchoolDetails(); // Get the current single school
  if (!currentSchoolToUpdate) {
    console.error("[Service:school] No current school details found to update.");
    return null;
  }
  // The schoolCode for update should match the current school's code, or be provided to identify which school in the list.
  // For simplicity, this mock update will focus on the 'currentSchoolToUpdate'.
  const targetSchoolCode = updatedDetailsInput.schoolCode || currentSchoolToUpdate.schoolCode;


  console.log(`[Service:school] Updating school: ${targetSchoolCode}`);
  await new Promise(resolve => setTimeout(resolve, 10));
  
  let schoolInListUpdated = false;
  const institutesList = getMockRegisteredInstitutes();
  const updatedInstitutesList = institutesList.map(school => {
    if (school.schoolCode === targetSchoolCode) {
      schoolInListUpdated = true;
      return { ...school, ...updatedDetailsInput, schoolCode: targetSchoolCode }; // Ensure schoolCode isn't changed if it's the identifier
    }
    return school;
  });

  if (!schoolInListUpdated) {
     console.warn(`[Service:school] School with code ${targetSchoolCode} not found in the registered list for update.`);
     // Optionally, still update the 'current' single school detail if it matches.
  } else {
      updateMockRegisteredInstitutes(updatedInstitutesList);
  }

  // Update the 'current' single school details if it's the one being targeted
  if (currentSchoolToUpdate.schoolCode === targetSchoolCode) {
      const newDetailsForSingleStore = { ...currentSchoolToUpdate, ...updatedDetailsInput, schoolCode: targetSchoolCode };
      updateMockSchoolDetails(newDetailsForSingleStore);
      return { ...newDetailsForSingleStore };
  } else if (schoolInListUpdated) { // If current wasn't target, but list was updated
      const updatedSchoolFromList = updatedInstitutesList.find(s => s.schoolCode === targetSchoolCode);
      return updatedSchoolFromList ? { ...updatedSchoolFromList } : null;
  }
  
  return null; // If no relevant school was updated
}
