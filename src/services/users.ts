
// TODO: Replace with actual user data type from your backend/database
import type { User } from '@/context/auth-context';
import { sampleCredentials } from './otp'; // Import sample credentials

// Mock user data (extending sample users from otp.ts)
// In a real app, this would be fetched from a database/API
let mockUsersData: User[] = [
    // Base sample users from sampleCredentials
    { ...sampleCredentials.admin } as User,
    { ...sampleCredentials.teacher } as User,
    { ...sampleCredentials.student } as User,

    // Add more mock users for searching/adding with school details
    {
        id: 'teacher-002',
        name: 'Alice Smith', // Match teachers page
        email: 'alice@school.com',
        role: 'Teacher',
        schoolCode: 'XYZ123',
        schoolName: 'Example High School',
        schoolAddress: '123 Main St, Anytown',
        profilePictureUrl: 'https://picsum.photos/100/100?random=1',
    },
     {
        id: 'teacher-003',
        name: 'Charlie Brown', // Match teachers page
        email: 'charlie@school.com',
        role: 'Teacher',
        schoolCode: 'XYZ123',
        schoolName: 'Example High School',
        schoolAddress: '123 Main St, Anytown',
        profilePictureUrl: 'https://picsum.photos/100/100?random=3',
    },
    {
        id: 'student-002',
        name: 'Bob Williams',
        email: 'bob@school.com',
        role: 'Student',
        schoolCode: 'XYZ123',
        schoolName: 'Example High School',
        schoolAddress: '123 Main St, Anytown',
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
        schoolName: 'Example High School',
        schoolAddress: '123 Main St, Anytown',
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
        schoolName: 'Example High School',
        schoolAddress: '123 Main St, Anytown',
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
        schoolName: 'Example High School',
        schoolAddress: '123 Main St, Anytown',
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
        schoolName: 'Example High School',
        schoolAddress: '123 Main St, Anytown',
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
 * If searchTerm is empty, returns all eligible users.
 * Otherwise, searches by name or email (case-insensitive). Requires minimum 2 chars for filtering.
 * @param schoolCode The school code to filter users by.
 * @param searchTerm The string to search for in name or email (min 2 chars for filtering).
 * @param excludeIds An array of user IDs to exclude from the results.
 * @returns Promise resolving to an array of matching User objects.
 */
export async function searchUsers(schoolCode: string, searchTerm: string, excludeIds: string[] = []): Promise<User[]> {
    console.log(`[Service:users] Simulating user search. Term: "${searchTerm}", School: "${schoolCode}", Excluding: ${excludeIds.length} IDs`);
    await new Promise(resolve => setTimeout(resolve, 400)); // Simulate search delay

    const lowerSearchTerm = searchTerm.trim().toLowerCase();
    const filterByTerm = lowerSearchTerm.length > 0; // Filter if term is not empty
    // const filterByTerm = lowerSearchTerm.length >= 2; // Original: Filter only if term >= 2 chars

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
        // Ensure school details are present, add defaults if missing
        const userToAdd = {
            ...user,
            schoolName: user.schoolName ?? 'Unknown School',
            schoolAddress: user.schoolAddress ?? 'N/A',
        };
        mockUsersData.push(userToAdd);
        console.log("[Service:users] Added mock user:", userToAdd);
    } else {
        console.log("[Service:users] User already exists, not adding:", user.id);
        // Optionally update existing user?
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

// Ensure mockUsersData is unique by ID after initial population
const uniqueUsersMap = new Map<string, User>();
mockUsersData.forEach(user => {
    if (!uniqueUsersMap.has(user.id)) {
        // Ensure school details for existing users too
        uniqueUsersMap.set(user.id, {
            ...user,
            schoolName: user.schoolName ?? 'Example High School', // Add default if missing
            schoolAddress: user.schoolAddress ?? '123 Main St, Anytown', // Add default if missing
        });
    }
});
mockUsersData = Array.from(uniqueUsersMap.values());
console.log("[Service:users] Initialized unique mock users:", mockUsersData.length);

