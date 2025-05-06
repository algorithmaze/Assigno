
// TODO: Replace with actual data types from your backend/database
import type { User } from '@/context/auth-context'; // Import User type

/**
 * Represents the structure of a group.
 */
export interface Group {
  id: string;
  name: string;
  description?: string;
  subject?: string;
  teacherIds: string[]; // IDs of teachers managing the group
  studentIds: string[]; // IDs of students in the group
  schoolCode: string; // Associated school
  createdAt: Date;
  // Add other relevant fields like group code for joining, etc.
}

/**
 * Input data required to create a new group.
 */
export interface CreateGroupInput {
  name: string;
  description?: string;
  subject?: string;
  // teacherIds: string[]; // Assuming at least one teacher is required by backend
  // studentIds?: string[]; // Students might be optional initially
  // schoolCode: string; // This should likely come from the logged-in user's context
}

// In-memory store for mock groups (simulates a database)
// Use let to allow modification
let mockGroupsData: Group[] = [
     {
        id: 'group1-id',
        name: 'Class 10 Maths',
        description: 'Group for 10th grade mathematics discussions and assignments.',
        subject: 'Mathematics',
        teacherIds: ['teacher-001', 'admin-001'], // Added admin
        studentIds: ['student-001', 'student-002'],
        schoolCode: 'XYZ123',
        createdAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
    },
    {
        id: 'group2-id',
        name: 'Subject Physics',
        description: 'Group for advanced physics topics.',
        subject: 'Physics',
        teacherIds: ['teacher-001', 'teacher-003'],
        studentIds: ['student-001', 'student-004', 'student-005'],
        schoolCode: 'XYZ123',
        createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
    },
    {
        id: 'group3-id',
        name: 'Admin Announcements',
        description: 'Internal group for school administrators.',
        teacherIds: ['admin-001'], // Only admin
        studentIds: [],
        schoolCode: 'XYZ123',
        createdAt: new Date(Date.now() - 86400000 * 10), // 10 days ago
    },
];


/**
 * Simulates creating a new group and adding it to the in-memory store.
 * In a real application, this would call a backend API.
 *
 * @param groupData The data for the new group.
 * @returns A promise that resolves to the newly created Group object (simulated).
 */
