
// TODO: Firebase - Import necessary Firebase modules (e.g., getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs)
// import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
// import { db } from '@/lib/firebase'; // Assuming you have a firebase.ts setup file

import type { User } from '@/context/auth-context';
import { getSchoolDetails } from './school';
import * as XLSX from 'xlsx';


// Define sampleCredentials and related constants first
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
        designation: 'Administrator' as 'Administrator', // Explicitly Admin designation
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


// Use a global variable for mock data in non-production environments
declare global {
  var mockUsersData_assigno_users: User[] | undefined;
  var mockUsersInitialized_assigno_users: boolean | undefined;
}

const USERS_STORAGE_KEY = 'assigno_mock_users_data_v3'; 

function initializeGlobalUsersStore(): User[] {
    if (typeof window === 'undefined') {
        return []; 
    }
    if (globalThis.mockUsersData_assigno_users && globalThis.mockUsersInitialized_assigno_users) {
        return globalThis.mockUsersData_assigno_users;
    }
    try {
        const storedData = localStorage.getItem(USERS_STORAGE_KEY);
        if (storedData) {
            const parsedJson = JSON.parse(storedData);
            if (Array.isArray(parsedJson)) {
                const users: User[] = parsedJson.map((u: any) => ({
                    id: String(u.id || `temp-id-${Math.random()}`),
                    name: String(u.name || 'Unknown User'),
                    email: typeof u.email === 'string' ? u.email : undefined,
                    phoneNumber: typeof u.phoneNumber === 'string' ? u.phoneNumber : undefined,
                    role: ['Student', 'Teacher', 'Admin'].includes(u.role) ? u.role : 'Student',
                    schoolCode: String(u.schoolCode || SCHOOL_CODE),
                    schoolName: typeof u.schoolName === 'string' ? u.schoolName : "Sample Sr. Sec. School",
                    schoolAddress: typeof u.schoolAddress === 'string' ? u.schoolAddress : "456 School Road, Testville",
                    profilePictureUrl: typeof u.profilePictureUrl === 'string' ? u.profilePictureUrl : `${DEFAULT_PROFILE_URL_BASE}${u.id || 'default'}`,
                    admissionNumber: typeof u.admissionNumber === 'string' ? u.admissionNumber : undefined,
                    class: typeof u.class === 'string' ? u.class : undefined,
                    designation: typeof u.designation === 'string' ? u.designation : undefined,
                }));
                globalThis.mockUsersData_assigno_users = users;
                globalThis.mockUsersInitialized_assigno_users = true;
                console.log("[Service:users] Initialized global users store from localStorage.", users.length, "users loaded.");
                return users;
            } else {
                 console.warn("[Service:users] localStorage data is not an array. Initializing with sample credentials.");
            }
        }
    } catch (error) {
        console.error("[Service:users] Error reading/parsing users from localStorage. Initializing with sample credentials:", error);
        // Clear potentially corrupted data
        localStorage.removeItem(USERS_STORAGE_KEY);
    }

    const safeSampleCredentials = sampleCredentials || {};
    const initialUsers = Object.values(safeSampleCredentials).map(cred => {
        if (!cred || typeof cred.id === 'undefined' || typeof cred.name === 'undefined' || typeof cred.role === 'undefined' || typeof cred.schoolCode === 'undefined') {
            console.warn("[Service:users] Malformed or incomplete credential in sampleCredentials, skipping:", cred);
            return null; 
        }
        return {
            id: cred.id,
            name: cred.name,
            email: cred.email,
            phoneNumber: cred.phoneNumber,
            role: cred.role,
            schoolCode: cred.schoolCode,
            schoolName: "Sample Sr. Sec. School", 
            schoolAddress: "456 School Road, Testville", 
            profilePictureUrl: cred.profilePictureUrl || `${DEFAULT_PROFILE_URL_BASE}${cred.id}`,
            admissionNumber: cred.admissionNumber,
            class: cred.class,
            designation: cred.designation,
        };
    }).filter(user => user !== null) as User[];
    
    globalThis.mockUsersData_assigno_users = initialUsers;
    globalThis.mockUsersInitialized_assigno_users = true;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
    console.log("[Service:users] Initialized new global users store with sample credentials and saved to localStorage.");
    return initialUsers;
}


function getMockUsersData(): User[] {
  if (typeof window === 'undefined') {
    // For server-side, ensure data is initialized if not already
    if (!globalThis.mockUsersInitialized_assigno_users) {
        ensureMockDataInitialized_server();
    }
    return globalThis.mockUsersData_assigno_users || [];
  }
  // Client-side
  if (!globalThis.mockUsersData_assigno_users || !globalThis.mockUsersInitialized_assigno_users) {
    return initializeGlobalUsersStore();
  }
  return globalThis.mockUsersData_assigno_users;
}

