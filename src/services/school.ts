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
  // For list of all registered institutes
  var mockRegisteredInstitutes_assigno_school_list: SchoolDetails[] | undefined;
  var mockRegisteredInstitutesInitialized_assigno_school_list: boolean | undefined;
}

const REGISTERED_INSTITUTES_STORAGE_KEY = 'assigno_mock_registered_institutes_v5_stantony_default'; // Version bump


// Initialize global store for a LIST of registered institutes
function initializeGlobalInstitutesListStore(): SchoolDetails[] {
  const stAntonySchool: SchoolDetails = {
    schoolCode: "STA987",
    schoolName: "ST.ANTONY SR. SEC SCHOOL",
    instituteType: "School",
    address: "456 Church Road, Vatican City",
    city: "Metropolis",
    state: "NY",
    pincode: "10001",
    contactNumber: "+1555010101",
    adminEmail: "admin@stantony.school",
    registrationDate: new Date().toISOString(),
  };

  if (typeof window === 'undefined') {
    if (!globalThis.mockRegisteredInstitutes_assigno_school_list) {
        // Server-side default includes St. Antony if list is not initialized
        globalThis.mockRegisteredInstitutes_assigno_school_list = [stAntonySchool];
        globalThis.mockRegisteredInstitutesInitialized_assigno_school_list = true;
        console.log("[Service:school] Server-side: Initialized global institutes LIST with St. Antony.");
    }
    return globalThis.mockRegisteredInstitutes_assigno_school_list;
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
  
  // Default to a list containing St. Antony school if nothing is stored
  const defaultList: SchoolDetails[] = [stAntonySchool];
  globalThis.mockRegisteredInstitutes_assigno_school_list = defaultList;
  globalThis.mockRegisteredInstitutesInitialized_assigno_school_list = true;
  localStorage.setItem(REGISTERED_INSTITUTES_STORAGE_KEY, JSON.stringify(defaultList));
  console.log("[Service:school] Initialized new global institutes LIST with St. Antony and saved to localStorage.");
  return defaultList;
}


// Get the list of all registered institutes
function getMockRegisteredInstitutes(): SchoolDetails[] {
   if (typeof window === 'undefined') {
     return globalThis.mockRegisteredInstitutes_assigno_school_list || initializeGlobalInstitutesListStore();
   }
  if (!globalThis.mockRegisteredInstitutes_assigno_school_list || !globalThis.mockRegisteredInstitutesInitialized_assigno_school_list) {
    return initializeGlobalInstitutesListStore();
  }
  return globalThis.mockRegisteredInstitutes_assigno_school_list;
}

// Update the list of registered institutes
function updateMockRegisteredInstitutes(list: SchoolDetails[]): void {
  globalThis.mockRegisteredInstitutes_assigno_school_list = list;
  globalThis.mockRegisteredInstitutesInitialized_assigno_school_list = true;
  if (typeof window !== 'undefined') {
    localStorage.setItem(REGISTERED_INSTITUTES_STORAGE_KEY, JSON.stringify(list));
    console.log("[Service:school] Updated institutes LIST in global store and localStorage:", list.length, "total institutes.");
  }
}


// Initialize stores on load for client-side
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  initializeGlobalInstitutesListStore();
}