export async function createGroup(groupData: CreateGroupInput, creatorId: string, creatorRole: 'Admin' | 'Teacher', schoolCode: string): Promise<Group> {
    console.log("Simulating group creation with data:", groupData, "by user:", creatorId);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate successful creation and return a mock group object
    // In a real app, the backend would return the full group object with ID, createdAt etc.
    const newGroup: Group = {
        id: `group-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // Generate a mock ID
        name: groupData.name,
        description: groupData.description,
        subject: groupData.subject,
        // Add the creator as the initial teacher/admin
        teacherIds: creatorRole === 'Teacher' || creatorRole === 'Admin' ? [creatorId] : [],
        studentIds: [], // Default to empty array
        schoolCode: schoolCode, // Use provided school code
        createdAt: new Date(), // Backend would set this
    };

    // Add the new group to our mock data store
    mockGroupsData.push(newGroup);

    console.log("Simulated new group:", newGroup);
    console.log("Updated mockGroupsData:", mockGroupsData);
    return newGroup;
}

/**
 * Simulates fetching groups for the current user from the in-memory store.
 * In a real application, this would call a backend API based on user ID and role.
 *
 * @param userId The ID of the current user.
 * @param userRole The role of the current user.
 * @returns A promise that resolves to an array of Group objects.
 */
export async function fetchUserGroups(userId: string, userRole: 'Admin' | 'Teacher' | 'Student'): Promise<Group[]> {
    console.log(`Simulating fetching groups for user ${userId} (${userRole}) from mock data store`);
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay

    // Use the current state of mockGroupsData
    const currentGroups = [...mockGroupsData]; // Create a copy to avoid mutation issues if needed elsewhere
    console.log("Fetching from groups:", currentGroups);

    // Filter groups based on role (simple simulation)
    if (userRole === 'Student') {
        return currentGroups.filter(group => group.studentIds.includes(userId));
    } else if (userRole === 'Teacher') {
         // Teachers see groups they are assigned to
        return currentGroups.filter(group => group.teacherIds.includes(userId));
    } else { // Admin sees all groups in their school (in this simulation)
        // Assuming admin user has a schoolCode, filter by that if necessary
        // For now, returning all groups in the same school as the admin
        const adminUser = await import('@/services/users').then(m => m.fetchUsersByIds([userId])).then(users => users[0]);
        if (adminUser) {
            return currentGroups.filter(group => group.schoolCode === adminUser.schoolCode);
        }
        return []; // Return empty if admin user not found (shouldn't happen in normal flow)
    }
}

/**
 * Simulates fetching details for a single group from the in-memory store.
 *
 * @param groupId The ID of the group to fetch.
 * @returns A promise that resolves to the Group object or null if not found.
 */
export async function fetchGroupDetails(groupId: string): Promise<Group | null> {
    console.log(`Simulating fetching details for group ${groupId} from mock data store`);
    await new Promise(resolve => setTimeout(resolve, 400)); // Simulate network delay

    // Use the current state of mockGroupsData
    const foundGroup = mockGroupsData.find(group => group.id === groupId);
    return foundGroup || null;
}

/**
 * Simulates adding members (teachers or students) to a group in the in-memory store.
 * @param groupId The ID of the group to update.
 * @param membersToAdd An array of User objects to add.
 * @returns Promise resolving to true if successful, false otherwise.
 */
export async function addMembersToGroup(groupId: string, membersToAdd: User[]): Promise<boolean> {
    console.log(`Simulating adding ${membersToAdd.length} members to group ${groupId}`);
    await new Promise(resolve => setTimeout(resolve, 300));

    const groupIndex = mockGroupsData.findIndex(group => group.id === groupId);
    if (groupIndex === -1) {
        console.error(`Group ${groupId} not found for adding members.`);
        return false;
    }

    const updatedGroups = [...mockGroupsData]; // Create a copy
    const groupToUpdate = { ...updatedGroups[groupIndex] }; // Shallow copy the group object

    membersToAdd.forEach(member => {
        if (member.role === 'Teacher' || member.role === 'Admin') {
            if (!groupToUpdate.teacherIds.includes(member.id)) {
                groupToUpdate.teacherIds = [...groupToUpdate.teacherIds, member.id];
                console.log(`Added teacher/admin ${member.id} to group ${groupId}`);
            }
        } else if (member.role === 'Student') {
            if (!groupToUpdate.studentIds.includes(member.id)) {
                groupToUpdate.studentIds = [...groupToUpdate.studentIds, member.id];
                 console.log(`Added student ${member.id} to group ${groupId}`);
            }
        }
    });

    updatedGroups[groupIndex] = groupToUpdate; // Put the updated group back
    mockGroupsData = updatedGroups; // Update the main store

    console.log("Updated group members:", groupToUpdate);
    return true;
}

/**
 * Simulates removing a member (teacher or student) from a group in the in-memory store.
 * @param groupId The ID of the group to update.
 * @param memberId The ID of the member to remove.
 * @returns Promise resolving to true if successful, false otherwise.
 */
export async function removeMemberFromGroup(groupId: string, memberId: string): Promise<boolean> {
    console.log(`Simulating removing member ${memberId} from group ${groupId}`);
    await new Promise(resolve => setTimeout(resolve, 200));

    const groupIndex = mockGroupsData.findIndex(group => group.id === groupId);
    if (groupIndex === -1) {
        console.error(`Group ${groupId} not found for removing member.`);
        return false;
    }

    const updatedGroups = [...mockGroupsData]; // Create a copy
    const groupToUpdate = { ...updatedGroups[groupIndex] }; // Shallow copy the group object

    // Remove from teacherIds
    const initialTeacherCount = groupToUpdate.teacherIds.length;
    groupToUpdate.teacherIds = groupToUpdate.teacherIds.filter(id => id !== memberId);
    if (groupToUpdate.teacherIds.length < initialTeacherCount) {
        console.log(`Removed teacher/admin ${memberId} from group ${groupId}`);
    }

     // Remove from studentIds
    const initialStudentCount = groupToUpdate.studentIds.length;
    groupToUpdate.studentIds = groupToUpdate.studentIds.filter(id => id !== memberId);
     if (groupToUpdate.studentIds.length < initialStudentCount) {
        console.log(`Removed student ${memberId} from group ${groupId}`);
    }

    updatedGroups[groupIndex] = groupToUpdate; // Put the updated group back
    mockGroupsData = updatedGroups; // Update the main store

    console.log("Updated group members after removal:", groupToUpdate);
    return true;
}


// Add other group-related functions as needed:
// - updateGroup(groupId, updateData)
// - deleteGroup(groupId)
// - requestToJoinGroup(groupId, userId)
// - approveJoinRequest(groupId, userId)
// - rejectJoinRequest(groupId, userId)
// - fetchGroupJoinRequests(groupId)
