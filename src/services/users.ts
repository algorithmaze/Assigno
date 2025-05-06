
// TODO: Replace with actual user data type from your backend/database
import type { User } from '@/context/auth-context';

// Mock user data (extending sample users from otp.ts)
// In a real app, this would be fetched from a database/API
let mockUsersData: User[] = [
    // From sampleCredentials in otp.ts
    {
        id: 'admin-001',
        name: 'Admin User',
        email: 'admin@school.com',
        role: 'Admin',
        schoolCode: 'XYZ123',
        profilePictureUrl: 'https://picsum.photos/100/100?random=admin',
    },
    {
        id: 'teacher-001',
        name: 'Teacher User',
        email: 'teacher@school.com',
        role: 'Teacher',
        schoolCode: 'XYZ123',
        class: 'Class 10A',
        profilePictureUrl: 'https://picsum.photos/100/100?random=teacher',
    },
    {
        id: 'student-001',
        name: 'Student User',
        email: 'student@school.com',
        role: 'Student',
        schoolCode: 'XYZ123',
        admissionNumber: 'S12345',
        class: 'Class 10A',
        profilePictureUrl: 'https://picsum.photos/100/100?random=student',
    },
    // Add more mock users for searching/adding
    {
        id: 'teacher-002',
        name: 'Alice Smith', // Match teachers page
        email: 'alice@school.com',
        role: 'Teacher',
        schoolCode: 'XYZ123',
        profilePictureUrl: 'https://picsum.photos/100/100?random=1',
    },
     {
        id: 'teacher-003',
        name: 'Charlie Brown', // Match teachers page
        email: 'charlie@school.com',
        role: 'Teacher',
        schoolCode: 'XYZ123',
        profilePictureUrl: 'https://picsum.photos/100/100?random=3',
    },
    {
        id: 'student-002',
        name: 'Bob Williams',
        email: 'bob@school.com',
        role: 'Student',
        schoolCode: 'XYZ123',
        admissionNumber: 'S12346',
        class: 'Class 10B',
        profilePictureUrl: 'https://picsum.photos/100/100?random=student2',
    },
     {
        id: 'student-003',
        name: 'Diana Prince',
        email: 'diana@school.com',
        role: 'Student',
        schoolCode: 'XYZ123',
        admissionNumber: 'S12347',
        class: 'Class 9A',
        profilePictureUrl: 'https://picsum.photos/100/100?random=student3',
     },
      {
        id: 'student-004',
        name: 'Eve Adams',
        email: 'eve@school.com',
        role: 'Student',
        schoolCode: 'XYZ123',
        admissionNumber: 'S12348',
        class: 'Class 10A',
        profilePictureUrl: 'https://picsum.photos/100/100?random=student4',
     },
      {
        id: 'student-005',
        name: 'Frank Miller',
        email: 'frank@school.com',
        role: 'Student',
        schoolCode: 'XYZ123',
        admissionNumber: 'S12349',
        class: 'Class 11C',
        profilePictureUrl: 'https://picsum.photos/100/100?random=student5',
     },
     // Add another admin for testing
      {
        id: 'admin-002',
        name: 'Super Admin',
        email: 'super@school.com',
        role: 'Admin',
        schoolCode: 'XYZ123',
        profilePictureUrl: 'https://picsum.photos/100/100?random=superadmin',
      },
];


/**
 * Simulates fetching multiple users by their IDs.
 * @param userIds Array of user IDs to fetch.
 * @returns Promise resolving to an array of User objects found.
 */
export async function fetchUsersByIds(userIds: string[]): Promise<User[]> {
    console.log(`[Service:users] Simulating fetching users by IDs: ${userIds.join(', ')}`);
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate short delay

    const users = mockUsersData.filter(user => userIds.includes(user.id));
    console.log(`[Service:users] Found ${users.length} users for IDs: ${userIds.join(', ')}`);
    return users;
}

/**
 * Simulates searching for users within a school, excluding certain IDs.
 * If searchTerm is less than 2 chars, returns all eligible users.
 * Otherwise, searches by name or email (case-insensitive).
 * @param schoolCode The school code to filter users by.
 * @param searchTerm The string to search for in name or email (min 2 chars for filtering).
 * @param excludeIds An array of user IDs to exclude from the results.
 * @returns Promise resolving to an array of matching User objects.
 */
export async function searchUsers(schoolCode: string, searchTerm: string, excludeIds: string[] = []): Promise<User[]> {
    console.log(`[Service:users] Simulating user search. Term: "${searchTerm}", School: "${schoolCode}", Excluding: ${excludeIds.length} IDs`);
    await new Promise(resolve => setTimeout(resolve, 400)); // Simulate search delay

    const lowerSearchTerm = searchTerm.trim().toLowerCase();
    const filterByTerm = lowerSearchTerm.length >= 2;

    const results = mockUsersData.filter(user => {
        const matchesSchool = user.schoolCode === schoolCode;
        const isExcluded = excludeIds.includes(user.id);
        if (!matchesSchool || isExcluded) {
            return false;
        }

        // If not filtering by term, include the user
        if (!filterByTerm) {
            return true;
        }

        // If filtering, check name and email
        const matchesName = user.name.toLowerCase().includes(lowerSearchTerm);
        const matchesEmail = user.email && user.email.toLowerCase().includes(lowerSearchTerm);
        return matchesName || matchesEmail;
    });

    console.log(`[Service:users] Found ${results.length} users matching criteria (filterByTerm: ${filterByTerm}).`);
    return results;
}

// Function to add a new user (mainly for signup simulation if needed)
export function addUser(user: User): void {
    // Avoid adding duplicates if user already exists by ID
    if (!mockUsersData.some(existingUser => existingUser.id === user.id)) {
        mockUsersData.push(user);
        console.log("[Service:users] Added mock user:", user);
    } else {
        console.log("[Service:users] User already exists, not adding:", user.id);
    }
}

// Function to get all users (e.g., for admin management)
export async function fetchAllUsers(schoolCode: string): Promise<User[]> {
     console.log(`[Service:users] Simulating fetching all users for school "${schoolCode}"`);
     await new Promise(resolve => setTimeout(resolve, 300));
     const users = mockUsersData.filter(user => user.schoolCode === schoolCode);
     console.log(`[Service:users] Found ${users.length} users in school ${schoolCode}.`);
     return users;
}

// Ensure all sample users are in the mock data on module load
import { sampleCredentials } from './otp';

addUser(sampleCredentials.admin as User);
addUser(sampleCredentials.teacher as User);
addUser(sampleCredentials.student as User);
// The others are already added manually above