function generateSchoolCode(instituteName: string): string {
  const namePart = instituteName.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 3).toUpperCase();
  let randomPart = Math.floor(1000 + Math.random() * 9000).toString();
  let schoolCode = `${namePart}${randomPart}`;
  
  const existingCodes = new Set(getMockRegisteredInstitutes().map(s => s.schoolCode));
  let attempts = 0;
  while (existingCodes.has(schoolCode) && attempts < 20) { // Increased attempts
    randomPart = Math.floor(1000 + Math.random() * 9000).toString();
    schoolCode = `${namePart}${randomPart}`;
    attempts++;
  }
  if (attempts >= 20) {
    console.warn("High attempts for school code uniqueness for mock. Consider a more robust generation if this persists.");
    // Fallback to longer random string if simple attempts fail
    schoolCode = `${namePart}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    if(existingCodes.has(schoolCode)) schoolCode = `${namePart}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`; // Even longer
  }
  return schoolCode;
}

export async function registerInstitute(
  input: InstituteRegistrationInput
): Promise<InstituteRegistrationResult> {
  console.log('[Service:school] Attempting to register institute:', input.instituteName);
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay

  const existingInstitutes = getMockRegisteredInstitutes(); // Ensure the list is initialized
  
  if (existingInstitutes.some(inst => inst.adminEmail.toLowerCase() === input.adminEmail.toLowerCase())) {
    console.warn(`[Service:school] Registration failed: Admin email ${input.adminEmail} already exists.`);
    return { success: false, message: 'An institute with this admin email is already registered.' };
  }
  if (existingInstitutes.some(inst => inst.schoolName.toLowerCase() === input.instituteName.toLowerCase())) {
    console.warn(`[Service:school] Registration failed: Institute name ${input.instituteName} already exists.`);
    return { success: false, message: 'An institute with this name is already registered.' };
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

  const updatedInstitutesList = [...existingInstitutes, newSchool];
  updateMockRegisteredInstitutes(updatedInstitutesList);
  console.log(`[Service:school] New school ${newSchool.schoolName} (Code: ${newSchool.schoolCode}) added to registered list.`);
  
  try {
    const adminUserData: Omit<User, 'id' | 'schoolName' | 'schoolAddress'> & {schoolName: string, schoolAddress: string} = {
      name: `${input.instituteName} Admin`,
      email: input.adminEmail,
      role: 'Admin',
      schoolCode: schoolCode,
      schoolName: newSchool.schoolName,
      schoolAddress: `${newSchool.address}, ${newSchool.city}, ${newSchool.state} ${newSchool.pincode}`,
      designation: 'Administrator',
    };
    const adminUser = await addUser(adminUserData); // addUser should handle its own data persistence
    console.log('[Service:school] Admin user created for new institute:', adminUser.name, adminUser.id);
    return { success: true, schoolCode, message: 'Institute registered successfully.', adminUser };

  } catch (userError: any) {
    console.error('[Service:school] Failed to create admin user for new institute:', userError);
    return { success: true, schoolCode, message: `Institute registered, but admin user creation failed: ${userError.message}. Please try signup manually.` };
  }
}


export async function getSchoolDetails(schoolCodeQuery: string): Promise<SchoolDetails | null> {
  console.log(`[Service:school] Fetching details for school code: ${schoolCodeQuery}`);
  await new Promise(resolve => setTimeout(resolve, 10));
  
  const institutes = getMockRegisteredInstitutes();
  const foundSchool = institutes.find(s => s.schoolCode.toLowerCase() === schoolCodeQuery.toLowerCase());
  
  if (foundSchool) {
    console.log(`[Service:school] Found school: ${foundSchool.schoolName} from registered list.`);
    return { ...foundSchool };
  }
  
  console.warn(`[Service:school] School with code ${schoolCodeQuery} not found in the registered list.`);
  return null;
}


export async function updateSchoolDetails(updatedDetailsInput: Partial<SchoolDetails>): Promise<SchoolDetails | null> {
  const targetSchoolCode = updatedDetailsInput.schoolCode; 
  if (!targetSchoolCode) {
    console.error("[Service:school] School code is required to update school details.");
    return null;
  }

  console.log(`[Service:school] Updating school: ${targetSchoolCode}`);
  await new Promise(resolve => setTimeout(resolve, 10));
  
  let schoolFoundAndUpdated = false;
  const institutesList = getMockRegisteredInstitutes();
  const updatedInstitutesList = institutesList.map(school => {
    if (school.schoolCode === targetSchoolCode) {
      schoolFoundAndUpdated = true;
      const updatedSchool = { ...school, ...updatedDetailsInput, schoolCode: targetSchoolCode };
      return updatedSchool;
    }
    return school;
  });

  if (!schoolFoundAndUpdated) {
     console.warn(`[Service:school] School with code ${targetSchoolCode} not found in the registered list for update.`);
     return null;
  }
  
  updateMockRegisteredInstitutes(updatedInstitutesList); 
  const newlyUpdatedSchoolFromList = updatedInstitutesList.find(s => s.schoolCode === targetSchoolCode);
  return newlyUpdatedSchoolFromList ? { ...newlyUpdatedSchoolFromList } : null;
}