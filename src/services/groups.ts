
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
  groupCode: string; // Unique code for joining (schoolCode + random part)
  createdAt: Date;
  joinRequests?: string[]; // User IDs of students requesting to join
}

/**
 * Input data required to create a new group.
 */
export interface CreateGroupInput {
  name: string;
  description?: string;
  subject?: string;
}

// Ensure 'global' is typed for this property
declare global {
  // eslint-disable-next-line no-var
  var mockGroupsData_assigno: Group[];
}

let mockGroupsData: Group[];

if (process.env.NODE_ENV === 'production') {
  mockGroupsData = []; // In production, this would be a real database
} else {
  if (!global.mockGroupsData_assigno) {
    global.mockGroupsData_assigno = [
      // No initial groups by default, they are created through the app
    ];
    console.log("[Service:groups] Initialized global mockGroupsData_assigno (empty).");
  }
  mockGroupsData = global.mockGroupsData_assigno;
}


/**
 * Generates a unique group code.
 * @param schoolCode The school code to prefix.
 * @returns A unique group code.
 */
function generateGroupCode(schoolCode: string): string {
    let newCode;
    let attempts = 0;
    do {
        newCode = `${schoolCode.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        attempts++;
        if (attempts > 10) throw new Error("Failed to generate unique group code after multiple attempts.");
    } while (mockGroupsData.some(g => g.groupCode === newCode));
    return newCode;
}

export async function createGroup(groupData: CreateGroupInput, creatorId: string, creatorRole: 'Admin' | 'Teacher', schoolCode: string): Promise<Group> {
    console.log("[Service:groups] Simulating group creation:", groupData, "Creator:", creatorId, "School:", schoolCode);
    await new Promise(resolve => setTimeout(resolve, 300));

    const newGroup: Group = {
        id: `group-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: groupData.name,
        description: groupData.description,
        subject: groupData.subject,
        teacherIds: (creatorRole === 'Admin' || creatorRole === 'Teacher') ? [creatorId] : [],
        studentIds: [],
        schoolCode: schoolCode,
        groupCode: generateGroupCode(schoolCode),
        createdAt: new Date(),
        joinRequests: [],
    };
    mockGroupsData.push(newGroup);
    console.log("[Service:groups] New group created:", newGroup);
    console.log("[Service:groups] All groups count:", mockGroupsData.length);
    return { ...newGroup };
}

export async function fetchUserGroups(userId: string, userRole: 'Admin' | 'Teacher' | 'Student'): Promise<Group[]> {
    console.log(`[Service:groups] Fetching groups for user ${userId} (${userRole}). Total mock groups: ${mockGroupsData.length}`);
    await new Promise(resolve => setTimeout(resolve, 200));

    const usersModule = await import('@/services/users'); // Dynamically import to avoid circular dependencies if any
    const user = await usersModule.fetchUsersByIds([userId]).then(users => users[0]);

    if (!user) {
      console.warn(`[Service:groups] User not found for ID: ${userId} when fetching groups.`);
      return [];
    }

    let filteredGroups: Group[];
    if (userRole === 'Admin') {
        filteredGroups = mockGroupsData.filter(group => group.schoolCode === user.schoolCode);
    } else if (userRole === 'Teacher') {
        filteredGroups = mockGroupsData.filter(group => group.teacherIds.includes(userId) && group.schoolCode === user.schoolCode);
    } else if (userRole === 'Student') {
        filteredGroups = mockGroupsData.filter(group => group.studentIds.includes(userId) && group.schoolCode === user.schoolCode);
    } else {
        filteredGroups = [];
    }
    console.log(`[Service:groups] Found ${filteredGroups.length} groups for user ${userId}.`);
    return filteredGroups.map(g => ({...g}));
}

export async function fetchGroupDetails(groupId: string): Promise<Group | null> {
    console.log(`[Service:groups] Fetching details for group ${groupId}. Searching in ${mockGroupsData.length} mock groups.`);
    await new Promise(resolve => setTimeout(resolve, 100));
    const foundGroup = mockGroupsData.find(group => group.id === groupId);
    if (foundGroup) {
      console.log(`[Service:groups] Group found: ${foundGroup.name}`);
    } else {
      console.warn(`[Service:groups] Group NOT found for ID: ${groupId}`);
    }
    return foundGroup ? { ...foundGroup } : null;
}

