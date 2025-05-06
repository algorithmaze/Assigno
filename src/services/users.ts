

// TODO: Firebase - Import necessary Firebase modules (e.g., getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs)
// import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
// import { db } from '@/lib/firebase'; // Assuming you have a firebase.ts setup file

import type { User } from '@/context/auth-context';
import { getSchoolDetails } from './school';
import * as XLSX from 'xlsx';


// Use a global variable for mock data in non-production environments
declare global {
  var mockUsersData_assigno_users: User[] | undefined;
  var mockUsersInitialized_assigno_users: boolean | undefined;
}

const USERS_STORAGE_KEY = 'assigno_mock_users_data_v2'; // Incremented version

function initializeGlobalUsersStore(): User[] {
    if (typeof window === 'undefined') {
        return []; // Server-side, return empty
    }
    if (globalThis.mockUsersData_assigno_users && globalThis.mockUsersInitialized_assigno_users) {
        return globalThis.mockUsersData_assigno_users;
    }
    try {
        const storedData = localStorage.getItem(USERS_STORAGE_KEY);
        if (storedData) {
            const users = JSON.parse(storedData) as User[];
            globalThis.mockUsersData_assigno_users = users;
            globalThis.mockUsersInitialized_assigno_users = true;
            console.log("[Service:users] Initialized global users store from localStorage.", users.length, "users loaded.");
            return users;
        }
    } catch (error) {
        console.error("[Service:users] Error reading users from localStorage during global init:", error);
    }

    // If no localStorage data or error, initialize with sampleCredentials
    const initialUsers = Object.values(sampleCredentials).map(cred => ({
        id: cred.id,
        name: cred.name,
        email: cred.email,
        phoneNumber: cred.phoneNumber,
        role: cred.role,
        schoolCode: cred.schoolCode,
        schoolName: "Sample Sr. Sec. School", // Default, to be updated if school service is called
        schoolAddress: "456 School Road, Testville", // Default
        profilePictureUrl: cred.profilePictureUrl || `${DEFAULT_PROFILE_URL_BASE}${cred.id}`,
        admissionNumber: cred.admissionNumber,
        class: cred.class,
        designation: cred.designation,
    }));
    
    globalThis.mockUsersData_assigno_users = initialUsers;
    globalThis.mockUsersInitialized_assigno_users = true;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
    console.log("[Service:users] Initialized new global users store with sample credentials and saved to localStorage.");
    return initialUsers;
}


function getMockUsersData(): User[] {
  if (typeof window === 'undefined') {
    return []; // Server-side, return empty
  }
  if (!globalThis.mockUsersData_assigno_users || !globalThis.mockUsersInitialized_assigno_users) {
    return initializeGlobalUsersStore();
  }
  return globalThis.mockUsersData_assigno_users;
}

function updateMockUsersData(newData: User[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  globalThis.mockUsersData_assigno_users = newData; // Update global store
  globalThis.mockUsersInitialized_assigno_users = true; // Ensure this is set
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newData));
    console.log("[Service:users] Saved", newData.length, "users to localStorage.");
  } catch (error) {
    console.error("[Service:users] Error writing users to localStorage:", error);
  }
}

// Initialize on load for client-side
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    initializeGlobalUsersStore();
}


// Define sampleCredentials and related constants directly in users.ts
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

export async function ensureMockDataInitialized() {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        if (!globalThis.mockUsersInitialized_assigno_users) {
            initializeGlobalUsersStore(); // This will also populate from sampleCredentials if localStorage is empty
        }
    }
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
        profilePictureUrl: `https://picsum.photos/100/100?random=${newUserId}`,
        admissionNumber: user.role === 'Student' ? user.admissionNumber : undefined,
        class: user.role === 'Student' || user.role === 'Teacher' ? user.class : undefined,
        designation: user.role === 'Teacher' ? user.designation : undefined,
    };

    const currentUsers = getMockUsersData();
    if (!currentUsers.some(existingUser => existingUser.id === userToAdd.id)) {
        const updatedUsers = [...currentUsers, userToAdd];
        updateMockUsersData(updatedUsers);
        console.log("[Service:users] Added mock user:", userToAdd.name);
        return {...userToAdd};
    } else {
        console.log("[Service:users] User already exists, not adding (mock):", userToAdd.id);
        const existingUserIndex = currentUsers.findIndex(u => u.id === userToAdd.id);
        if (existingUserIndex !== -1) {
            currentUsers[existingUserIndex] = { ...currentUsers[existingUserIndex], ...userToAdd };
            updateMockUsersData([...currentUsers]); // Ensure new array reference for reactivity
            console.log("[Service:users] Updated existing mock user:", userToAdd.name);
            return {...currentUsers[existingUserIndex]};
        }
        // This path should ideally not be hit if the some() check is correct
        return currentUsers.find(u => u.id === userToAdd.id)!; 
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
    const currentUsers = getMockUsersData();
    const userIndex = currentUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        console.error(`[Service:users] User ${userId} not found for update (mock).`);
        return null;
    }
    currentUsers[userIndex] = { ...currentUsers[userIndex], ...updates };
    updateMockUsersData([...currentUsers]); // Ensure new array reference
    console.log("[Service:users] Updated user (mock):", currentUsers[userIndex].name);
    return { ...currentUsers[userIndex] }; 
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
    Role: 'Student' | 'Teacher';
    'Designation (Teacher Only)'?: 'Class Teacher' | 'Subject Teacher';
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
                const sheetName = workbook.SheetNames[0]; 
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json<ExcelUser>(worksheet);

                if (jsonData.length === 0) {
                    errors.push("Excel file is empty or has no data in the first sheet.");
                    errorCount = 1;
                    resolve({ successCount, errorCount, errors });
                    return;
                }
                
                const schoolDetails = await getSchoolDetails(schoolCode);
                if (!schoolDetails) {
                     errors.push(`Invalid school code "${schoolCode}" provided for bulk import.`);
                     errorCount = jsonData.length; // All rows will fail if school code is invalid
                     // Add individual row errors for clarity
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
                            errors.push(`Skipping row for "${row.Name}": Invalid Role "${row.Role}". Must be 'Student' or 'Teacher'.`);
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
                        errors.push(`Error processing row for "${row.Name}": ${e.message || 'Unknown error'}`);
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

// Run self-initialization when the module is loaded (primarily for client-side dev)
// Ensure this is called after sampleCredentials is defined
// Moved to a callable ensureMockDataInitialized for better control

