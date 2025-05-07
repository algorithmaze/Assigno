
import type { User } from '@/context/auth-context';
import { getSchoolDetails } from './school';
import * as XLSX from 'xlsx';

// Use a global variable for mock data in non-production environments
declare global {
  var mockUsersData_assigno_users: User[] | undefined;
  var mockUsersInitialized_assigno_users: boolean | undefined;
}

const USERS_STORAGE_KEY = 'assigno_mock_users_data_v15_no_dummies'; // Incremented version


// Defines the default set of users. This is the source of truth for these specific users.
function getDefaultInitialUsers(): User[] {
    // No default dummy users are created here anymore.
    // Institute registration will create the first admin user for that institute.
    // Other users are added via admin panel or signup.
    return [];
}


function initializeGlobalUsersStore(): User[] {
    const defaultInitialUsers = getDefaultInitialUsers(); // Will be an empty array now

    if (typeof window === 'undefined') {
        const serverInitialUsers: User[] = [...defaultInitialUsers];
        globalThis.mockUsersData_assigno_users = serverInitialUsers;
        globalThis.mockUsersInitialized_assigno_users = true;
        console.log("[Service:users] Server-side: Initialized global users store with defaults.", serverInitialUsers.length, "users.");
        return serverInitialUsers;
    }

    if (globalThis.mockUsersData_assigno_users && globalThis.mockUsersInitialized_assigno_users) {
        return globalThis.mockUsersData_assigno_users;
    }

    let finalUserList: User[] = [];
    try {
        const storedData = localStorage.getItem(USERS_STORAGE_KEY);
        if (storedData) {
            const parsedJson = JSON.parse(storedData);
            if (Array.isArray(parsedJson)) {
                const usersFromStorage: User[] = parsedJson.map((u: any) => {
                    // Basic validation and defaulting for each field
                    const schoolCode = String(u.schoolCode || 'UNKNOWN_SC'); 
                    const schoolName = String(u.schoolName || 'Unknown School');
                    const schoolAddress = String(u.schoolAddress || 'N/A');
                    
                    return { 
                        id: String(u.id || `temp-id-${Math.random().toString(36).substring(2,7)}`),
                        name: String(u.name || 'Unknown User'),
                        email: typeof u.email === 'string' ? u.email : undefined,
                        phoneNumber: typeof u.phoneNumber === 'string' ? u.phoneNumber : undefined,
                        role: ['Student', 'Teacher', 'Admin'].includes(u.role) ? u.role : 'Student',
                        schoolCode: schoolCode,
                        schoolName: schoolName,
                        schoolAddress: schoolAddress,
                        profilePictureUrl: typeof u.profilePictureUrl === 'string' ? u.profilePictureUrl : undefined, // Let avatar fallback handle it
                        admissionNumber: typeof u.admissionNumber === 'string' ? u.admissionNumber : undefined,
                        class: typeof u.class === 'string' ? u.class : undefined,
                        designation: typeof u.designation === 'string' ? u.designation : undefined,
                    };
                });

                finalUserList = [...usersFromStorage];
                
                // Merging defaults is no longer needed as there are no predefined default users.
                // However, if there were any other default users (e.g., super admin), they would be merged here.
                // defaultInitialUsers.forEach(defaultUser => {
                //     const existingUserIndex = finalUserList.findIndex(u => u.id === defaultUser.id);
                //     if (existingUserIndex === -1) {
                //         finalUserList.push({...defaultUser}); 
                //     } else {
                //         // Update existing user with default values if needed, usually for specific fields
                //         finalUserList[existingUserIndex] = {
                //             ...finalUserList[existingUserIndex], 
                //             // Example of updating specific fields from default
                //             // role: defaultUser.role, 
                //         };
                //     }
                // });
                
                console.log("[Service:users] Client-side: Initialized global users store from localStorage.", finalUserList.length, "users loaded.");
            } else {
                 console.warn("[Service:users] Client-side: localStorage data is not an array. Re-initializing with defaults.");
                 finalUserList = [...defaultInitialUsers.map(u => ({...u}))]; // Will be empty array
            }
        } else {
             finalUserList = [...defaultInitialUsers.map(u => ({...u}))]; // Will be empty array
             console.log("[Service:users] Client-side: localStorage empty. Initialized new global users store with defaults (empty).");
        }
    } catch (error) {
        console.error("[Service:users] Client-side: Error reading/parsing users from localStorage. Re-initializing with defaults:", error);
        localStorage.removeItem(USERS_STORAGE_KEY); 
        finalUserList = [...defaultInitialUsers.map(u => ({...u}))]; // Will be empty array
    }
    
    globalThis.mockUsersData_assigno_users = finalUserList;
    globalThis.mockUsersInitialized_assigno_users = true;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(finalUserList));
    return finalUserList;
}


