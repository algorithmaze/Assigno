
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


let mockUsersData: User[] = globalThis.mockUsersData_assigno_users || [];
let isMockDataInitialized = globalThis.mockUsersInitialized_assigno_users || false;

if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    if (!globalThis.mockUsersData_assigno_users) {
        globalThis.mockUsersData_assigno_users = [];
    }
    if (globalThis.mockUsersInitialized_assigno_users === undefined) {
        globalThis.mockUsersInitialized_assigno_users = false;
    }
    mockUsersData = globalThis.mockUsersData_assigno_users;
    isMockDataInitialized = globalThis.mockUsersInitialized_assigno_users;
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

type SampleCredentialsType = typeof sampleCredentials;


async function transformCredentialToUser(cred: SampleCredentialsType[keyof SampleCredentialsType]): Promise<User> {
    const schoolDetails = await getSchoolDetails(cred.schoolCode);
    return {
        id: cred.id,
        name: cred.name,
        email: cred.email,
        phoneNumber: cred.phoneNumber,
        role: cred.role,
        schoolCode: cred.schoolCode,
        schoolName: schoolDetails?.schoolName,
        schoolAddress: schoolDetails?.address,
        profilePictureUrl: cred.profilePictureUrl || `https://picsum.photos/100/100?random=${cred.id}`,
        admissionNumber: cred.admissionNumber,
        class: cred.class,
        designation: cred.designation,
    };
}

// Self-initialization function for mock users
async function selfInitializeMockUsers() {
    if (isMockDataInitialized || process.env.NODE_ENV === 'production') return;

    console.log("[Service:users] Self-initializing mock users from local credentials...");
    const transformedUsers = await Promise.all(
        Object.values(sampleCredentials).map(cred => transformCredentialToUser(cred))
    );
    
    const uniqueUsersMap = new Map<string, User>();
    transformedUsers.forEach(user => {
        if (!uniqueUsersMap.has(user.id)) {
            uniqueUsersMap.set(user.id, user);
        }
    });
    
    mockUsersData.splice(0, mockUsersData.length, ...Array.from(uniqueUsersMap.values())); // Replace current mock data
    
    isMockDataInitialized = true;
    if (typeof window !== 'undefined') { // Ensure globalThis is only set client-side for dev
        globalThis.mockUsersData_assigno_users = mockUsersData;
        globalThis.mockUsersInitialized_assigno_users = isMockDataInitialized;
    }
    console.log("[Service:users] Self-initialized mock users:", mockUsersData.length, mockUsersData.map(u => `${u.name} (${u.role})`));
}

// Run self-initialization when the module is loaded (primarily for client-side dev)
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    selfInitializeMockUsers();
}


export async function fetchUsersByIds(userIds: string[]): Promise<User[]> {
    if (!isMockDataInitialized) {
        console.warn("[Service:users] Mock data not initialized in fetchUsersByIds. Attempting self-initialization.");
        await selfInitializeMockUsers();
    }
    console.log(`[Service:users] Fetching users by IDs: ${userIds.join(', ')}`);
    // TODO: Firebase - Replace with multiple getDoc calls or a more efficient Firestore query if possible (e.g., IN query for up to 30 IDs)
    // const firestore = getFirestore();
    // const usersPromises = userIds.map(id => getDoc(doc(firestore, 'users', id)));
    // const userDocs = await Promise.all(usersPromises);
    // const users = userDocs.filter(docSnap => docSnap.exists()).map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as User));
    // console.log(`[Service:users] Found ${users.length} users for IDs from Firestore: ${userIds.join(', ')}`);
    // return users;

    // --- Mock implementation ---
    await new Promise(resolve => setTimeout(resolve, 10)); // Reduced delay
    const users = mockUsersData.filter(user => userIds.includes(user.id));
    console.log(`[Service:users] Found ${users.length} users for IDs (mock): ${userIds.join(', ')}`);
    return users.map(u => ({...u})); 
    // --- End mock implementation ---
}