function updateMockUsersData(newData: User[]): void {
  if (typeof window === 'undefined') {
    globalThis.mockUsersData_assigno_users = newData; 
    globalThis.mockUsersInitialized_assigno_users = true; // Mark as initialized for server context
    return;
  }
  // Client-side
  globalThis.mockUsersData_assigno_users = newData; 
  globalThis.mockUsersInitialized_assigno_users = true; 
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newData));
    console.log("[Service:users] Saved", newData.length, "users to localStorage.");
  } catch (error) {
    console.error("[Service:users] Error writing users to localStorage:", error);
  }
}

// Client-side specific initialization (runs when module is loaded)
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    initializeGlobalUsersStore();
}

// Server-side specific initialization helper
function ensureMockDataInitialized_server() {
    if (globalThis.mockUsersInitialized_assigno_users) return;

    console.log("[Service:users] Server-side ensureMockDataInitialized_server: Initializing mock users store.");
    const safeSampleCredentials = sampleCredentials || {};
    const initialUsers = Object.values(safeSampleCredentials).map(cred => {
        if (!cred || typeof cred.id !== 'string' || typeof cred.name !== 'string' || typeof cred.role !== 'string' || typeof cred.schoolCode !== 'string') {
            console.warn("[Service:users] Server-init: Malformed credential, skipping:", cred);
            return null;
        }
        return {
            id: cred.id,
            name: cred.name,
            email: typeof cred.email === 'string' ? cred.email : undefined,
            phoneNumber: typeof cred.phoneNumber === 'string' ? cred.phoneNumber : undefined,
            role: cred.role as User['role'],
            schoolCode: cred.schoolCode,
            schoolName: "Sample Sr. Sec. School",
            schoolAddress: "456 School Road, Testville",
            profilePictureUrl: typeof cred.profilePictureUrl === 'string' ? cred.profilePictureUrl : `${DEFAULT_PROFILE_URL_BASE}${cred.id}`,
            admissionNumber: typeof cred.admissionNumber === 'string' ? cred.admissionNumber : undefined,
            class: typeof cred.class === 'string' ? cred.class : undefined,
            designation: typeof cred.designation === 'string' ? cred.designation : undefined,
        };
    }).filter(user => user !== null) as User[];

    globalThis.mockUsersData_assigno_users = initialUsers;
    globalThis.mockUsersInitialized_assigno_users = true;
    console.log("[Service:users] Initialized global users store with sample credentials for server context. Count:", initialUsers.length);
}


export async function ensureMockDataInitialized() {
    if (typeof window === 'undefined') { // Server-side or build-time
        ensureMockDataInitialized_server();
    } else if (process.env.NODE_ENV !== 'production') { // Client-side, dev environment
        if (!globalThis.mockUsersInitialized_assigno_users) {
            initializeGlobalUsersStore(); 
        }
    }
    // For production client-side, data should be loaded from actual DB, not localStorage primarily.
    // The check inside getMockUsersData will handle initial localStorage load if it exists.
}


export async function fetchUsersByIds(userIds: string[]): Promise<User[]> {
    await ensureMockDataInitialized();
    console.log(`[Service:users] Fetching users by IDs: ${userIds.join(', ')}`);
    
    await new Promise(resolve => setTimeout(resolve, 10)); 
    const users = getMockUsersData().filter(user => userIds.includes(user.id));
    console.log(`[Service:users] Found ${users.length} users for IDs (mock): ${userIds.join(', ')}`);
    return users.map(u => ({...u})); 
}

export async function searchUsers(schoolCode: string, searchTerm: string, excludeIds: string[] = []): Promise<User[]> {
    await ensureMockDataInitialized();
    console.log(`[Service:users] User search. Term: "${searchTerm}", School: "${schoolCode}", Excluding: ${excludeIds.length} IDs`);
    
    await new Promise(resolve => setTimeout(resolve, 10)); 
    const lowerSearchTerm = searchTerm.trim().toLowerCase();
    const filterByTerm = lowerSearchTerm.length > 0;
    const results = getMockUsersData().filter(user => {
        const matchesSchool = user.schoolCode === schoolCode;
        const isExcluded = excludeIds.includes(user.id);
        if (!matchesSchool || isExcluded) {
            return false;
        }
        if (!filterByTerm) { 
             return true; 
        }
        const matchesName = user.name.toLowerCase().includes(lowerSearchTerm);
        const matchesEmail = user.email && user.email.toLowerCase().includes(lowerSearchTerm);
        return matchesName || matchesEmail;
    });
    console.log(`[Service:users] Found ${results.length} users matching criteria (mock).`);
    return results.map(u => ({...u})).sort((a,b) => a.name.localeCompare(b.name));
}

