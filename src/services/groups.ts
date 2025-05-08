
// TODO: Firebase - Import necessary Firebase modules (e.g., getFirestore, collection, addDoc, getDoc, updateDoc, arrayUnion, arrayRemove, query, where, getDocs, serverTimestamp, deleteDoc, writeBatch)
// import { getFirestore, collection, addDoc, getDoc, doc, updateDoc, arrayUnion, arrayRemove, query, where, getDocs, serverTimestamp, deleteDoc, writeBatch } from 'firebase/firestore';
// import { db } from '@/lib/firebase'; // Assuming you have a firebase.ts setup file

import type { User } from '@/context/auth-context';
import * as usersModule from './users'; // Static import

/**
 * Represents the structure of a group.
 */
export interface Group {
  id: string;
  name: string;
  description?: string;
  subject?: string;
  teacherIds: string[];
  studentIds: string[];
  schoolCode: string;
  groupCode: string;
  createdAt: Date; // Or Firebase Timestamp
  joinRequests?: string[];
  // New fields for additional settings
  allowStudentPosts?: boolean; // Default true, can be changed by admin/teacher
  // Other settings like file sharing permissions, poll creation permissions for students can be added here
}

/**
 * Input data required to create a new group.
 */
export interface CreateGroupInput {
  name: string;
  description?: string;
  subject?: string;
  allowStudentPosts?: boolean; // Added to creation
}


// Use a global variable for mock data in non-production environments
declare global {
  var mockGroupsData_assigno_groups: Map<string, Group> | undefined;
  var mockGroupsInitialized_assigno_groups: boolean | undefined;
}

const GROUPS_STORAGE_KEY = 'assigno_mock_groups_data_v5_allow_student_posts'; // Incremented version for new fields

// Initialize from localStorage or create new if not present
function initializeGlobalGroupsStore(): Map<string, Group> {
  if (typeof window === 'undefined') {
     // Server-side: initialize with empty or default if not already done by ensureMockDataInitialized
    globalThis.mockGroupsData_assigno_groups = new Map<string, Group>();
    globalThis.mockGroupsInitialized_assigno_groups = true;
    console.log("[Service:groups] Server-side: Initialized empty groups store.");
    return globalThis.mockGroupsData_assigno_groups;
  }

  if (globalThis.mockGroupsData_assigno_groups && globalThis.mockGroupsInitialized_assigno_groups) {
    return globalThis.mockGroupsData_assigno_groups;
  }

  try {
    const storedData = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (storedData) {
      const parsedArray = (JSON.parse(storedData) as Array<Omit<Group, 'createdAt' | 'joinRequests' | 'allowStudentPosts'> & {createdAt: string, joinRequests?: any[], allowStudentPosts?: boolean}>).map(g => ({
        ...g,
        createdAt: new Date(g.createdAt),
        allowStudentPosts: typeof g.allowStudentPosts === 'undefined' ? false : g.allowStudentPosts, // Default to false if missing
        joinRequests: Array.isArray(g.joinRequests) ? g.joinRequests : [],
      }));
      const groupsMap = new Map<string, Group>(parsedArray.map(g => [g.id, g]));
      globalThis.mockGroupsData_assigno_groups = groupsMap;
      globalThis.mockGroupsInitialized_assigno_groups = true;
      console.log("[Service:groups] Initialized global groups store from localStorage.", groupsMap.size, "groups loaded.");
      return groupsMap;
    }
  } catch (error) {
    console.error("[Service:groups] Error reading groups from localStorage during global init:", error);
    localStorage.removeItem(GROUPS_STORAGE_KEY); // Clear corrupted data
  }

  const newStore = new Map<string, Group>();
  globalThis.mockGroupsData_assigno_groups = newStore;
  globalThis.mockGroupsInitialized_assigno_groups = true;
  localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(Array.from(newStore.values()))); // Save empty store
  console.log("[Service:groups] Initialized new empty global groups store and saved to localStorage.");
  return newStore;
}


