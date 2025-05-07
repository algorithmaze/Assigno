
import type { User } from '@/context/auth-context';
import { getSchoolDetails } from './school';
import * as XLSX from 'xlsx';

const DEFAULT_SCHOOL_CODE = 'samp123'; // Default if none is found for a user (should be rare)


// Use a global variable for mock data in non-production environments
declare global {
  var mockUsersData_assigno_users: User[] | undefined;
  var mockUsersInitialized_assigno_users: boolean | undefined;
}

const USERS_STORAGE_KEY = 'assigno_mock_users_data_v10_no_dummies_at_all'; // Incremented version

function initializeGlobalUsersStore(): User[] {
    if (typeof window === 'undefined') {
        // Server-side: Initialize with an empty array. No default users.
        const serverInitialUsers: User[] = [];
        globalThis.mockUsersData_assigno_users = serverInitialUsers;
        globalThis.mockUsersInitialized_assigno_users = true;
        console.log("[Service:users] Server-side: Initialized global users store (empty).");
        return serverInitialUsers;
    }

    // Client-side initialization
    if (globalThis.mockUsersData_assigno_users && globalThis.mockUsersInitialized_assigno_users) {
        return globalThis.mockUsersData_assigno_users;
    }
    try {
        const storedData = localStorage.getItem(USERS_STORAGE_KEY);
        if (storedData) {
            const parsedJson = JSON.parse(storedData);
            if (Array.isArray(parsedJson)) {
                const users: User[] = parsedJson.map((u: any) => ({ // Added type annotation for 'u'
                    id: String(u.id || `temp-id-${Math.random()}`),
                    name: String(u.name || 'Unknown User'),
                    email: typeof u.email === 'string' ? u.email : undefined,
                    phoneNumber: typeof u.phoneNumber === 'string' ? u.phoneNumber : undefined,
                    role: ['Student', 'Teacher', 'Admin'].includes(u.role) ? u.role : 'Student',
                    schoolCode: String(u.schoolCode || DEFAULT_SCHOOL_CODE),
                    schoolName: typeof u.schoolName === 'string' ? u.schoolName : "Default School Name",
                    schoolAddress: typeof u.schoolAddress === 'string' ? u.schoolAddress : "Default School Address",
                    profilePictureUrl: typeof u.profilePictureUrl === 'string' ? u.profilePictureUrl : undefined,
                    admissionNumber: typeof u.admissionNumber === 'string' ? u.admissionNumber : undefined,
                    class: typeof u.class === 'string' ? u.class : undefined,
                    designation: typeof u.designation === 'string' ? u.designation : undefined,
                }));
                globalThis.mockUsersData_assigno_users = users;
                globalThis.mockUsersInitialized_assigno_users = true;
                console.log("[Service:users] Client-side: Initialized global users store from localStorage.", users.length, "users loaded.");
                return users;
            } else {
                 console.warn("[Service:users] Client-side: localStorage data is not an array. Re-initializing.");
            }
        }
    } catch (error) {
        console.error("[Service:users] Client-side: Error reading/parsing users from localStorage. Re-initializing:", error);
        localStorage.removeItem(USERS_STORAGE_KEY);
    }

    // If no valid stored data on client, initialize with empty array
    const clientInitialUsers: User[] = [];
    globalThis.mockUsersData_assigno_users = clientInitialUsers;
    globalThis.mockUsersInitialized_assigno_users = true;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(clientInitialUsers));
    console.log("[Service:users] Client-side: Initialized new empty global users store and saved to localStorage.");
    return clientInitialUsers;
}


function getMockUsersData(): User[] {
  if (typeof window === 'undefined') {
    if (!globalThis.mockUsersInitialized_assigno_users) {
        initializeGlobalUsersStore(); 
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
  globalThis.mockUsersData_assigno_users = newData;
  globalThis.mockUsersInitialized_assigno_users = true;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newData));
      console.log("[Service:users] Saved", newData.length, "users to localStorage.");
    } catch (error) {
      console.error("[Service:users] Error writing users to localStorage:", error);
    }
  }
}

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    initializeGlobalUsersStore();
}