export async function addUser(user: Omit<User, 'id' | 'schoolName' | 'schoolAddress' | 'profilePictureUrl'> & { id?: string }): Promise<User> {
    await ensureMockDataInitialized();
    console.log("[Service:users] Adding user:", user.name);
    
    const schoolDetails = await getSchoolDetails(user.schoolCode);
    const newUserId = user.id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const userToAdd: User = {
        id: newUserId,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        schoolCode: user.schoolCode,
        schoolName: schoolDetails?.schoolName,
        schoolAddress: schoolDetails?.address,
        profilePictureUrl: `https://picsum.photos/100/100?random=${newUserId.replace(/-/g,'')}`,
        admissionNumber: user.role === 'Student' ? user.admissionNumber : undefined,
        class: user.role === 'Student' || user.role === 'Teacher' ? user.class : undefined,
        designation: user.role === 'Teacher' ? user.designation : (user.role === 'Admin' ? 'Administrator' : undefined),
    };

    const currentUsers = getMockUsersData();
    const existingUserIndex = currentUsers.findIndex(existingUser => existingUser.id === userToAdd.id || (userToAdd.email && existingUser.email === userToAdd.email) || (userToAdd.phoneNumber && existingUser.phoneNumber === userToAdd.phoneNumber));

    if (existingUserIndex === -1) {
        const updatedUsers = [...currentUsers, userToAdd];
        updateMockUsersData(updatedUsers);
        console.log("[Service:users] Added mock user:", userToAdd.name);
        return {...userToAdd};
    } else {
        // User exists, update them (useful for re-uploading Excel with changes)
        currentUsers[existingUserIndex] = { ...currentUsers[existingUserIndex], ...userToAdd };
        updateMockUsersData([...currentUsers]); 
        console.log("[Service:users] Updated existing mock user:", userToAdd.name);
        return {...currentUsers[existingUserIndex]};
    }
}

export async function fetchAllUsers(schoolCode: string): Promise<User[]> {
     await ensureMockDataInitialized();
     console.log(`[Service:users] Fetching all users for school "${schoolCode}"`);
     
     await new Promise(resolve => setTimeout(resolve, 10)); 
     const users = getMockUsersData().filter(user => user.schoolCode === schoolCode);
     console.log(`[Service:users] Found ${users.length} users in school ${schoolCode} (mock).`);
     return users.map(u => ({...u})).sort((a,b) => a.name.localeCompare(b.name));
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    await ensureMockDataInitialized();
    console.log(`[Service:users] Updating user ${userId} with data:`, updates);
    
    await new Promise(resolve => setTimeout(resolve, 10)); 
    let currentUsers = getMockUsersData();
    const userIndex = currentUsers.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        console.error(`[Service:users] User ${userId} not found for update (mock).`);
        return null;
    }
    
    // Create a new user object with the updates applied
    const updatedUser = { ...currentUsers[userIndex], ...updates };
    
    // Create a new array for the users list, replacing the old user object with the updated one
    const updatedUsersList = [
        ...currentUsers.slice(0, userIndex),
        updatedUser,
        ...currentUsers.slice(userIndex + 1),
    ];
    
    updateMockUsersData(updatedUsersList); 
    console.log("[Service:users] Updated user (mock):", updatedUser.name);
    return { ...updatedUser }; 
}

export async function deleteUser(userId: string): Promise<boolean> {
    await ensureMockDataInitialized();
    console.log(`[Service:users] Deleting user ${userId}`);
    
    await new Promise(resolve => setTimeout(resolve, 10)); 
    const currentUsers = getMockUsersData();
    const initialLength = currentUsers.length;
    const updatedUsers = currentUsers.filter(u => u.id !== userId);
    
    if (updatedUsers.length < initialLength) {
        updateMockUsersData(updatedUsers);
        console.log(`[Service:users] User ${userId} deleted successfully (mock).`);
        return true;
    } else {
        console.error(`[Service:users] User ${userId} not found for deletion (mock).`);
        return false;
    }
}

export type ExcelUser = {
    Name: string;
    'Email or Phone'?: string; 
    Role: 'Student' | 'Teacher' | 'Admin'; 
    'Designation (Teacher Only)'?: 'Class Teacher' | 'Subject Teacher' | 'Administrator' | string; 
    'Class Handling (Teacher Only)'?: string; 
    'Admission Number (Student Only)'?: string;
    'Class (Student Only)'?: string;
};

