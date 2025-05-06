
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
     }
];


/**
 * Simulates fetching multiple users by their IDs.
 * @param userIds Array of user IDs to fetch.
 * @returns Promise resolving to an array of User objects found.
 */
export async function fetchUsersByIds(userIds: string[]): Promise<User[]> {
    console.log(`Simulating fetching users by IDs: ${userIds.join(', ')}`);
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate short delay

    const users = mockUsersData.filter(user => userIds.includes(user.id));
    return users;
}

/**
 * Simulates searching for users within a school, excluding certain IDs.
 * Searches by name or email (case-insensitive).
 * @param schoolCode The school code to filter users by.
 * @param searchTerm The string to search for in name or email.
 * @param excludeIds An array of user IDs to exclude from the results.
 * @returns Promise resolving to an array of matching User objects.
 */
export async function searchUsers(schoolCode: string, searchTerm: string, excludeIds: string[] = []): Promise<User[]> {
    console.log(`Simulating user search for term "${searchTerm}" in school "${schoolCode}", excluding ${excludeIds.length} IDs`);
    await new Promise(resolve => setTimeout(resolve, 400)); // Simulate search delay

    if (!searchTerm.trim()) {
        return []; // Don't return all users on empty search
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const results = mockUsersData.filter(user =>
        user.schoolCode === schoolCode && // Match school
        !excludeIds.includes(user.id) && // Exclude specified IDs
        (user.name.toLowerCase().includes(lowerSearchTerm) || // Match name
         (user.email && user.email.toLowerCase().includes(lowerSearchTerm))) // Match email
    );

    console.log(`Found ${results.length} users matching search.`);
    return results;
}

// Function to add a new user (mainly for signup simulation if needed)
export function addUser(user: User): void {
    mockUsersData.push(user);
    console.log("Added mock user:", user);
}

// Function to get all users (e.g., for admin management)
export async function fetchAllUsers(schoolCode: string): Promise<User[]> {
     console.log(`Simulating fetching all users for school "${schoolCode}"`);
     await new Promise(resolve => setTimeout(resolve, 300));
     return mockUsersData.filter(user => user.schoolCode === schoolCode);
}