function getMockGroupsData(): Map<string, Group> {
  if (!globalThis.mockGroupsData_assigno_groups || !globalThis.mockGroupsInitialized_assigno_groups) {
    console.warn("[Service:groups] getMockGroupsData: Store not initialized. Attempting recovery by initializing.");
    return initializeGlobalGroupsStore();
  }
  return globalThis.mockGroupsData_assigno_groups;
}

function updateMockGroupsData(newData: Map<string, Group>): void {
  globalThis.mockGroupsData_assigno_groups = newData;
  globalThis.mockGroupsInitialized_assigno_groups = true;
  if (typeof window !== 'undefined') {
    try {
      const serializableArray = Array.from(newData.values()).map(g => ({
        ...g,
        createdAt: g.createdAt.toISOString()
      }));
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(serializableArray));
      console.log("[Service:groups] Saved", serializableArray.length, "groups to localStorage.");
    } catch (error) {
      console.error("[Service:groups] Error writing groups to localStorage:", error);
    }
  }
}

export async function ensureMockDataInitialized() {
    if (typeof window !== 'undefined' && !globalThis.mockGroupsInitialized_assigno_groups) {
        initializeGlobalGroupsStore();
    } else if (typeof window === 'undefined' && !globalThis.mockGroupsInitialized_assigno_groups) {
        // Ensure server-side has a basic initialized store if accessed directly
        initializeGlobalGroupsStore();
    }
     // Also ensure users service is initialized if it's a dependency for admin creation
    if (usersModule && typeof usersModule.ensureMockDataInitialized === 'function') {
        await usersModule.ensureMockDataInitialized();
    }
}

// Initialize on load for client-side
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  ensureMockDataInitialized();
}


