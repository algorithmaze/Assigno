
import type { User } from '@/context/auth-context';
import { addUser } from './users'; // For creating admin user
import { DEFAULT_TEST_SCHOOL_CONST } from './defaults'; // Import from new defaults file

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
  var mockRegisteredInstitutes_assigno_school_list: SchoolDetails[] | undefined;
  var mockRegisteredInstitutesInitialized_assigno_school_list: boolean | undefined;
}

const REGISTERED_INSTITUTES_STORAGE_KEY = 'assigno_mock_registered_institutes_v9_default_school'; // Incremented version

const DEFAULT_TEST_SCHOOL: SchoolDetails = {...DEFAULT_TEST_SCHOOL_CONST}; // Use the imported constant


// Initialize global store for a LIST of registered institutes
function initializeGlobalInstitutesListStore(): SchoolDetails[] {

  if (typeof window === 'undefined') {
    if (!globalThis.mockRegisteredInstitutes_assigno_school_list) {
        globalThis.mockRegisteredInstitutes_assigno_school_list = [{...DEFAULT_TEST_SCHOOL}];
        globalThis.mockRegisteredInstitutesInitialized_assigno_school_list = true;
        console.log("[Service:school] Server-side: Initialized global institutes LIST with default test school.");
    }
    return globalThis.mockRegisteredInstitutes_assigno_school_list;
  }

  if (globalThis.mockRegisteredInstitutes_assigno_school_list && globalThis.mockRegisteredInstitutesInitialized_assigno_school_list) {
    return globalThis.mockRegisteredInstitutes_assigno_school_list;
  }

  let finalInstitutesList: SchoolDetails[] = [];
  try {
    const storedData = localStorage.getItem(REGISTERED_INSTITUTES_STORAGE_KEY);
    if (storedData) {
      const institutesListFromStorage = JSON.parse(storedData) as SchoolDetails[];
      finalInstitutesList = [...institutesListFromStorage];

      // Ensure default test school is present and up-to-date
      const defaultSchoolIndex = finalInstitutesList.findIndex(s => s.adminEmail === DEFAULT_TEST_SCHOOL.adminEmail); // Match by adminEmail
      if (defaultSchoolIndex !== -1) {
          // If default school is found, update its details to ensure it's current, but keep its existing schoolCode
          finalInstitutesList[defaultSchoolIndex] = {
              ...DEFAULT_TEST_SCHOOL, // Use current default details
              schoolCode: finalInstitutesList[defaultSchoolIndex].schoolCode, // Preserve existing school code
          };
          console.log("[Service:school] Default test school details updated in list from localStorage.");
      } else {
          finalInstitutesList.push({...DEFAULT_TEST_SCHOOL});
          console.log("[Service:school] Default test school added to list from localStorage.");
      }

      console.log("[Service:school] Initialized global institutes LIST from localStorage:", finalInstitutesList.length, "institutes loaded.");
    } else {
        finalInstitutesList = [{...DEFAULT_TEST_SCHOOL}];
        console.log("[Service:school] Initialized new global institutes LIST with default test school (localStorage was empty).");
    }
  } catch (error) {
    console.error("[Service:school] Error reading/parsing institutes LIST from localStorage. Re-initializing with default:", error);
    localStorage.removeItem(REGISTERED_INSTITUTES_STORAGE_KEY);
    finalInstitutesList = [{...DEFAULT_TEST_SCHOOL}];
  }

  globalThis.mockRegisteredInstitutes_assigno_school_list = finalInstitutesList;
  globalThis.mockRegisteredInstitutesInitialized_assigno_school_list = true;
  localStorage.setItem(REGISTERED_INSTITUTES_STORAGE_KEY, JSON.stringify(finalInstitutesList));
  return finalInstitutesList;
}


function getMockRegisteredInstitutes(): SchoolDetails[] {
   if (!globalThis.mockRegisteredInstitutes_assigno_school_list || !globalThis.mockRegisteredInstitutesInitialized_assigno_school_list) {
      console.warn("[Service:school] getMockRegisteredInstitutes: Store not initialized. Attempting recovery by initializing.");
     return initializeGlobalInstitutesListStore();
   }
  return globalThis.mockRegisteredInstitutes_assigno_school_list;
}

function updateMockRegisteredInstitutes(list: SchoolDetails[]): void {
  globalThis.mockRegisteredInstitutes_assigno_school_list = list;
  globalThis.mockRegisteredInstitutesInitialized_assigno_school_list = true;
  if (typeof window !== 'undefined') {
    localStorage.setItem(REGISTERED_INSTITUTES_STORAGE_KEY, JSON.stringify(list));
    console.log("[Service:school] Updated institutes LIST in global store and localStorage:", list.length, "total institutes.");
  }
}