function getMockUsersData(): User[] {
  if (!globalThis.mockUsersData_assigno_users || !globalThis.mockUsersInitialized_assigno_users) {
     console.warn("[Service:users] getMockUsersData: Store not initialized. Attempting recovery by initializing.");
     return initializeGlobalUsersStore();
  }
  return globalThis.mockUsersData_assigno_users;
}

function updateMockUsersData(newData: User[]): void {
  globalThis.mockUsersData_assigno_users = newData;
  globalThis.mockUsersInitialized_assigno_users = true; // Ensure this is set
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newData));
      console.log("[Service:users] Saved", newData.length, "users to localStorage.");
    } catch (error) {
      console.error("[Service:users] Error writing users to localStorage:", error);
    }
  }
}

export async function ensureMockDataInitialized() {
    if (typeof window !== 'undefined' && !globalThis.mockUsersInitialized_assigno_users) {
        initializeGlobalUsersStore();
    } else if (typeof window === 'undefined' && !globalThis.mockUsersInitialized_assigno_users) {
        // For server-side calls, ensure it's initialized if not already.
        initializeGlobalUsersStore();
    }
}


// Initialize on load for client-side
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') { // ensure this only runs client side in dev
  ensureMockDataInitialized();
}


export async function fetchUsersByIds(userIds: string[]): Promise<User[]> {
    await ensureMockDataInitialized();
    console.log(`[Service:users] Fetching users by IDs: ${userIds.join(', ')}`);
    
    const users = getMockUsersData().filter(user => userIds.includes(user.id));
    console.log(`[Service:users] Found ${users.length} users for IDs (mock): ${userIds.join(', ')}`);
    return users.map(u => ({...u})); 
}

export async function searchUsers(schoolCode: string, searchTerm: string, excludeIds: string[] = []): Promise<User[]> {
    await ensureMockDataInitialized();
    console.log(`[Service:users] User search. Term: "${searchTerm}", School: "${schoolCode}", Excluding: ${excludeIds.length} IDs`);
    
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
        const matchesPhoneNumber = user.phoneNumber && user.phoneNumber.includes(lowerSearchTerm);
        return matchesName || matchesEmail || matchesPhoneNumber;
    });
    console.log(`[Service:users] Found ${results.length} users matching criteria (mock).`);
    return results.map(u => ({...u})).sort((a,b) => a.name.localeCompare(b.name)); 
}

