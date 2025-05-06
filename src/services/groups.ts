
// TODO: Firebase - Import necessary Firebase modules (e.g., getFirestore, collection, addDoc, getDoc, updateDoc, arrayUnion, arrayRemove, query, where, getDocs, serverTimestamp, deleteDoc)
// import { getFirestore, collection, addDoc, getDoc, doc, updateDoc, arrayUnion, arrayRemove, query, where, getDocs, serverTimestamp, deleteDoc, writeBatch } from 'firebase/firestore';
// import { db } from '@/lib/firebase'; // Assuming you have a firebase.ts setup file

import type { User } from '@/context/auth-context';

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
}

/**
 * Input data required to create a new group.
 */
export interface CreateGroupInput {
  name: string;
  description?: string;
  subject?: string;
}

declare global {
  var mockGroupsData_assigno_groups: Group[] | undefined;
}

// Initialize mockGroupsData_assigno_groups on globalThis if it doesn't exist (for dev environment)
if (process.env.NODE_ENV !== 'production') {
  if (!globalThis.mockGroupsData_assigno_groups) {
    globalThis.mockGroupsData_assigno_groups = [];
    console.log("[Service:groups] Initialized global mockGroupsData_assigno_groups (empty).");
  }
}

function getMockGroupsData(): Group[] {
  if (process.env.NODE_ENV === 'production') {
    // In production, this would interact with a database. For now, return empty.
    return [];
  }
  // Ensure globalThis.mockGroupsData_assigno_groups is initialized
  if (!globalThis.mockGroupsData_assigno_groups) {
    globalThis.mockGroupsData_assigno_groups = [];
  }
  return globalThis.mockGroupsData_assigno_groups;
}

function updateMockGroupsData(newData: Group[]): void {
  if (process.env.NODE_ENV !== 'production') {
    globalThis.mockGroupsData_assigno_groups = newData;
  }
}


function generateGroupCodeInternal(schoolCode: string, existingGroups: Group[]): string {
    let newCode;
    let attempts = 0;
    const normalizedSchoolCode = schoolCode.toUpperCase().slice(0,4).replace(/[^A-Z0-9]/g, '');
    do {
        newCode = `${normalizedSchoolCode}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        attempts++;
        if (attempts > 20) throw new Error("Failed to generate unique group code after multiple attempts.");
    } while (existingGroups.some(g => g.groupCode === newCode));
    return newCode;
}

export async function createGroup(groupData: CreateGroupInput, creatorId: string, creatorRole: 'Admin' | 'Teacher', schoolCode: string): Promise<Group> {
    console.log("[Service:groups] Creating group:", groupData, "Creator:", creatorId, "School:", schoolCode);
    
    const currentMockData = getMockGroupsData();
    const newGroupData = {
        name: groupData.name,
        description: groupData.description || '',
        subject: groupData.subject || '',
        teacherIds: (creatorRole === 'Admin' || creatorRole === 'Teacher') ? [creatorId] : [],
        studentIds: [],
        schoolCode: schoolCode,
        groupCode: generateGroupCodeInternal(schoolCode, currentMockData),
        createdAt: new Date(),
        joinRequests: [],
    };

    await new Promise(resolve => setTimeout(resolve, 10));
    const newGroup: Group = {
        id: `group-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...newGroupData,
    };
    
    const updatedMockData = [...currentMockData, newGroup];
    updateMockGroupsData(updatedMockData);

    console.log("[Service:groups] New group created (mock):", newGroup);
    return { ...newGroup };
}