function generateGroupCodeInternal(schoolCode: string, existingGroupsMap: Map<string, Group>): string {
    let newCode;
    let attempts = 0;
    const normalizedSchoolCode = schoolCode.toUpperCase().slice(0,7).replace(/[^A-Z0-9]/g, '');
    const existingCodes = new Set(Array.from(existingGroupsMap.values()).map(g => g.groupCode));
    do {
        newCode = `${normalizedSchoolCode}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        attempts++;
        if (attempts > 20) throw new Error("Failed to generate unique group code after multiple attempts.");
    } while (existingCodes.has(newCode));
    return newCode;
}

export async function createGroup(groupData: CreateGroupInput, creatorId: string, creatorRole: 'Admin' | 'Teacher', schoolCode: string): Promise<Group> {
    await ensureMockDataInitialized();
    console.log("[Service:groups] Creating group:", groupData, "Creator:", creatorId, "School:", schoolCode);
    
    const currentStore = getMockGroupsData();
    const newGroupId = `group-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newGroup: Group = {
        id: newGroupId,
        name: groupData.name,
        description: groupData.description || '',
        subject: groupData.subject || '',
        teacherIds: (creatorRole === 'Admin' || creatorRole === 'Teacher') ? [creatorId] : [],
        studentIds: [],
        schoolCode: schoolCode,
        groupCode: generateGroupCodeInternal(schoolCode, currentStore),
        createdAt: new Date(),
        joinRequests: [],
        allowStudentPosts: typeof groupData.allowStudentPosts === 'undefined' ? false : groupData.allowStudentPosts, // Default to false
    };

    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updatedStore = new Map(currentStore);
    updatedStore.set(newGroupId, newGroup);
    updateMockGroupsData(updatedStore);

    console.log("[Service:groups] New group created (mock):", newGroup);
    return { ...newGroup };
}

export async function fetchUserGroups(userId: string, userRole: 'Admin' | 'Teacher' | 'Student'): Promise<Group[]> {
    await ensureMockDataInitialized();
    console.log(`[Service:groups] Fetching groups for user ${userId} (${userRole}).`);
    
    await usersModule.ensureMockDataInitialized();
    
    const user = await usersModule.fetchUsersByIds([userId]).then(users => users[0]);

    const currentStore = getMockGroupsData();
    const allGroups = Array.from(currentStore.values());

    if (!user) {
      console.warn(`[Service:groups] User not found for ID: ${userId} when fetching groups.`);
      return [];
    }
    let filteredGroups: Group[];
    if (userRole === 'Admin') {
        filteredGroups = allGroups.filter(group => group.schoolCode === user.schoolCode);
    } else if (userRole === 'Teacher') {
        filteredGroups = allGroups.filter(group => group.teacherIds.includes(userId) && group.schoolCode === user.schoolCode);
    } else if (userRole === 'Student') {
        filteredGroups = allGroups.filter(group => group.studentIds.includes(userId) && group.schoolCode === user.schoolCode);
    } else {
        filteredGroups = [];
    }
    console.log(`[Service:groups] Found ${filteredGroups.length} groups for user ${userId} (mock).`);
    return filteredGroups.map(g => ({...g})).sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchGroupDetails(groupId: string): Promise<Group | null> {
    await ensureMockDataInitialized();
    console.log(`[Service:groups] Fetching details for group ${groupId}.`);
        
    const currentStore = getMockGroupsData();
    const foundGroup = currentStore.get(groupId);
    if (foundGroup) {
      console.log(`[Service:groups] Group found (mock): ${foundGroup.name}`);
      // Ensure allowStudentPosts has a default value if somehow missing (though init should handle it)
      const groupWithDefaults = {
        ...foundGroup,
        allowStudentPosts: typeof foundGroup.allowStudentPosts === 'undefined' ? false : foundGroup.allowStudentPosts,
      };
      return groupWithDefaults;
    } else {
      console.warn(`[Service:groups] Group NOT found for ID: ${groupId} (mock).`);
    }
    return null;
}

export async function fetchGroupByCode(groupCode: string, schoolCode: string): Promise<Group | null> {
    await ensureMockDataInitialized();
    console.log(`[Service:groups] Fetching group by code ${groupCode} for school ${schoolCode}`);
    
    const currentStore = getMockGroupsData();
    const allGroups = Array.from(currentStore.values());
    const foundGroup = allGroups.find(g => g.groupCode.toUpperCase() === groupCode.toUpperCase() && g.schoolCode === schoolCode);
    if (foundGroup) {
         const groupWithDefaults = {
            ...foundGroup,
            allowStudentPosts: typeof foundGroup.allowStudentPosts === 'undefined' ? false : foundGroup.allowStudentPosts,
        };
        return groupWithDefaults;
    }
    return null;
}


export async function addMembersToGroup(groupId: string, membersToAdd: User[]): Promise<boolean> {
    await ensureMockDataInitialized();
    console.log(`[Service:groups] Adding ${membersToAdd.length} members to group ${groupId}`);
    
    const currentStore = getMockGroupsData();
    const groupToUpdate = currentStore.get(groupId);

    if (!groupToUpdate) {
      console.warn(`[Service:groups] Group ${groupId} not found for adding members (mock).`);
      return false;
    }
    
    const clonedGroup = { ...groupToUpdate, teacherIds: [...groupToUpdate.teacherIds], studentIds: [...groupToUpdate.studentIds], joinRequests: [...(groupToUpdate.joinRequests || [])] };
    let changed = false;

    membersToAdd.forEach(member => {
        if (member.role === 'Teacher' || member.role === 'Admin') {
            if (!clonedGroup.teacherIds.includes(member.id)) {
                clonedGroup.teacherIds.push(member.id);
                changed = true;
            }
        } else if (member.role === 'Student') {
            if (!clonedGroup.studentIds.includes(member.id)) {
                clonedGroup.studentIds.push(member.id);
                clonedGroup.joinRequests = clonedGroup.joinRequests.filter(id => id !== member.id);
                changed = true;
            }
        }
    });

    if (changed) {
        const updatedStore = new Map(currentStore);
        updatedStore.set(groupId, clonedGroup);
        updateMockGroupsData(updatedStore);
        console.log("[Service:groups] Updated group members (mock):", clonedGroup.name, "Teachers:", clonedGroup.teacherIds.length, "Students:", clonedGroup.studentIds.length);
    }
    return true;
}

export async function removeMemberFromGroup(groupId: string, memberId: string): Promise<boolean> {
    await ensureMockDataInitialized();
    console.log(`[Service:groups] Removing member ${memberId} from group ${groupId}`);
    
    const currentStore = getMockGroupsData();
    const groupToUpdate = currentStore.get(groupId);
    if (!groupToUpdate) return false;

    const clonedGroup = { ...groupToUpdate, teacherIds: [...groupToUpdate.teacherIds], studentIds: [...groupToUpdate.studentIds] };
    let changed = false;
    
    const initialTeacherCount = clonedGroup.teacherIds.length;
    clonedGroup.teacherIds = clonedGroup.teacherIds.filter(id => id !== memberId);
    if (clonedGroup.teacherIds.length < initialTeacherCount) changed = true;
    
    const initialStudentCount = clonedGroup.studentIds.length;
    clonedGroup.studentIds = clonedGroup.studentIds.filter(id => id !== memberId);
    if (clonedGroup.studentIds.length < initialStudentCount) changed = true;

    if (changed) {
        const updatedStore = new Map(currentStore);
        updatedStore.set(groupId, clonedGroup);
        updateMockGroupsData(updatedStore);
        console.log("[Service:groups] Updated group after removal (mock):", clonedGroup);
    }
    return true;
}


export async function deleteGroup(groupId: string, adminId: string, schoolCode: string): Promise<boolean> {
    await ensureMockDataInitialized();
    console.log(`[Service:groups] Admin ${adminId} (school: ${schoolCode}) attempting to delete group ${groupId}`);
    
    const currentStore = getMockGroupsData();
    const groupToDelete = currentStore.get(groupId);

    if (!groupToDelete || groupToDelete.schoolCode !== schoolCode) {
      console.warn(`[Service:groups] Group ${groupId} not found or school code mismatch for deletion.`);
      return false;
    }
    
    const updatedStore = new Map(currentStore);
    updatedStore.delete(groupId);
    updateMockGroupsData(updatedStore);
    console.log(`[Service:groups] Group ${groupId} deleted (mock).`);
    return true;
}


export async function requestToJoinGroup(groupId: string, studentId: string): Promise<boolean> {
    await ensureMockDataInitialized();
    console.log(`[Service:groups] Student ${studentId} requesting to join group ${groupId}`);
    
    const currentStore = getMockGroupsData();
    const groupToUpdate = currentStore.get(groupId);
    if (!groupToUpdate) return false;

    const clonedGroup = { ...groupToUpdate, joinRequests: [...(groupToUpdate.joinRequests || [])] };
    if (!clonedGroup.joinRequests) clonedGroup.joinRequests = [];

    if (clonedGroup.studentIds.includes(studentId) || clonedGroup.joinRequests.includes(studentId)) {
        console.log(`[Service:groups] Student ${studentId} already in group or request pending (mock).`);
        return false;
    }
    clonedGroup.joinRequests.push(studentId);
    
    const updatedStore = new Map(currentStore);
    updatedStore.set(groupId, clonedGroup);
    updateMockGroupsData(updatedStore);
    console.log(`[Service:groups] Group ${groupId} join requests (mock):`, clonedGroup.joinRequests);
    return true;
}

export async function fetchGroupJoinRequests(groupId: string, requestingUserId: string): Promise<User[]> {
    await ensureMockDataInitialized();
    console.log(`[Service:groups] User ${requestingUserId} fetching join requests for group ${groupId}`);
    
    await usersModule.ensureMockDataInitialized();
    
    const requestingUser = await usersModule.fetchUsersByIds([requestingUserId]).then(users => users[0]);

    if (!requestingUser) {
        console.warn(`[Service:groups] User ${requestingUserId} not found when fetching join requests.`);
        return [];
    }

    const currentStore = getMockGroupsData();
    const group = currentStore.get(groupId);

    if (!group || !(group.teacherIds.includes(requestingUserId) || (requestingUser.role === 'Admin' && group.schoolCode === requestingUser.schoolCode))) {
        console.warn(`[Service:groups] User ${requestingUserId} does not manage group ${groupId} or is not admin of school.`);
        return [];
    }
    if (!group.joinRequests || group.joinRequests.length === 0) return [];

    return usersModule.fetchUsersByIds(group.joinRequests);
}

export async function approveJoinRequest(groupId: string, studentId: string, approverId: string): Promise<boolean> {
    await ensureMockDataInitialized();
    console.log(`[Service:groups] Approver ${approverId} approving join request for student ${studentId} in group ${groupId}`);
    
    const currentStore = getMockGroupsData();
    const groupToUpdate = currentStore.get(groupId);
    if (!groupToUpdate) return false;

    await usersModule.ensureMockDataInitialized();
    const approverUser = await usersModule.fetchUsersByIds([approverId]).then(users => users[0]);
    if (!approverUser) return false;

    const isTeacherInGroup = groupToUpdate.teacherIds.includes(approverId);
    const isAdminOfSchool = approverUser.role === 'Admin' && approverUser.schoolCode === groupToUpdate.schoolCode;
    if (!isTeacherInGroup && !isAdminOfSchool) return false;

    if (!groupToUpdate.joinRequests?.includes(studentId)) return false;
    
    const clonedGroup = { 
        ...groupToUpdate, 
        studentIds: [...groupToUpdate.studentIds, studentId],
        joinRequests: (groupToUpdate.joinRequests || []).filter(id => id !== studentId)
    };
    
    const updatedStore = new Map(currentStore);
    updatedStore.set(groupId, clonedGroup);
    updateMockGroupsData(updatedStore);

    console.log(`[Service:groups] Student ${studentId} approved for group ${groupId} (mock). Students: ${clonedGroup.studentIds.length}, Requests: ${clonedGroup.joinRequests.length}`);
    return true;
}

export async function rejectJoinRequest(groupId: string, studentId: string, rejectorId: string): Promise<boolean> {
    await ensureMockDataInitialized();
    console.log(`[Service:groups] Rejector ${rejectorId} rejecting join request for student ${studentId} in group ${groupId}`);
    
    const currentStore = getMockGroupsData();
    const groupToUpdate = currentStore.get(groupId);
    if (!groupToUpdate) return false;

    await usersModule.ensureMockDataInitialized();
    const rejectorUser = await usersModule.fetchUsersByIds([rejectorId]).then(users => users[0]);
    if(!rejectorUser) return false;

    const isTeacherInGroup = groupToUpdate.teacherIds.includes(rejectorId);
    const isAdminOfSchool = rejectorUser.role === 'Admin' && rejectorUser.schoolCode === groupToUpdate.schoolCode;
    if (!isTeacherInGroup && !isAdminOfSchool) return false;

    if (!groupToUpdate.joinRequests?.includes(studentId)) return false;

    const clonedGroup = { 
        ...groupToUpdate, 
        joinRequests: (groupToUpdate.joinRequests || []).filter(id => id !== studentId)
    };
    
    const updatedStore = new Map(currentStore);
    updatedStore.set(groupId, clonedGroup);
    updateMockGroupsData(updatedStore);
    return true;
}

export interface SchoolStats {
    totalGroups: number;
    totalStudents: number;
    studentsInAnyGroup: number;
    studentsNotInAnyGroup: number;
    totalTeachersAndAdmins: number;
    staffInAnyGroup: number;
    staffNotInAnyGroup: number;
    groupMembership: Array<{ groupId: string, groupName: string, studentCount: number, teacherCount: number }>;
}

export async function getSchoolStats(schoolCode: string): Promise<SchoolStats> {
    console.log(`[Service:groups] Calculating stats for school ${schoolCode}`);
    await ensureMockDataInitialized();

    const currentStore = getMockGroupsData();
    const allGroups = Array.from(currentStore.values());
    
    if (!usersModule) {
        console.error("[Service:groups] usersModule is not available in getSchoolStats.");
         return { 
            totalGroups: 0, totalStudents: 0, studentsInAnyGroup: 0, studentsNotInAnyGroup: 0,
            totalTeachersAndAdmins: 0, staffInAnyGroup: 0, staffNotInAnyGroup: 0, groupMembership: []
        };
    }
    if (typeof usersModule.ensureMockDataInitialized === 'function') {
        await usersModule.ensureMockDataInitialized();
    } else {
        console.warn("[Service:groups] users.ts module does not export ensureMockDataInitialized. Data might be stale if not pre-initialized.");
    }
    
    if (typeof usersModule.fetchAllUsers !== 'function') {
        console.error("[Service:groups] fetchAllUsers is not a function after import in getSchoolStats.");
        return {
            totalGroups: 0, totalStudents: 0, studentsInAnyGroup: 0, studentsNotInAnyGroup: 0,
            totalTeachersAndAdmins: 0, staffInAnyGroup: 0, staffNotInAnyGroup: 0, groupMembership: []
        };
    }

    const allSchoolUsers = await usersModule.fetchAllUsers(schoolCode);
    const schoolGroups = allGroups.filter(g => g.schoolCode === schoolCode);
    const schoolStudents = allSchoolUsers.filter(u => u.role === 'Student');
    const schoolTeachersAndAdmins = allSchoolUsers.filter(u => u.role === 'Teacher' || u.role === 'Admin');
    const studentIdsInAnyGroup = new Set<string>();
    schoolGroups.forEach(g => g.studentIds.forEach(id => studentIdsInAnyGroup.add(id)));
    const staffIdsInAnyGroup = new Set<string>();
    schoolGroups.forEach(g => g.teacherIds.forEach(id => staffIdsInAnyGroup.add(id)));
    const groupMembership = schoolGroups.map(g => ({
        groupId: g.id,
        groupName: g.name,
        studentCount: g.studentIds.length,
        teacherCount: g.teacherIds.length,
    })).sort((a,b) => a.groupName.localeCompare(b.groupName));
    return {
        totalGroups: schoolGroups.length,
        totalStudents: schoolStudents.length,
        studentsInAnyGroup: studentIdsInAnyGroup.size,
        studentsNotInAnyGroup: schoolStudents.length - studentIdsInAnyGroup.size,
        totalTeachersAndAdmins: schoolTeachersAndAdmins.length,
        staffInAnyGroup: staffIdsInAnyGroup.size,
        staffNotInAnyGroup: schoolTeachersAndAdmins.length - staffIdsInAnyGroup.size,
        groupMembership,
    };
}

export async function updateGroupSettings(groupId: string, settings: Partial<Pick<Group, 'name' | 'description' | 'subject' | 'allowStudentPosts'>>, currentUserId: string): Promise<Group | null> {
    await ensureMockDataInitialized();
    console.log(`[Service:groups] Updating settings for group ${groupId} by user ${currentUserId}`);
    
    const currentStore = getMockGroupsData();
    const groupToUpdate = currentStore.get(groupId);

    if (!groupToUpdate) {
      console.warn(`[Service:groups] Group ${groupId} not found for settings update (mock).`);
      return null;
    }
    
    await usersModule.ensureMockDataInitialized();
    const user = await usersModule.fetchUsersByIds([currentUserId]).then(users => users[0]);
    if (!user) {
        console.warn(`[Service:groups] User ${currentUserId} not found, cannot update group settings (mock).`);
        return null;
    }

    const isAdminOfSchool = user.role === 'Admin' && user.schoolCode === groupToUpdate.schoolCode;
    const isTeacherInGroup = (user.role === 'Teacher' || user.role === 'Admin') && groupToUpdate.teacherIds.includes(user.id);
    if (!isAdminOfSchool && !isTeacherInGroup) {
        console.warn(`[Service:groups] User ${currentUserId} (Role: ${user.role}) lacks permission to update group ${groupId} (mock).`);
        return null;
    }
    
    const updatedGroup = { ...groupToUpdate, ...settings };
    // Ensure allowStudentPosts maintains its value if not explicitly in settings
    if (typeof settings.allowStudentPosts === 'undefined') {
        updatedGroup.allowStudentPosts = groupToUpdate.allowStudentPosts;
    }
    
    const updatedStore = new Map(currentStore);
    updatedStore.set(groupId, updatedGroup);
    updateMockGroupsData(updatedStore);

    console.log(`[Service:groups] Group settings for "${updatedGroup.name}" updated (mock). Allow student posts: ${updatedGroup.allowStudentPosts}`);
    return { ...updatedGroup };
}