export async function ensureMockDataInitialized() {
    if (typeof window !== 'undefined' && !globalThis.mockRegisteredInstitutesInitialized_assigno_school_list) {
        initializeGlobalInstitutesListStore();
    } else if (typeof window === 'undefined' && !globalThis.mockRegisteredInstitutesInitialized_assigno_school_list) {
        initializeGlobalInstitutesListStore();
    }
     // Also ensure users service is initialized if it's a dependency for admin creation
    const usersModule = await import('./users');
    if (usersModule && typeof usersModule.ensureMockDataInitialized === 'function') {
        await usersModule.ensureMockDataInitialized();
    }
}

// Initialize stores on load for client-side
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  ensureMockDataInitialized();
}


function generateSchoolCode(instituteName: string): string {
  const namePart = instituteName.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 3).toUpperCase();
  let randomPart = Math.floor(1000 + Math.random() * 9000).toString();
  let schoolCode = `${namePart}${randomPart}`;

  const existingCodes = new Set(getMockRegisteredInstitutes().map(s => s.schoolCode));
  let attempts = 0;
  while (existingCodes.has(schoolCode) && attempts < 20) {
    randomPart = Math.floor(1000 + Math.random() * 9000).toString();
    schoolCode = `${namePart}${randomPart}`;
    attempts++;
  }
  if (attempts >= 20) {
    console.warn("High attempts for school code uniqueness for mock. Consider a more robust generation if this persists.");
    // Fallback to longer random part if collisions persist
    schoolCode = `${namePart}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    if(existingCodes.has(schoolCode)) schoolCode = `${namePart}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  }
  return schoolCode;
}

export async function registerInstitute(
  input: InstituteRegistrationInput
): Promise<InstituteRegistrationResult> {
  await ensureMockDataInitialized();
  console.log('[Service:school] Attempting to register institute:', input.instituteName);

  const existingInstitutes = getMockRegisteredInstitutes();

  if (existingInstitutes.some(inst => inst.adminEmail.toLowerCase() === input.adminEmail.toLowerCase())) {
    console.warn(`[Service:school] Registration failed: Admin email ${input.adminEmail} already exists.`);
    return { success: false, message: 'An institute with this admin email is already registered.' };
  }
  // Allow same institute name, but admin email must be unique.
  // if (existingInstitutes.some(inst => inst.schoolName.toLowerCase() === input.instituteName.toLowerCase())) {
  //   console.warn(`[Service:school] Registration failed: Institute name ${input.instituteName} already exists.`);
  //   return { success: false, message: 'An institute with this name is already registered.' };
  // }


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
    const usersModule = await import('./users'); // Ensure users service is ready
    if (usersModule && typeof usersModule.ensureMockDataInitialized === 'function') {
      await usersModule.ensureMockDataInitialized();
    } else {
      throw new Error("Users service could not be initialized for admin creation.");
    }

    const adminUserData: Omit<User, 'id' | 'schoolName' | 'schoolAddress'> & {schoolName: string, schoolAddress: string} = {
      name: `${input.instituteName} Admin`,
      email: input.adminEmail,
      role: 'Admin',
      schoolCode: schoolCode,
      schoolName: newSchool.schoolName,
      schoolAddress: `${newSchool.address}, ${newSchool.city}, ${newSchool.state} ${newSchool.pincode}`,
      designation: 'Administrator',
    };
    const adminUser = await addUser(adminUserData);
    console.log('[Service:school] Admin user created for new institute:', adminUser.name, adminUser.id);
    return { success: true, schoolCode, message: 'Institute registered successfully.', adminUser };

  } catch (userError: any) {
    console.error('[Service:school] Failed to create admin user for new institute:', userError);
    // Rollback school registration if admin creation fails? For mock, maybe not critical.
    // For production, transactional behavior would be needed.
    return { success: true, schoolCode, message: `Institute registered, but admin user creation failed: ${userError.message}. Please try signup manually.` };
  }
}


export async function getSchoolDetails(schoolCodeQuery: string): Promise<SchoolDetails | null> {
  await ensureMockDataInitialized();
  console.log(`[Service:school] Fetching details for school code: ${schoolCodeQuery}`);

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
  await ensureMockDataInitialized();
  const targetSchoolCode = updatedDetailsInput.schoolCode;
  if (!targetSchoolCode) {
    console.error("[Service:school] School code is required to update school details.");
    return null;
  }

  console.log(`[Service:school] Updating school: ${targetSchoolCode}`);

  let schoolFoundAndUpdated = false;
  const institutesList = getMockRegisteredInstitutes();
  const updatedInstitutesList = institutesList.map(school => {
    if (school.schoolCode === targetSchoolCode) {
      schoolFoundAndUpdated = true;
      // Ensure only allowed fields are updated and schoolCode itself is not changed via this route
      const { schoolCode, registrationDate, ...updatableFields } = updatedDetailsInput;
      const updatedSchool = { ...school, ...updatableFields };
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