export async function searchUsers(schoolCode: string, searchTerm: string, excludeIds: string[] = []): Promise<User[]> {
    if (!isMockDataInitialized) {
       console.warn("[Service:users] Mock data not initialized in searchUsers. Attempting self-initialization.");
        await selfInitializeMockUsers();
    }
    console.log(`[Service:users] User search. Term: "${searchTerm}", School: "${schoolCode}", Excluding: ${excludeIds.length} IDs`);
    // TODO: Firebase - Replace with Firestore query. This is complex to replicate exactly with client-side filtering.
    // Firestore queries for searching parts of strings typically require a third-party search service like Algolia or Typesense,
    // or careful data structuring (e.g., storing keywords in an array).
    // A simple Firestore query might look like:
    // const firestore = getFirestore();
    // const usersCol = collection(firestore, 'users');
    // let q = query(usersCol, where('schoolCode', '==', schoolCode));
    // // Further filtering by searchTerm and excludeIds would be done client-side on the results, or by structuring data for search.
    // const snapshot = await getDocs(q);
    // let results = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as User));
    // results = results.filter(user => !excludeIds.includes(user.id) && 
    //    (user.name.toLowerCase().includes(lowerSearchTerm) || (user.email && user.email.toLowerCase().includes(lowerSearchTerm)))
    // );

    // --- Mock implementation ---
    await new Promise(resolve => setTimeout(resolve, 10)); // Reduced delay
    const lowerSearchTerm = searchTerm.trim().toLowerCase();
    const filterByTerm = lowerSearchTerm.length > 0;
    const results = mockUsersData.filter(user => {
        const matchesSchool = user.schoolCode === schoolCode;
        const isExcluded = excludeIds.includes(user.id);
        if (!matchesSchool || isExcluded) {
            return false;
        }
        if (!filterByTerm) { // If no search term, return all non-excluded users from the school
             return true; 
        }
        // If there is a search term, filter by it
        const matchesName = user.name.toLowerCase().includes(lowerSearchTerm);
        const matchesEmail = user.email && user.email.toLowerCase().includes(lowerSearchTerm);
        return matchesName || matchesEmail;
    });
    console.log(`[Service:users] Found ${results.length} users matching criteria (mock).`);
    return results.map(u => ({...u}));
    // --- End mock implementation ---
}

export async function addUser(user: Omit<User, 'id' | 'schoolName' | 'schoolAddress' | 'profilePictureUrl'> & { id?: string }): Promise<User> {
    if (!isMockDataInitialized) {
        console.warn("[Service:users] Mock data not initialized in addUser. Attempting self-initialization.");
         await selfInitializeMockUsers();
    }
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

    // TODO: Firebase - Replace with Firestore setDoc (if ID is known, e.g., auth UID) or addDoc
    // const firestore = getFirestore();
    // const userRef = doc(firestore, 'users', userToAdd.id); 
    // await setDoc(userRef, userToAdd); 
    // console.log("[Service:users] Added user to Firestore:", userToAdd.name);
    // return userToAdd;

    // --- Mock implementation ---
    if (!mockUsersData.some(existingUser => existingUser.id === userToAdd.id)) {
        mockUsersData.push(userToAdd);
        if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
            globalThis.mockUsersData_assigno_users = mockUsersData;
        }
        console.log("[Service:users] Added mock user:", userToAdd.name);
        return {...userToAdd};
    } else {
        console.log("[Service:users] User already exists, not adding (mock):", userToAdd.id);
        // Optionally update existing user if ID was provided and matched
        const existingUserIndex = mockUsersData.findIndex(u => u.id === userToAdd.id);
        if (existingUserIndex !== -1) {
            mockUsersData[existingUserIndex] = { ...mockUsersData[existingUserIndex], ...userToAdd };
             if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
                globalThis.mockUsersData_assigno_users = mockUsersData;
            }
            console.log("[Service:users] Updated existing mock user:", userToAdd.name);
            return {...mockUsersData[existingUserIndex]};
        }
        return mockUsersData.find(u => u.id === userToAdd.id)!; 
    }
    // --- End mock implementation ---
}

export async function fetchAllUsers(schoolCode: string): Promise<User[]> {
     if (!isMockDataInitialized) {
        console.warn("[Service:users] Mock data not initialized in fetchAllUsers. Attempting self-initialization.");
         await selfInitializeMockUsers();
     }
     console.log(`[Service:users] Fetching all users for school "${schoolCode}"`);
     // TODO: Firebase - Replace with Firestore query
     // const firestore = getFirestore();
     // const usersCol = collection(firestore, 'users');
     // const q = query(usersCol, where('schoolCode', '==', schoolCode));
     // const snapshot = await getDocs(q);
     // const users = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as User));
     // console.log(`[Service:users] Found ${users.length} users in school ${schoolCode} from Firestore.`);
     // return users;

     // --- Mock implementation ---
     await new Promise(resolve => setTimeout(resolve, 10)); // Reduced delay
     const users = mockUsersData.filter(user => user.schoolCode === schoolCode);
     console.log(`[Service:users] Found ${users.length} users in school ${schoolCode} (mock).`);
     return users.map(u => ({...u}));
     // --- End mock implementation ---
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    if (!isMockDataInitialized) {
        console.warn("[Service:users] Mock data not initialized in updateUser. Attempting self-initialization.");
         await selfInitializeMockUsers();
    }
    console.log(`[Service:users] Updating user ${userId} with data:`, updates);
    // TODO: Firebase - Replace with Firestore updateDoc
    // const firestore = getFirestore();
    // const userRef = doc(firestore, 'users', userId);
    // await updateDoc(userRef, updates);
    // const updatedUserSnap = await getDoc(userRef);
    // if (!updatedUserSnap.exists()) return null;
    // const updatedUser = {id: updatedUserSnap.id, ...updatedUserSnap.data()} as User;
    // console.log("[Service:users] Updated user in Firestore:", updatedUser.name);
    // return updatedUser;

    // --- Mock implementation ---
    await new Promise(resolve => setTimeout(resolve, 10)); // Reduced delay
    const userIndex = mockUsersData.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        console.error(`[Service:users] User ${userId} not found for update (mock).`);
        return null;
    }
    mockUsersData[userIndex] = { ...mockUsersData[userIndex], ...updates };
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
        globalThis.mockUsersData_assigno_users = mockUsersData;
    }
    console.log("[Service:users] Updated user (mock):", mockUsersData[userIndex].name);
    return { ...mockUsersData[userIndex] }; 
    // --- End mock implementation ---
}