export async function fetchUserGroups(userId: string, userRole: 'Admin' | 'Teacher' | 'Student'): Promise<Group[]> {
    console.log(`[Service:groups] Fetching groups for user ${userId} (${userRole}).`);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    const usersModule = await import('@/services/users');
    const user = await usersModule.fetchUsersByIds([userId]).then(users => users[0]);

    const currentMockData = getMockGroupsData();

    if (!user) {
      console.warn(`[Service:groups] User not found for ID: ${userId} when fetching groups.`);
      return [];
    }
    let filteredGroups: Group[];
    if (userRole === 'Admin') {
        filteredGroups = currentMockData.filter(group => group.schoolCode === user.schoolCode);
    } else if (userRole === 'Teacher') {
        filteredGroups = currentMockData.filter(group => group.teacherIds.includes(userId) && group.schoolCode === user.schoolCode);
    } else if (userRole === 'Student') {
        filteredGroups = currentMockData.filter(group => group.studentIds.includes(userId) && group.schoolCode === user.schoolCode);
    } else {
        filteredGroups = [];
    }
    console.log(`[Service:groups] Found ${filteredGroups.length} groups for user ${userId} (mock).`);
    return filteredGroups.map(g => ({...g}));
}

export async function fetchGroupDetails(groupId: string): Promise<Group | null> {
    console.log(`[Service:groups] Fetching details for group ${groupId}.`);
        
    await new Promise(resolve => setTimeout(resolve, 10));
    const currentMockData = getMockGroupsData();
    const foundGroup = currentMockData.find(group => group.id === groupId);
    if (foundGroup) {
      console.log(`[Service:groups] Group found (mock): ${foundGroup.name}`);
    } else {
      console.warn(`[Service:groups] Group NOT found for ID: ${groupId} (mock).`);
    }
    return foundGroup ? { ...foundGroup } : null;
}

export async function fetchGroupByCode(groupCode: string, schoolCode: string): Promise<Group | null> {
    console.log(`[Service:groups] Fetching group by code ${groupCode} for school ${schoolCode}`);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    const currentMockData = getMockGroupsData();
    const foundGroup = currentMockData.find(g => g.groupCode.toUpperCase() === groupCode.toUpperCase() && g.schoolCode === schoolCode);
    return foundGroup ? { ...foundGroup } : null;
}


export async function addMembersToGroup(groupId: string, membersToAdd: User[]): Promise<boolean> {
    console.log(`[Service:groups] Adding ${membersToAdd.length} members to group ${groupId}`);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    const currentMockData = getMockGroupsData();
    const groupIndex = currentMockData.findIndex(group => group.id === groupId);
    if (groupIndex === -1) {
      console.warn(`[Service:groups] Group ${groupId} not found for adding members (mock).`);
      return false;
    }
    
    const updatedMockData = [...currentMockData];
    const groupToUpdate = { ...updatedMockData[groupIndex] };
    let changed = false;
    membersToAdd.forEach(member => {
        if (member.role === 'Teacher' || member.role === 'Admin') {
            if (!groupToUpdate.teacherIds.includes(member.id)) {
                groupToUpdate.teacherIds = [...groupToUpdate.teacherIds, member.id];
                changed = true;
            }
        } else if (member.role === 'Student') {
            if (!groupToUpdate.studentIds.includes(member.id)) {
                groupToUpdate.studentIds = [...groupToUpdate.studentIds, member.id];
                groupToUpdate.joinRequests = groupToUpdate.joinRequests?.filter(id => id !== member.id);
                changed = true;
            }
        }
    });
    if (changed) {
        updatedMockData[groupIndex] = groupToUpdate;
        updateMockGroupsData(updatedMockData);
        console.log("[Service:groups] Updated group members (mock):", groupToUpdate.name, "Teachers:", groupToUpdate.teacherIds.length, "Students:", groupToUpdate.studentIds.length);
    }
    return true;
}