export async function bulkAddUsersFromExcel(file: File, schoolCode: string): Promise<{ successCount: number, errorCount: number, errors: string[] }> {
    await ensureMockDataInitialized();
    const reader = new FileReader();
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    return new Promise((resolve, reject) => {
        reader.onload = async (event) => {
            try {
                const data = event.target?.result;
                if (!data) {
                    reject(new Error("Failed to read file data."));
                    return;
                }
                const workbook = XLSX.read(data, { type: 'binary' });
                
                const sheetNames = ["Teachers_Template", "Students_Template", "Existing_Staff", "Existing_Students"];
                let jsonData: ExcelUser[] = [];
                let processedSheets = 0;

                for (const sheetName of sheetNames) {
                    if (workbook.Sheets[sheetName]) {
                        const worksheet = workbook.Sheets[sheetName];
                        jsonData.push(...XLSX.utils.sheet_to_json<ExcelUser>(worksheet));
                        processedSheets++;
                    }
                }
                 if (processedSheets === 0 && workbook.SheetNames.length > 0) {
                    console.warn("[Service:users] Specific sheets not found. Processing first available sheet as fallback.");
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    jsonData = XLSX.utils.sheet_to_json<ExcelUser>(worksheet);
                }


                if (jsonData.length === 0) {
                    errors.push("Excel file is empty or has no data in the expected sheets (Teachers_Template, Students_Template, Existing_Staff, Existing_Students or first sheet).");
                    errorCount = 1;
                    resolve({ successCount, errorCount, errors });
                    return;
                }
                
                const schoolDetails = await getSchoolDetails(schoolCode);
                if (!schoolDetails) {
                     errors.push(`Invalid school code "${schoolCode}" provided for bulk import.`);
                     errorCount = jsonData.length; 
                     jsonData.forEach(row => errors.push(`Skipping row for "${row.Name || 'N/A'}": Invalid school code.`));
                     resolve({ successCount, errorCount, errors });
                     return;
                }


                for (const row of jsonData) {
                    try {
                        if (!row.Name || !row.Role) {
                            errors.push(`Skipping row: Missing Name or Role. Row: ${JSON.stringify(row)}`);
                            errorCount++;
                            continue;
                        }
                         if (row.Role !== 'Student' && row.Role !== 'Teacher') {
                            // Admins are typically not bulk-added or managed this way. They are special users.
                            // If an 'Admin' role is in the Excel, we skip it for bulk *addition*.
                            // Existing admins might be updated if an ID match happens in addUser, but new admins aren't created via bulk.
                            errors.push(`Skipping row for "${row.Name}": Invalid Role "${row.Role}" for bulk addition. Only 'Student' or 'Teacher' can be bulk added.`);
                            errorCount++;
                            continue;
                        }

                        const baseUser: Omit<User, 'id' | 'schoolName' | 'schoolAddress' | 'profilePictureUrl'> & {id?: string} = {
                            name: row.Name,
                            email: row['Email or Phone']?.includes('@') ? row['Email or Phone'] : undefined,
                            phoneNumber: row['Email or Phone'] && !row['Email or Phone']?.includes('@') ? row['Email or Phone'] : undefined,
                            role: row.Role,
                            schoolCode: schoolCode,
                        };
                        
                        if (row.Role === 'Teacher') {
                            if(!row['Designation (Teacher Only)']){
                                errors.push(`Skipping Teacher "${row.Name}": Missing "Designation (Teacher Only)". Row: ${JSON.stringify(row)}`);
                                errorCount++;
                                continue;
                            }
                            if (row['Designation (Teacher Only)'] !== 'Class Teacher' && row['Designation (Teacher Only)'] !== 'Subject Teacher') {
                                errors.push(`Skipping Teacher "${row.Name}": Invalid "Designation (Teacher Only)" value "${row['Designation (Teacher Only)']}". Must be 'Class Teacher' or 'Subject Teacher'.`);
                                errorCount++;
                                continue;
                            }
                            baseUser.designation = row['Designation (Teacher Only)'];
                            baseUser.class = row['Class Handling (Teacher Only)'];
                        } else if (row.Role === 'Student') {
                            if(!row['Admission Number (Student Only)'] || !row['Class (Student Only)']){
                                 errors.push(`Skipping Student "${row.Name}": Missing "Admission Number (Student Only)" or "Class (Student Only)". Row: ${JSON.stringify(row)}`);
                                 errorCount++;
                                 continue;
                            }
                            baseUser.admissionNumber = row['Admission Number (Student Only)'];
                            baseUser.class = row['Class (Student Only)'];
                        }

                        await addUser(baseUser);
                        successCount++;
                    } catch (e: any) {
                        errors.push(`Error processing row for "${row.Name || 'Unknown Name'}": ${e.message || 'Unknown error'}`);
                        errorCount++;
                    }
                }
                resolve({ successCount, errorCount, errors });

            } catch (e: any) {
                console.error("Error processing Excel file:", e);
                reject(new Error(`Failed to process Excel file: ${e.message}`));
            }
        };
        reader.onerror = () => {
            reject(new Error("Failed to read the file."));
        };
        reader.readAsBinaryString(file);
    });
}