export async function deleteUser(userId: string): Promise<boolean> {
    if (!isMockDataInitialized) {
        console.warn("[Service:users] Mock data not initialized in deleteUser. Attempting self-initialization.");
         await selfInitializeMockUsers();
    }
    console.log(`[Service:users] Deleting user ${userId}`);
    // TODO: Firebase - Replace with Firestore deleteDoc
    // const firestore = getFirestore();
    // const userRef = doc(firestore, 'users', userId);
    // await deleteDoc(userRef);
    // console.log(`[Service:users] User ${userId} deleted successfully from Firestore.`);
    // // TODO: Firebase - Implement additional cleanup in Firestore (e.g., remove from groups' member arrays using batched writes or cloud functions)
    // return true;

    // --- Mock implementation ---
    await new Promise(resolve => setTimeout(resolve, 10)); // Reduced delay
    const initialLength = mockUsersData.length;
    mockUsersData = mockUsersData.filter(u => u.id !== userId);
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
        globalThis.mockUsersData_assigno_users = mockUsersData;
    }
    if (mockUsersData.length < initialLength) {
        console.log(`[Service:users] User ${userId} deleted successfully (mock).`);
        return true;
    } else {
        console.error(`[Service:users] User ${userId} not found for deletion (mock).`);
        return false;
    }
    // --- End mock implementation ---
}

export type ExcelUser = {
    Name: string;
    'Email or Phone'?: string; // Optional, can be derived or explicitly provided
    Role: 'Student' | 'Teacher';
    'Designation (Teacher Only)'?: 'Class Teacher' | 'Subject Teacher';
    'Class Handling (Teacher Only)'?: string; // e.g., "10A, 9B"
    'Admission Number (Student Only)'?: string;
    'Class (Student Only)'?: string;
};

export async function bulkAddUsersFromExcel(file: File, schoolCode: string): Promise<{ successCount: number, errorCount: number, errors: string[] }> {
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
                     errorCount = jsonData.length;
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

                        const baseUser: Omit<User, 'id' | 'schoolName' | 'schoolAddress' | 'profilePictureUrl'> & {id?: string} = {
                            name: row.Name,
                            email: row['Email or Phone']?.includes('@') ? row['Email or Phone'] : undefined,
                            phoneNumber: row['Email or Phone'] && !row['Email or Phone']?.includes('@') ? row['Email or Phone'] : undefined,
                            role: row.Role,
                            schoolCode: schoolCode,
                        };
                        
                        if (row.Role === 'Teacher') {
                            if(!row['Designation (Teacher Only)']){
                                errors.push(`Skipping Teacher "${row.Name}": Missing Designation. Row: ${JSON.stringify(row)}`);
                                errorCount++;
                                continue;
                            }
                            baseUser.designation = row['Designation (Teacher Only)'];
                            baseUser.class = row['Class Handling (Teacher Only)'];
                        } else if (row.Role === 'Student') {
                            if(!row['Admission Number (Student Only)'] || !row['Class (Student Only)']){
                                 errors.push(`Skipping Student "${row.Name}": Missing Admission Number or Class. Row: ${JSON.stringify(row)}`);
                                 errorCount++;
                                 continue;
                            }
                            baseUser.admissionNumber = row['Admission Number (Student Only)'];
                            baseUser.class = row['Class (Student Only)'];
                        } else {
                            errors.push(`Skipping row: Invalid Role "${row.Role}". Row: ${JSON.stringify(row)}`);
                            errorCount++;
                            continue;
                        }

                        // TODO: Firebase - In a real scenario, you'd likely want to check if user already exists by email/phone
                        // before creating a new one, or decide on an update strategy.
                        // For mock, we just add.
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
