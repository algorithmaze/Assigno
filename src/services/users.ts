import type { User } from '@/context/auth-context';
import { sampleCredentials } from './otp';

// Initialize mockUsersData with the new sample users
let mockUsersData: User[] = [
    { ...(sampleCredentials.adminAntony as User) },
    { ...(sampleCredentials.teacherZara as User) },
    { ...(sampleCredentials.teacherLeo as User) },
    { ...(sampleCredentials.studentMia as User) },
    { ...(sampleCredentials.studentOmar as User) },
    // Add any other specific users needed for testing that are not part of initial login samples
    {
        id: 'teacher-extra-003',
        name: 'Eva Teacher',
        email: 'eva@school.com',
        role: 'Teacher',
        schoolCode: 'samp123',
        schoolName: 'Sample Sr. Sec. School',
        schoolAddress: '456 School Road, Testville',
        class: 'Class 11 Science',
        profilePictureUrl: 'https://picsum.photos/100/100?random=eva',
    },
    {
        id: 'student-extra-003',
        name: 'Ken Student',
        email: 'ken@school.com',
        role: 'Student',
        schoolCode: 'samp123',
        schoolName: 'Sample Sr. Sec. School',
        schoolAddress: '456 School Road, Testville',
        admissionNumber: 'SAMP9003',
        class: 'Class 6B',
        profilePictureUrl: 'https://picsum.photos/100/100?random=ken',
    },
];

// Ensure mockUsersData is unique by ID after initial population
const uniqueUsersMap = new Map<string, User>();
mockUsersData.forEach(user => {
    if (!uniqueUsersMap.has(user.id)) {
        uniqueUsersMap.set(user.id, {
            ...user, // Spread existing user properties
            // Ensure all required fields from User interface are present with defaults if necessary
            schoolName: user.schoolName ?? 'Sample Sr. Sec. School',
            schoolAddress: user.schoolAddress ?? '456 School Road, Testville',
            // profilePictureUrl: user.profilePictureUrl, // Already in sampleCredentials or above
            // admissionNumber: user.admissionNumber, // Specific to students
            // class: user.class, // Specific to students/teachers
        });
    }
});
mockUsersData = Array.from(uniqueUsersMap.values());
console.log("[Service:users] Initialized unique mock users:", mockUsersData.length, mockUsersData.map(u => u.name));


export async function fetchUsersByIds(userIds: string[]): Promise<User[]> {
    console.log(`[Service:users] Simulating fetching users by IDs: ${userIds.join(', ')}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    const users = mockUsersData.filter(user => userIds.includes(user.id));
    console.log(`[Service:users] Found ${users.length} users for IDs: ${userIds.join(', ')}`);
    return users;
}

export async function searchUsers(schoolCode: string, searchTerm: string, excludeIds: string[] = []): Promise<User[]> {
    console.log(`[Service:users] Simulating user search. Term: "${searchTerm}", School: "${schoolCode}", Excluding: ${excludeIds.length} IDs`);
    await new Promise(resolve => setTimeout(resolve, 200));

    const lowerSearchTerm = searchTerm.trim().toLowerCase();
    const filterByTerm = lowerSearchTerm.length > 0;

    const results = mockUsersData.filter(user => {
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
    console.log(`[Service:users] Found ${results.length} users matching criteria (filterByTerm: ${filterByTerm}). Results:`, results.map(u => u.name));
    return results;
}

export function addUser(user: User): void {
    if (!mockUsersData.some(existingUser => existingUser.id === user.id)) {
        const userToAdd: User = {
            ...user,
            schoolName: user.schoolName ?? 'Sample Sr. Sec. School',
            schoolAddress: user.schoolAddress ?? '456 School Road, Testville',
        };
        mockUsersData.push(userToAdd);
        console.log("[Service:users] Added mock user:", userToAdd);
    } else {
        console.log("[Service:users] User already exists, not adding:", user.id);
    }
}

export async function fetchAllUsers(schoolCode: string): Promise<User[]> {
     console.log(`[Service:users] Simulating fetching all users for school "${schoolCode}"`);
     await new Promise(resolve => setTimeout(resolve, 150));
     const users = mockUsersData.filter(user => user.schoolCode === schoolCode);
     console.log(`[Service:users] Found ${users.length} users in school ${schoolCode}.`);
     return users;
}

/**
 * Simulates updating a user's profile details.
 * @param userId The ID of the user to update.
 * @param updates Partial user data with fields to update.
 * @returns Promise resolving to the updated User object or null if not found/failed.
 */
export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    console.log(`[Service:users] Simulating update for user ${userId} with data:`, updates);
    await new Promise(resolve => setTimeout(resolve, 200));

    const userIndex = mockUsersData.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        console.error(`[Service:users] User ${userId} not found for update.`);
        return null;
    }

    // Create a new array and update the specific user
    const updatedUsers = [...mockUsersData];
    updatedUsers[userIndex] = { ...updatedUsers[userIndex], ...updates };
    
    // Persist the change to the main mock data store
    mockUsersData = updatedUsers;

    console.log("[Service:users] Updated user:", updatedUsers[userIndex]);
    return { ...updatedUsers[userIndex] }; // Return a copy
}

/**
 * Simulates deleting a user.
 * @param userId The ID of the user to delete.
 * @returns Promise resolving to true if successful, false otherwise.
 */
export async function deleteUser(userId: string): Promise<boolean> {
    console.log(`[Service:users] Simulating deletion for user ${userId}`);
    await new Promise(resolve => setTimeout(resolve, 200));

    const initialLength = mockUsersData.length;
    mockUsersData = mockUsersData.filter(u => u.id !== userId);

    if (mockUsersData.length < initialLength) {
        console.log(`[Service:users] User ${userId} deleted successfully.`);
        // TODO: Also remove user from all groups they were part of
        // This would involve iterating through mockGroupsData and updating teacherIds/studentIds
        return true;
    } else {
        console.error(`[Service:users] User ${userId} not found for deletion.`);
        return false;
    }
}