export async function addUser(
    userData: Omit<User, 'id' | 'schoolName' | 'schoolAddress' | 'profilePictureUrl'> & {
        id?: string; schoolName?: string; schoolAddress?: string; profilePictureUrl?: string
    }
): Promise<User> {
    await ensureMockDataInitialized();
    console.log("[Service:users] Adding/Updating user:", userData.name, "with schoolCode:", userData.schoolCode);
    
    let schoolName = userData.schoolName;
    let schoolAddress = userData.schoolAddress;

    if (userData.schoolCode && (!schoolName || !schoolAddress)) {
        const schoolDetails = await getSchoolDetails(userData.schoolCode); 
        schoolName = schoolDetails?.schoolName || 'Unknown School';
        schoolAddress = schoolDetails ? `${schoolDetails.address}, ${schoolDetails.city}, ${schoolDetails.state} ${schoolDetails.pincode}` : 'N/A';
        console.log(`[Service:users] Fetched school details for ${userData.schoolCode}: ${schoolName}`);
    } else if (!userData.schoolCode) {
        console.warn("[Service:users] User data missing schoolCode. Cannot reliably add user without school context.");
        schoolName = schoolName || 'Placeholder School';
        schoolAddress = schoolAddress || 'Placeholder Address';
        userData.schoolCode = 'UNKNOWN_SC'; 
    }


    const newUserId = userData.id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const userToProcess: User = {
        id: newUserId,
        name: userData.name,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        role: userData.role,
        schoolCode: userData.schoolCode!, 
        schoolName: schoolName,
        schoolAddress: schoolAddress,
        profilePictureUrl: userData.profilePictureUrl, // Allow undefined, AvatarFallback will handle it
        admissionNumber: userData.role === 'Student' ? userData.admissionNumber : undefined,
        class: userData.role === 'Student' || (userData.role === 'Teacher' && userData.designation === 'Class Teacher') ? userData.class : (userData.role === 'Teacher' ? userData.class : undefined),
        designation: userData.role === 'Teacher' ? userData.designation : (userData.role === 'Admin' ? 'Administrator' : undefined),
    };

    let currentUsers = getMockUsersData(); 
    const existingUserIndex = currentUsers.findIndex(existingUser =>
        (userData.id && existingUser.id === userData.id) || 
        (userToProcess.email && existingUser.email && existingUser.email.toLowerCase() === userToProcess.email.toLowerCase() && existingUser.schoolCode === userToProcess.schoolCode) ||
        (userToProcess.phoneNumber && existingUser.phoneNumber === userToProcess.phoneNumber && existingUser.schoolCode === userToProcess.schoolCode)
    );

    let finalUser: User;
    if (existingUserIndex === -1) {
        finalUser = {...userToProcess};
        currentUsers = [...currentUsers, finalUser];
        console.log("[Service:users] Added mock user:", finalUser.name, "ID:", finalUser.id);
    } else {
        const updatedUser = { 
            ...currentUsers[existingUserIndex], 
            ...userToProcess, 
            id: currentUsers[existingUserIndex].id, 
            profilePictureUrl: userToProcess.profilePictureUrl, 
        };
        currentUsers[existingUserIndex] = updatedUser;
        finalUser = {...updatedUser};
        console.log("[Service:users] Updated existing mock user:", finalUser.name, "ID:", finalUser.id);
    }
    updateMockUsersData(currentUsers); 
    return finalUser; 
}


export async function fetchAllUsers(schoolCode?: string): Promise<User[]> {
     await ensureMockDataInitialized();
     console.log(`[Service:users] Fetching all users. School filter: "${schoolCode || 'All Schools'}"`);
     
     const allUsers = getMockUsersData();
     const users = schoolCode ? allUsers.filter(user => user.schoolCode === schoolCode) : allUsers;

     console.log(`[Service:users] Found ${users.length} users (mock).`);
     return users.map(u => ({...u})).sort((a,b) => a.name.localeCompare(b.name)); 
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    await ensureMockDataInitialized();
    console.log(`[Service:users] Updating user ${userId} with data:`, updates);
    
    let currentUsers = getMockUsersData();
    const userIndex = currentUsers.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        console.error(`[Service:users] User ${userId} not found for update (mock).`);
        return null;
    }
    
    const existingUser = currentUsers[userIndex];
    let newProfilePictureUrl = updates.profilePictureUrl;
    // Retain existing picture if updates.profilePictureUrl is undefined (meaning not changed)
    // If explicitly set to null or empty string, it means remove picture.
    if (updates.profilePictureUrl === undefined) { 
        newProfilePictureUrl = existingUser.profilePictureUrl; 
    }

    const updatedUser = { 
      ...existingUser, 
      ...updates,
      profilePictureUrl: newProfilePictureUrl
    };
    
    currentUsers[userIndex] = updatedUser;
    updateMockUsersData(currentUsers); 
    
    console.log("[Service:users] Updated user (mock):", updatedUser.name);
    return { ...updatedUser }; 
}

export async function deleteUser(userId: string): Promise<boolean> {
    await ensureMockDataInitialized();
    console.log(`[Service:users] Deleting user ${userId}`);
    
    const currentUsers = getMockUsersData();
    const initialLength = currentUsers.length;
    const updatedUsers = currentUsers.filter(u => u.id !== userId);
    
    if (updatedUsers.length < initialLength) {
        updateMockUsersData(updatedUsers);
        console.log(`[Service:users] User ${userId} deleted successfully (mock).`);
        return true;
    } else {
        console.warn(`[Service:users] User ${userId} not found for deletion (mock).`);
        return false;
    }
}

