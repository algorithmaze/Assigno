
import type { User } from '@/context/auth-context';
import { sampleCredentials } from './otp';
import { getSchoolDetails } from './school';


// Function to transform sample credential entry to User, fetching school details
async function transformToUser(cred: typeof sampleCredentials.adminAntony): Promise<User> {
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
    };
}


// Initialize mockUsersData asynchronously
let mockUsersData: User[] = [];
let isMockDataInitialized = false;

async function initializeMockUsers() {
    if (isMockDataInitialized) return;

    const transformedUsers = await Promise.all(
        Object.values(sampleCredentials).map(cred => transformToUser(cred))
    );

    // Add additional dummy users not part of initial login samples
    const additionalUsersRaw = [
        {
            id: 'teacher-extra-004',
            name: 'Nina Teacher',
            email: 'nina@school.com',
            role: 'Teacher' as 'Teacher',
            schoolCode: 'samp123',
            class: 'Class 12 Arts',
            profilePictureUrl: `https://picsum.photos/100/100?random=${'teacher-extra-004'}`,
        },
        {
            id: 'student-extra-004',
            name: 'Leo Student (Extra)', // Different from teacher Leo
            email: 'leo.student@school.com',
            role: 'Student' as 'Student',
            schoolCode: 'samp123',
            admissionNumber: 'SAMP9004',
            class: 'Class 5A',
            profilePictureUrl: `https://picsum.photos/100/100?random=${'student-extra-004'}`,
        },
         {
            id: 'teacher-extra-005',
            name: 'Sam Teacher',
            email: 'sam@school.com',
            role: 'Teacher' as 'Teacher',
            schoolCode: 'samp123',
            class: 'Class 7 Social Studies',
            profilePictureUrl: `https://picsum.photos/100/100?random=${'teacher-extra-005'}`,
        },
        {
            id: 'student-extra-005',
            name: 'Grace Student',
            email: 'grace@school.com',
            role: 'Student'as 'Student',
            schoolCode: 'samp123',
            admissionNumber: 'SAMP9005',
            class: 'Class 9C',
            profilePictureUrl: `https://picsum.photos/100/100?random=${'student-extra-005'}`,
        },
    ];

    const additionalTransformedUsers = await Promise.all(
        additionalUsersRaw.map(async (rawUser) => {
            const schoolDetails = await getSchoolDetails(rawUser.schoolCode);
            return {
                ...rawUser,
                schoolName: schoolDetails?.schoolName,
                schoolAddress: schoolDetails?.address,
                phoneNumber: undefined, // Assuming not provided for these extras
                admissionNumber: rawUser.role === 'Student' ? rawUser.admissionNumber : undefined,
            } as User;
        })
    );


    const allUsers = [...transformedUsers, ...additionalTransformedUsers];

    const uniqueUsersMap = new Map<string, User>();
    allUsers.forEach(user => {
        if (!uniqueUsersMap.has(user.id)) {
            uniqueUsersMap.set(user.id, user);
        }
    });
    mockUsersData = Array.from(uniqueUsersMap.values());
    console.log("[Service:users] Initialized unique mock users:", mockUsersData.length, mockUsersData.map(u => `${u.name} (${u.role})`));
    isMockDataInitialized = true;
}

// Call initialization. In a real app, this might be triggered differently.
initializeMockUsers();


export async function fetchUsersByIds(userIds: string[]): Promise<User[]> {
    await initializeMockUsers(); // Ensure data is loaded
    console.log(`[Service:users] Simulating fetching users by IDs: ${userIds.join(', ')}`);
    await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay
    const users = mockUsersData.filter(user => userIds.includes(user.id));
    console.log(`[Service:users] Found ${users.length} users for IDs: ${userIds.join(', ')}`);
    return users.map(u => ({...u})); // Return copies
}

