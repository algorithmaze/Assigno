
import type { User } from '@/context/auth-context';
import { getSchoolDetails } from './school';
import * as XLSX from 'xlsx';

// Use a global variable for mock data in non-production environments
declare global {
  var mockUsersData_assigno_users: User[] | undefined;
  var mockUsersInitialized_assigno_users: boolean | undefined;
}

const USERS_STORAGE_KEY = 'assigno_mock_users_data_v12_st_antony_school_users'; // Incremented version

function initializeGlobalUsersStore(): User[] {
    const stAntonySchoolDetails = {
        schoolCode: "STA987",
        schoolName: "ST.ANTONY SR. SEC SCHOOL",
        schoolAddress: "456 Church Road, Vatican City, Metropolis, NY 10001", // Consistent address
    };

    const stAntonyAdmin: User = {
        id: 'admin-sta987-001',
        name: 'Antony (Admin St. Antony)',
        email: 'admin@stantony.school',
        role: 'Admin',
        schoolCode: stAntonySchoolDetails.schoolCode,
        schoolName: stAntonySchoolDetails.schoolName,
        schoolAddress: stAntonySchoolDetails.schoolAddress,
        designation: 'Administrator',
        profilePictureUrl: 'https://picsum.photos/100/100?random=adminsta987',
    };

    // Dummy users now also belong to St. Antony
    const dummyAdmin: User = {
        id: 'admin-dummysc-001', // ID can remain for uniqueness, but user data points to St. Antony
        name: 'Dummy Admin (St. Antony)', // Clarify name
        email: 'dummy.admin@assigno.app', // Login identifier remains
        role: 'Admin',
        schoolCode: stAntonySchoolDetails.schoolCode,
        schoolName: stAntonySchoolDetails.schoolName,
        schoolAddress: stAntonySchoolDetails.schoolAddress,
        designation: 'Administrator',
        profilePictureUrl: 'https://picsum.photos/100/100?random=admindummy',
    };

    const dummyTeacher: User = {
        id: 'teacher-dummysc-001',
        name: 'Dummy Teacher (St. Antony)',
        email: 'dummy.teacher@assigno.app',
        role: 'Teacher',
        schoolCode: stAntonySchoolDetails.schoolCode,
        schoolName: stAntonySchoolDetails.schoolName,
        schoolAddress: stAntonySchoolDetails.schoolAddress,
        designation: 'Subject Teacher',
        class: 'Various Classes', 
        profilePictureUrl: 'https://picsum.photos/100/100?random=teacherdummy',
    };
    
    const dummyStudent: User = {
        id: 'student-dummysc-001',
        name: 'Dummy Student (St. Antony)',
        email: 'dummy.student@assigno.app',
        role: 'Student',
        schoolCode: stAntonySchoolDetails.schoolCode,
        schoolName: stAntonySchoolDetails.schoolName,
        schoolAddress: stAntonySchoolDetails.schoolAddress,
        admissionNumber: 'STA001', // Admission number relevant to St. Antony
        class: 'Grade X (St. Antony)',
        profilePictureUrl: 'https://picsum.photos/100/100?random=studentdummy',
    };

    const defaultInitialUsers = [stAntonyAdmin, dummyAdmin, dummyTeacher, dummyStudent];


    if (typeof window === 'undefined') {
        // Server-side: Initialize with default users.
        const serverInitialUsers: User[] = [...defaultInitialUsers];
        globalThis.mockUsersData_assigno_users = serverInitialUsers;
        globalThis.mockUsersInitialized_assigno_users = true;
        console.log("[Service:users] Server-side: Initialized global users store with defaults.", serverInitialUsers.length, "users.");
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
                let users: User[] = parsedJson.map((u: any) => ({ 
                    id: String(u.id || `temp-id-${Math.random()}`),
                    name: String(u.name || 'Unknown User'),
                    email: typeof u.email === 'string' ? u.email : undefined,
                    phoneNumber: typeof u.phoneNumber === 'string' ? u.phoneNumber : undefined,
                    role: ['Student', 'Teacher', 'Admin'].includes(u.role) ? u.role : 'Student',
                    schoolCode: String(u.schoolCode || stAntonySchoolDetails.schoolCode), // Default to St Antony's
                    schoolName: typeof u.schoolName === 'string' ? u.schoolName : stAntonySchoolDetails.schoolName,
                    schoolAddress: typeof u.schoolAddress === 'string' ? u.schoolAddress : stAntonySchoolDetails.schoolAddress,
                    profilePictureUrl: typeof u.profilePictureUrl === 'string' ? u.profilePictureUrl : undefined,
                    admissionNumber: typeof u.admissionNumber === 'string' ? u.admissionNumber : undefined,
                    class: typeof u.class === 'string' ? u.class : undefined,
                    designation: typeof u.designation === 'string' ? u.designation : undefined,
                }));

                // Ensure default users are present if not already in stored data
                const currentUserIds = new Set(users.map(u => u.id));
                defaultInitialUsers.forEach(defaultUser => {
                    if (!currentUserIds.has(defaultUser.id)) {
                        users.push(defaultUser);
                    } else { // If user exists, update its school details if they are not St. Antony's
                        const index = users.findIndex(u => u.id === defaultUser.id);
                        if (index !== -1 && users[index].schoolCode !== stAntonySchoolDetails.schoolCode) {
                            users[index] = {
                                ...users[index],
                                schoolCode: stAntonySchoolDetails.schoolCode,
                                schoolName: stAntonySchoolDetails.schoolName,
                                schoolAddress: stAntonySchoolDetails.schoolAddress,
                            };
                        }
                    }
                });

                globalThis.mockUsersData_assigno_users = users;
                globalThis.mockUsersInitialized_assigno_users = true;
                console.log("[Service:users] Client-side: Initialized global users store from localStorage.", users.length, "users loaded.");
                localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users)); // Save back if modified
                return users;
            } else {
                 console.warn("[Service:users] Client-side: localStorage data is not an array. Re-initializing with defaults.");
            }
        }
    } catch (error) {
        console.error("[Service:users] Client-side: Error reading/parsing users from localStorage. Re-initializing with defaults:", error);
        localStorage.removeItem(USERS_STORAGE_KEY);
    }

    const clientInitialUsers: User[] = [...defaultInitialUsers];
    globalThis.mockUsersData_assigno_users = clientInitialUsers;
    globalThis.mockUsersInitialized_assigno_users = true;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(clientInitialUsers));
    console.log("[Service:users] Client-side: Initialized new global users store with defaults and saved to localStorage.");
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
    if (typeof window !== 'undefined' && !globalThis.mockUsersInitialized_assigno_users) {
        initializeGlobalUsersStore();
    } else if (typeof window === 'undefined' && !globalThis.mockUsersInitialized_assigno_users) {
        // For server-side scenarios where it might be called before window is available
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
        const stAntonySchool = await getSchoolDetails("STA987"); // Fallback to St. Antony
        schoolName = schoolName || stAntonySchool?.schoolName || 'ST.ANTONY SR. SEC SCHOOL';
        schoolAddress = schoolAddress || stAntonySchool?.address || '456 Church Road, Vatican City, Metropolis, NY 10001';
        userData.schoolCode = "STA987"; // Assign fallback school code
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
        profilePictureUrl: userData.profilePictureUrl || `https://picsum.photos/seed/${newUserId}/100/100`, // Default random avatar if none
        admissionNumber: userData.role === 'Student' ? userData.admissionNumber : undefined,
        class: userData.role === 'Student' || (userData.role === 'Teacher' && userData.designation === 'Class Teacher') ? userData.class : (userData.role === 'Teacher' ? userData.class : undefined),
        designation: userData.role === 'Teacher' ? userData.designation : (userData.role === 'Admin' ? 'Administrator' : undefined),
    };

    const currentUsers = getMockUsersData();
    const existingUserIndex = currentUsers.findIndex(existingUser =>
        (userData.id && existingUser.id === userData.id) || 
        (userToProcess.email && existingUser.email && existingUser.email.toLowerCase() === userToProcess.email.toLowerCase() && existingUser.schoolCode === userToProcess.schoolCode) ||
        (userToProcess.phoneNumber && existingUser.phoneNumber === userToProcess.phoneNumber && existingUser.schoolCode === userToProcess.schoolCode)
    );


    if (existingUserIndex === -1) {
        const updatedUsers = [...currentUsers, userToProcess];
        updateMockUsersData(updatedUsers);
        console.log("[Service:users] Added mock user:", userToProcess.name, "ID:", userToProcess.id);
        return {...userToProcess};
    } else {
        const updatedUser = { 
            ...currentUsers[existingUserIndex], 
            ...userToProcess,
            id: currentUsers[existingUserIndex].id, 
            profilePictureUrl: userToProcess.profilePictureUrl === undefined ? currentUsers[existingUserIndex].profilePictureUrl : (userToProcess.profilePictureUrl || `https://picsum.photos/seed/${currentUsers[existingUserIndex].id}/100/100`)
        };
        currentUsers[existingUserIndex] = updatedUser;
        updateMockUsersData([...currentUsers]);
        console.log("[Service:users] Updated existing mock user:", updatedUser.name, "ID:", updatedUser.id);
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
    
    const existingUser = currentUsers[userIndex];
    const updatedUser = { 
      ...existingUser, 
      ...updates,
      profilePictureUrl: updates.profilePictureUrl === undefined ? existingUser.profilePictureUrl : (updates.profilePictureUrl || `https://picsum.photos/seed/${userId}/100/100`)
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

                        const baseUser: Omit<User, 'id' | 'schoolName' | 'schoolAddress' | 'profilePictureUrl'> & {id?: string} = {
                            name: row.Name,
                            email: row['Email or Phone']?.includes('@') ? row['Email or Phone'] : undefined,
                            phoneNumber: row['Email or Phone'] && !row['Email or Phone']?.includes('@') ? row['Email or Phone'] : undefined,
                            role: row.Role, 
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