export type ExcelUserImport = {
    Name: string;
    'Email or Phone'?: string;
    Role: 'Student' | 'Teacher'; 
    'Designation (Teacher Only)'?: 'Class Teacher' | 'Subject Teacher' | string;
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
                
                const sheetNamesToTry = ["Teachers_Template", "Students_Template", "Existing_Staff", "Existing_Students", workbook.SheetNames[0]];
                let jsonData: ExcelUserImport[] = [];
                let foundSheet = false;

                for (const sheetName of sheetNamesToTry) {
                    if (sheetName && workbook.Sheets[sheetName]) {
                        jsonData.push(...XLSX.utils.sheet_to_json<ExcelUserImport>(workbook.Sheets[sheetName]));
                        foundSheet = true;
                    }
                }
                
                if (!foundSheet) {
                    errors.push("Excel file is empty or has no data in the expected sheets (Teachers_Template, Students_Template, Existing_Staff, Existing_Students or first sheet).");
                    errorCount = 1;
                    resolve({ successCount, errorCount, errors });
                    return;
                }
                if (jsonData.length === 0 && foundSheet){
                     errors.push("Found expected sheet(s), but they contained no data rows.");
                     errorCount = 1;
                     resolve({ successCount, errorCount, errors });
                     return;
                }
                
                const schoolDetails = await getSchoolDetails(schoolCode); 
                if (!schoolDetails) {
                     errors.push(`Invalid school code "${schoolCode}" provided for bulk import.`);
                     jsonData.forEach(row => errors.push(`Skipping row for "${row.Name || 'N/A'}": Invalid school code.`));
                     errorCount = jsonData.length;
                     resolve({ successCount, errorCount, errors });
                     return;
                }


                for (const row of jsonData) {
                    try {
                        if (!row.Name || !row.Role) {
                            errors.push(`Skipping row: Missing Name or Role. Row: ${JSON.stringify(row).substring(0,100)}`);
                            errorCount++;
                            continue;
                        }
                         if (row.Role !== 'Student' && row.Role !== 'Teacher') {
                            errors.push(`Skipping row for "${row.Name}": Invalid Role "${row.Role}". Only 'Student' or 'Teacher' can be bulk added/updated.`);
                            errorCount++;
                            continue;
                        }

                        const baseUser: Omit<User, 'id' | 'schoolName' | 'schoolAddress' | 'profilePictureUrl'> & {id?: string, schoolName: string, schoolAddress: string} = {
                            name: row.Name,
                            email: row['Email or Phone']?.includes('@') ? row['Email or Phone'] : undefined,
                            phoneNumber: row['Email or Phone'] && !row['Email or Phone']?.includes('@') ? row['Email or Phone'] : undefined,
                            role: row.Role, 
                            schoolCode: schoolCode,
                            schoolName: schoolDetails.schoolName,
                            schoolAddress: `${schoolDetails.address}, ${schoolDetails.city}, ${schoolDetails.state} ${schoolDetails.pincode}`,
                        };
                        
                        if (row.Role === 'Teacher') {
                            if(!row['Designation (Teacher Only)']){
                                errors.push(`Skipping Teacher "${row.Name}": Missing "Designation (Teacher Only)".`);
                                errorCount++;
                                continue;
                            }
                            const validDesignations = ['Class Teacher', 'Subject Teacher'];
                            if (!validDesignations.includes(row['Designation (Teacher Only)'])) {
                                errors.push(`Skipping Teacher "${row.Name}": Invalid "Designation (Teacher Only)" value "${row['Designation (Teacher Only)']}". Must be 'Class Teacher' or 'Subject Teacher'.`);
                                errorCount++;
                                continue;
                            }
                            baseUser.designation = row['Designation (Teacher Only)'] as 'Class Teacher' | 'Subject Teacher';
                            baseUser.class = row['Class Handling (Teacher Only)'];
                        } else if (row.Role === 'Student') {
                            if(!row['Admission Number (Student Only)'] || !row['Class (Student Only)']){
                                 errors.push(`Skipping Student "${row.Name}": Missing "Admission Number (Student Only)" or "Class (Student Only)".`);
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