export async function searchUsers(schoolCode: string, searchTerm: string, excludeIds: string[] = []): Promise<User[]> {
    await initializeMockUsers();
    console.log(`[Service:users] Simulating user search. Term: "${searchTerm}", School: "${schoolCode}", Excluding: ${excludeIds.length} IDs`);
    await new Promise(resolve => setTimeout(resolve, 100));

    const lowerSearchTerm = searchTerm.trim().toLowerCase();
    const filterByTerm = lowerSearchTerm.length > 0;

    const results = mockUsersData.filter(user => {
        const matchesSchool = user.schoolCode === schoolCode;
        const isExcluded = excludeIds.includes(user.id);
        if (!matchesSchool || isExcluded) {
            return false;
        }
        if (!filterByTerm && excludeIds.length === 0) { // If no search term AND no exclusions, return all for school
             return true;
        }
         if (!filterByTerm && excludeIds.length > 0) { // If no search term but has exclusions
             return true; // Already handled by isExcluded
        }


        const matchesName = user.name.toLowerCase().includes(lowerSearchTerm);
        const matchesEmail = user.email && user.email.toLowerCase().includes(lowerSearchTerm);
        return matchesName || matchesEmail;
    });
    console.log(`[Service:users] Found ${results.length} users matching criteria. Results:`, results.map(u => u.name));
    return results.map(u => ({...u}));
}

export async function addUser(user: User): Promise<User> {
    await initializeMockUsers();
    if (!mockUsersData.some(existingUser => existingUser.id === user.id)) {
        const schoolDetails = await getSchoolDetails(user.schoolCode);
        const userToAdd: User = {
            ...user,
            schoolName: user.schoolName ?? schoolDetails?.schoolName,
            schoolAddress: user.schoolAddress ?? schoolDetails?.address,
            profilePictureUrl: user.profilePictureUrl || `https://picsum.photos/100/100?random=${user.id}`,
        };
        mockUsersData.push(userToAdd);
        console.log("[Service:users] Added mock user:", userToAdd.name);
        return {...userToAdd};
    } else {
        console.log("[Service:users] User already exists, not adding:", user.id);
        return mockUsersData.find(u => u.id === user.id)!; // Should exist
    }
}

export async function fetchAllUsers(schoolCode: string): Promise<User[]> {
     await initializeMockUsers();
     console.log(`[Service:users] Simulating fetching all users for school "${schoolCode}"`);
     await new Promise(resolve => setTimeout(resolve, 50));
     const users = mockUsersData.filter(user => user.schoolCode === schoolCode);
     console.log(`[Service:users] Found ${users.length} users in school ${schoolCode}.`);
     return users.map(u => ({...u}));
}

/**
 * Simulates updating a user's profile details.
 * @param userId The ID of the user to update.
 * @param updates Partial user data with fields to update.
 * @returns Promise resolving to the updated User object or null if not found/failed.
 */
export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    await initializeMockUsers();
    console.log(`[Service:users] Simulating update for user ${userId} with data:`, updates);
    await new Promise(resolve => setTimeout(resolve, 100));

    const userIndex = mockUsersData.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        console.error(`[Service:users] User ${userId} not found for update.`);
        return null;
    }
    
    mockUsersData[userIndex] = { ...mockUsersData[userIndex], ...updates };
    
    console.log("[Service:users] Updated user:", mockUsersData[userIndex].name);
    return { ...mockUsersData[userIndex] }; 
}

/**
 * Simulates deleting a user.
 * @param userId The ID of the user to delete.
 * @returns Promise resolving to true if successful, false otherwise.
 */
export async function deleteUser(userId: string): Promise<boolean> {
    await initializeMockUsers();
    console.log(`[Service:users] Simulating deletion for user ${userId}`);
    await new Promise(resolve => setTimeout(resolve, 100));

    const initialLength = mockUsersData.length;
    mockUsersData = mockUsersData.filter(u => u.id !== userId);

    if (mockUsersData.length < initialLength) {
        console.log(`[Service:users] User ${userId} deleted successfully.`);
        // TODO: Also remove user from all groups they were part of
        // This would involve iterating through mockGroupsData and updating teacherIds/studentIds
        // For now, this cleanup is handled in group service if a user is removed from a group directly
        return true;
    } else {
        console.error(`[Service:users] User ${userId} not found for deletion.`);
        return false;
    }
}