export async function ensureMockDataInitialized() {
    if (!globalThis.mockUsersInitialized_assigno_users) {
        initializeGlobalUsersStore();
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
             return true; // Return all users for the school if search term is empty (excluding those in excludeIds)
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
        console.warn("[Service:users] User data missing schoolCode, cannot reliably fetch school details.");
        schoolName = schoolName || 'Unknown School (No Code Provided)';
        schoolAddress = schoolAddress || 'N/A (No Code Provided)';
    }


    const newUserId = userData.id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const userToProcess: User = {
        id: newUserId,
        name: userData.name,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        role: userData.role,
        schoolCode: userData.schoolCode,
        schoolName: schoolName,
        schoolAddress: schoolAddress,
        profilePictureUrl: userData.profilePictureUrl || undefined,
        admissionNumber: userData.role === 'Student' ? userData.admissionNumber : undefined,
        class: userData.role === 'Student' || (userData.role === 'Teacher' && userData.designation === 'Class Teacher') ? userData.class : (userData.role === 'Teacher' ? userData.class : undefined),
        designation: userData.role === 'Teacher' ? userData.designation : (userData.role === 'Admin' ? 'Administrator' : undefined),
    };

    const currentUsers = getMockUsersData();
    const existingUserIndex = currentUsers.findIndex(existingUser =>
        existingUser.id === userToProcess.id ||
        (userToProcess.email && existingUser.email && existingUser.email.toLowerCase() === userToProcess.email.toLowerCase() && existingUser.schoolCode === userToProcess.schoolCode) ||
        (userToProcess.phoneNumber && existingUser.phoneNumber === userToProcess.phoneNumber && existingUser.schoolCode === userToProcess.schoolCode)
    );

    if (existingUserIndex === -1) {
        const updatedUsers = [...currentUsers, userToProcess];
        updateMockUsersData(updatedUsers);
        console.log("[Service:users] Added mock user:", userToProcess.name, "ID:", userToProcess.id);
        return {...userToProcess};
    } else {
        // Preserve existing profilePictureUrl if not provided in updates
        const updatedUser = { 
            ...currentUsers[existingUserIndex], 
            ...userToProcess,
            profilePictureUrl: userToProcess.profilePictureUrl === undefined ? currentUsers[existingUserIndex].profilePictureUrl : userToProcess.profilePictureUrl
        };
        currentUsers[existingUserIndex] = updatedUser;
        updateMockUsersData([...currentUsers]);
        console.log("[Service:users] Updated existing mock user:", userToProcess.name, "ID:", userToProcess.id);
        return {...updatedUser};
    }
}


export async function fetchAllUsers(schoolCode?: string): Promise<User[]> {
     await ensureMockDataInitialized();
     console.log(`[Service:users] Fetching all users. School filter: "${schoolCode || 'All Schools'}"`);
     
     await new Promise(resolve => setTimeout(resolve, 10));
     const allUsers = getMockUsersData();
     const users = schoolCode ? allUsers.filter(user => user.schoolCode === schoolCode) : allUsers;

     console.log(`[Service:users] Found ${users.length} users (mock).`);
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
    
    // Ensure profilePictureUrl is not accidentally cleared if not in updates
    const existingUser = currentUsers[userIndex];
    const updatedUser = { 
      ...existingUser, 
      ...updates,
      profilePictureUrl: updates.profilePictureUrl === undefined ? existingUser.profilePictureUrl : updates.profilePictureUrl
    };
    
    currentUsers[userIndex] = updatedUser;
    updateMockUsersData([...currentUsers]);
    
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

export type ExcelUserImport = {
    Name: string;
    'Email or Phone'?: string;
    Role: 'Student' | 'Teacher'; // Admin role cannot be bulk added via Excel
    'Designation (Teacher Only)'?: 'Class Teacher' | 'Subject Teacher' | string; // Allow string for flexibility
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
                        const worksheet = workbook.Sheets[sheetName];
                        jsonData.push(...XLSX.utils.sheet_to_json<ExcelUserImport>(worksheet));
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

                        const baseUser: Omit<User, 'id' | 'schoolName' | 'schoolAddress' | 'profilePictureUrl'> & {id?: string} = {
                            name: row.Name,
                            email: row['Email or Phone']?.includes('@') ? row['Email or Phone'] : undefined,
                            phoneNumber: row['Email or Phone'] && !row['Email or Phone']?.includes('@') ? row['Email or Phone'] : undefined,
                            role: row.Role, // Safe cast because we validated above
                            schoolCode: schoolCode,
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