export async function fetchGroupByCode(groupCode: string, schoolCode: string): Promise<Group | null> {
    console.log(`[Service:groups] Fetching group by code ${groupCode} for school ${schoolCode}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    const foundGroup = mockGroupsData.find(g => g.groupCode.toUpperCase() === groupCode.toUpperCase() && g.schoolCode === schoolCode);
    return foundGroup ? { ...foundGroup } : null;
}


export async function addMembersToGroup(groupId: string, membersToAdd: User[]): Promise<boolean> {
    console.log(`[Service:groups] Adding ${membersToAdd.length} members to group ${groupId}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    const groupIndex = mockGroupsData.findIndex(group => group.id === groupId);
    if (groupIndex === -1) {
      console.warn(`[Service:groups] Group ${groupId} not found for adding members.`);
      return false;
    }

    const groupToUpdate = { ...mockGroupsData[groupIndex] };
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
        mockGroupsData[groupIndex] = groupToUpdate;
        console.log("[Service:groups] Updated group members:", groupToUpdate.name, "Teachers:", groupToUpdate.teacherIds.length, "Students:", groupToUpdate.studentIds.length);
    }
    return true;
}

export async function removeMemberFromGroup(groupId: string, memberId: string): Promise<boolean> {
    console.log(`[Service:groups] Removing member ${memberId} from group ${groupId}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    const groupIndex = mockGroupsData.findIndex(group => group.id === groupId);
    if (groupIndex === -1) return false;

    const groupToUpdate = { ...mockGroupsData[groupIndex] };
    let changed = false;
    const initialTeacherCount = groupToUpdate.teacherIds.length;
    groupToUpdate.teacherIds = groupToUpdate.teacherIds.filter(id => id !== memberId);
    if (groupToUpdate.teacherIds.length < initialTeacherCount) changed = true;

    const initialStudentCount = groupToUpdate.studentIds.length;
    groupToUpdate.studentIds = groupToUpdate.studentIds.filter(id => id !== memberId);
    if (groupToUpdate.studentIds.length < initialStudentCount) changed = true;

    if (changed) {
        mockGroupsData[groupIndex] = groupToUpdate;
        console.log("[Service:groups] Updated group after removal:", groupToUpdate);
    }
    return true;
}

export async function deleteGroup(groupId: string, adminId: string, schoolCode: string): Promise<boolean> {
    console.log(`[Service:groups] Admin ${adminId} (school: ${schoolCode}) attempting to delete group ${groupId}`);
    await new Promise(resolve => setTimeout(resolve, 200));

    const groupToDelete = mockGroupsData.find(g => g.id === groupId);
    if (!groupToDelete) {
        console.warn(`[Service:groups] Group ${groupId} not found for deletion.`);
        return false;
    }
    if (groupToDelete.schoolCode !== schoolCode) {
        console.warn(`[Service:groups] Admin ${adminId} from school ${schoolCode} cannot delete group ${groupId} from school ${groupToDelete.schoolCode}.`);
        return false;
    }
    
    const initialLength = mockGroupsData.length;
    mockGroupsData = mockGroupsData.filter(group => group.id !== groupId);
    const success = mockGroupsData.length < initialLength;
    if (success) {
      console.log(`[Service:groups] Group "${groupToDelete.name}" (ID: ${groupId}) deleted successfully.`);
    } else {
      console.error(`[Service:groups] Failed to delete group ${groupId}.`);
    }
    return success;
}

export async function requestToJoinGroup(groupId: string, studentId: string): Promise<boolean> {
    console.log(`[Service:groups] Student ${studentId} requesting to join group ${groupId}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    const groupIndex = mockGroupsData.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return false;

    const group = { ...mockGroupsData[groupIndex] };
    if (!group.joinRequests) group.joinRequests = [];
    if (group.studentIds.includes(studentId) || group.joinRequests.includes(studentId)) {
        console.log(`[Service:groups] Student ${studentId} already in group or request pending.`);
        return false;
    }
    group.joinRequests.push(studentId);
    mockGroupsData[groupIndex] = group;
    console.log(`[Service:groups] Group ${groupId} join requests:`, group.joinRequests);
    return true;
}

export async function fetchGroupJoinRequests(groupId: string, teacherId: string): Promise<User[]> {
    console.log(`[Service:groups] Teacher ${teacherId} fetching join requests for group ${groupId}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    const group = mockGroupsData.find(g => g.id === groupId && g.teacherIds.includes(teacherId));
    if (!group || !group.joinRequests || group.joinRequests.length === 0) return [];

    const usersModule = await import('@/services/users');
    return usersModule.fetchUsersByIds(group.joinRequests);
}

export async function approveJoinRequest(groupId: string, studentId: string, teacherId: string): Promise<boolean> {
    console.log(`[Service:groups] Teacher ${teacherId} approving join request for student ${studentId} in group ${groupId}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    const groupIndex = mockGroupsData.findIndex(g => g.id === groupId && g.teacherIds.includes(teacherId));
    if (groupIndex === -1) return false;

    const group = { ...mockGroupsData[groupIndex] };
    if (!group.joinRequests?.includes(studentId)) return false;

    group.studentIds = [...group.studentIds, studentId];
    group.joinRequests = group.joinRequests.filter(id => id !== studentId);
    mockGroupsData[groupIndex] = group;
    console.log(`[Service:groups] Student ${studentId} approved for group ${groupId}. Students: ${group.studentIds.length}, Requests: ${group.joinRequests.length}`);
    return true;
}

export async function rejectJoinRequest(groupId: string, studentId: string, teacherId: string): Promise<boolean> {
    console.log(`[Service:groups] Teacher ${teacherId} rejecting join request for student ${studentId} in group ${groupId}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    const groupIndex = mockGroupsData.findIndex(g => g.id === groupId && g.teacherIds.includes(teacherId));
    if (groupIndex === -1) return false;

    const group = { ...mockGroupsData[groupIndex] };
    if (!group.joinRequests?.includes(studentId)) return false;

    group.joinRequests = group.joinRequests.filter(id => id !== studentId);
    mockGroupsData[groupIndex] = group;
    return true;
}

export interface SchoolStats {
    totalGroups: number;
    totalStudents: number;
    studentsInAnyGroup: number;
    studentsNotInAnyGroup: number;
    totalTeachersAndAdmins: number;
    staffInAnyGroup: number; // Includes teachers and admins in groups
    staffNotInAnyGroup: number; // Includes teachers and admins not in groups
    groupMembership: Array<{ groupId: string, groupName: string, studentCount: number, teacherCount: number }>;
}

export async function getSchoolStats(schoolCode: string): Promise<SchoolStats> {
    console.log(`[Service:groups] Calculating stats for school ${schoolCode}`);
    await new Promise(resolve => setTimeout(resolve, 200));

    const usersModule = await import('@/services/users');
    const allSchoolUsers = await usersModule.fetchAllUsers(schoolCode);
    const schoolGroups = mockGroupsData.filter(g => g.schoolCode === schoolCode);

    const schoolStudents = allSchoolUsers.filter(u => u.role === 'Student');
    const schoolTeachersAndAdmins = allSchoolUsers.filter(u => u.role === 'Teacher' || u.role === 'Admin');

    const studentIdsInAnyGroup = new Set<string>();
    schoolGroups.forEach(g => g.studentIds.forEach(id => studentIdsInAnyGroup.add(id)));

    const staffIdsInAnyGroup = new Set<string>(); // Staff = Teachers + Admins
    schoolGroups.forEach(g => g.teacherIds.forEach(id => staffIdsInAnyGroup.add(id)));

    const groupMembership = schoolGroups.map(g => ({
        groupId: g.id,
        groupName: g.name,
        studentCount: g.studentIds.length,
        teacherCount: g.teacherIds.length, // This counts only those explicitly in teacherIds (admins or teachers)
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
    await new Promise(resolve => setTimeout(resolve, 100));

    const groupIndex = mockGroupsData.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
      console.warn(`[Service:groups] Group ${groupId} not found for settings update.`);
      return null;
    }

    const group = mockGroupsData[groupIndex];
    const usersModule = await import('@/services/users');
    const user = await usersModule.fetchUsersByIds([currentUserId]).then(users => users[0]);

    if (!user) {
        console.warn(`[Service:groups] User ${currentUserId} not found, cannot update group settings.`);
        return null;
    }
    // Check if user is admin of the school OR a teacher in the group's teacherIds list
    const isAdminOfSchool = user.role === 'Admin' && user.schoolCode === group.schoolCode;
    const isTeacherInGroup = (user.role === 'Teacher' || user.role === 'Admin') && group.teacherIds.includes(user.id);

    if (!isAdminOfSchool && !isTeacherInGroup) {
        console.warn(`[Service:groups] User ${currentUserId} (Role: ${user.role}) lacks permission to update group ${groupId} (School: ${group.schoolCode}, Teachers: ${group.teacherIds.join(',')}).`);
        return null;
    }

    mockGroupsData[groupIndex] = { ...group, ...settings };
    console.log(`[Service:groups] Group settings for "${group.name}" updated.`);
    return { ...mockGroupsData[groupIndex] };
}

    