export async function removeMemberFromGroup(groupId: string, memberId: string): Promise<boolean> {
    console.log(`[Service:groups] Removing member ${memberId} from group ${groupId}`);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    const currentMockData = getMockGroupsData();
    const groupIndex = currentMockData.findIndex(group => group.id === groupId);
    if (groupIndex === -1) return false;

    const updatedMockData = [...currentMockData];
    const groupToUpdate = { ...updatedMockData[groupIndex] };
    let changed = false;
    
    const initialTeacherCount = groupToUpdate.teacherIds.length;
    groupToUpdate.teacherIds = groupToUpdate.teacherIds.filter(id => id !== memberId);
    if (groupToUpdate.teacherIds.length < initialTeacherCount) changed = true;
    
    const initialStudentCount = groupToUpdate.studentIds.length;
    groupToUpdate.studentIds = groupToUpdate.studentIds.filter(id => id !== memberId);
    if (groupToUpdate.studentIds.length < initialStudentCount) changed = true;

    if (changed) {
        updatedMockData[groupIndex] = groupToUpdate;
        updateMockGroupsData(updatedMockData);
        console.log("[Service:groups] Updated group after removal (mock):", groupToUpdate);
    }
    return true;
}


export async function deleteGroup(groupId: string, adminId: string, schoolCode: string): Promise<boolean> {
    console.log(`[Service:groups] Admin ${adminId} (school: ${schoolCode}) attempting to delete group ${groupId}`);
    console.warn(`[Service:groups] Group deletion is disabled. Group ID: ${groupId}`);
    // Firebase - Group deletion is disabled as per requirement
    // If it were enabled for mock:
    // await new Promise(resolve => setTimeout(resolve, 10));
    // const currentMockData = getMockGroupsData();
    // const groupIndex = currentMockData.findIndex(g => g.id === groupId && g.schoolCode === schoolCode);
    // if (groupIndex === -1) {
    //   console.warn(`[Service:groups] Group ${groupId} not found or school code mismatch for deletion.`);
    //   return false;
    // }
    // const updatedMockData = currentMockData.filter(g => g.id !== groupId);
    // updateMockGroupsData(updatedMockData);
    // console.log(`[Service:groups] Group ${groupId} deleted (mock).`);
    // return true;
    return false;
}


export async function requestToJoinGroup(groupId: string, studentId: string): Promise<boolean> {
    console.log(`[Service:groups] Student ${studentId} requesting to join group ${groupId}`);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    const currentMockData = getMockGroupsData();
    const groupIndex = currentMockData.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return false;

    const updatedMockData = [...currentMockData];
    const group = { ...updatedMockData[groupIndex] };
    if (!group.joinRequests) group.joinRequests = [];

    if (group.studentIds.includes(studentId) || group.joinRequests.includes(studentId)) {
        console.log(`[Service:groups] Student ${studentId} already in group or request pending (mock).`);
        return false;
    }
    group.joinRequests.push(studentId);
    updatedMockData[groupIndex] = group;
    updateMockGroupsData(updatedMockData);
    console.log(`[Service:groups] Group ${groupId} join requests (mock):`, group.joinRequests);
    return true;
}

export async function fetchGroupJoinRequests(groupId: string, teacherId: string): Promise<User[]> {
    console.log(`[Service:groups] Teacher ${teacherId} fetching join requests for group ${groupId}`);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    const currentMockData = getMockGroupsData();
    const usersModule = await import('@/services/users');
    const teacherUser = await usersModule.fetchUsersByIds([teacherId]).then(users => users[0]);

    if (!teacherUser) {
        console.warn(`[Service:groups] Teacher user ${teacherId} not found when fetching join requests.`);
        return [];
    }

    const group = currentMockData.find(g =>
        g.id === groupId &&
        (g.teacherIds.includes(teacherId) || (teacherUser.role === 'Admin' && g.schoolCode === teacherUser.schoolCode))
    );

    if (!group || !group.joinRequests || group.joinRequests.length === 0) return [];

    return usersModule.fetchUsersByIds(group.joinRequests);
}

export async function approveJoinRequest(groupId: string, studentId: string, approverId: string): Promise<boolean> {
    console.log(`[Service:groups] Approver ${approverId} approving join request for student ${studentId} in group ${groupId}`);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    const currentMockData = getMockGroupsData();
    const groupIndex = currentMockData.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return false;

    const updatedMockData = [...currentMockData];
    const group = { ...updatedMockData[groupIndex] };
    const usersModule = await import('@/services/users');
    const approverUser = await usersModule.fetchUsersByIds([approverId]).then(users => users[0]);

    if (!approverUser) return false;
    const isTeacherInGroup = group.teacherIds.includes(approverId);
    const isAdminOfSchool = approverUser.role === 'Admin' && approverUser.schoolCode === group.schoolCode;

    if (!isTeacherInGroup && !isAdminOfSchool) return false;

    if (!group.joinRequests?.includes(studentId)) return false;
    group.studentIds = [...group.studentIds, studentId];
    group.joinRequests = group.joinRequests.filter(id => id !== studentId);
    updatedMockData[groupIndex] = group;
    updateMockGroupsData(updatedMockData);
    console.log(`[Service:groups] Student ${studentId} approved for group ${groupId} (mock). Students: ${group.studentIds.length}, Requests: ${group.joinRequests.length}`);
    return true;
}

export async function rejectJoinRequest(groupId: string, studentId: string, rejectorId: string): Promise<boolean> {
    console.log(`[Service:groups] Rejector ${rejectorId} rejecting join request for student ${studentId} in group ${groupId}`);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    const currentMockData = getMockGroupsData();
    const groupIndex = currentMockData.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return false;

    const updatedMockData = [...currentMockData];
    const group = { ...updatedMockData[groupIndex] };
    const usersModule = await import('@/services/users');
    const rejectorUser = await usersModule.fetchUsersByIds([rejectorId]).then(users => users[0]);

    if(!rejectorUser) return false;
    const isTeacherInGroup = group.teacherIds.includes(rejectorId);
    const isAdminOfSchool = rejectorUser.role === 'Admin' && rejectorUser.schoolCode === group.schoolCode;

    if (!isTeacherInGroup && !isAdminOfSchool) return false;

    if (!group.joinRequests?.includes(studentId)) return false;
    group.joinRequests = group.joinRequests.filter(id => id !== studentId);
    updatedMockData[groupIndex] = group;
    updateMockGroupsData(updatedMockData);
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
    
    await new Promise(resolve => setTimeout(resolve, 10));
    const currentMockData = getMockGroupsData();
    const usersModule = await import('@/services/users');
    const allSchoolUsers = await usersModule.fetchAllUsers(schoolCode);
    const schoolGroups = currentMockData.filter(g => g.schoolCode === schoolCode);
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
    }));
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

export async function updateGroupSettings(groupId: string, settings: Partial<Pick<Group, 'name' | 'description' | 'subject'>>, currentUserId: string): Promise<Group | null> {
    console.log(`[Service:groups] Updating settings for group ${groupId} by user ${currentUserId}`);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    const currentMockData = getMockGroupsData();
    const groupIndex = currentMockData.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
      console.warn(`[Service:groups] Group ${groupId} not found for settings update (mock).`);
      return null;
    }
    const updatedMockData = [...currentMockData];
    const group = updatedMockData[groupIndex];
    const usersModule = await import('@/services/users');
    const user = await usersModule.fetchUsersByIds([currentUserId]).then(users => users[0]);
    if (!user) {
        console.warn(`[Service:groups] User ${currentUserId} not found, cannot update group settings (mock).`);
        return null;
    }
    const isAdminOfSchool = user.role === 'Admin' && user.schoolCode === group.schoolCode;
    const isTeacherInGroup = (user.role === 'Teacher' || user.role === 'Admin') && group.teacherIds.includes(user.id);
    if (!isAdminOfSchool && !isTeacherInGroup) {
        console.warn(`[Service:groups] User ${currentUserId} (Role: ${user.role}) lacks permission to update group ${groupId} (mock).`);
        return null;
    }
    updatedMockData[groupIndex] = { ...group, ...settings };
    updateMockGroupsData(updatedMockData);
    console.log(`[Service:groups] Group settings for "${group.name}" updated (mock).`);
    return { ...updatedMockData[groupIndex] };
}
