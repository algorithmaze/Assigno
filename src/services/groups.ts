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
  // Future: settings like studentPostPermission: boolean, etc.
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

let mockGroupsData: Group[] = [
    // No initial groups, Antony will create one if needed for testing flow
];

/**
 * Generates a unique group code.
 * @param schoolCode The school code to prefix.
 * @returns A unique group code.
 */
function generateGroupCode(schoolCode: string): string {
    // Simple generation: schoolCode-randomSuffix
    // Ensure it's unique among existing groups (though less likely with random part)
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
    console.log("[Service:groups] All groups:", mockGroupsData.map(g => ({id: g.id, name: g.name, code: g.groupCode})));
    return { ...newGroup };
}

export async function fetchUserGroups(userId: string, userRole: 'Admin' | 'Teacher' | 'Student'): Promise<Group[]> {
    console.log(`[Service:groups] Fetching groups for user ${userId} (${userRole})`);
    await new Promise(resolve => setTimeout(resolve, 200));

    // Admin sees all groups in their school.
    // For Teacher, groups they are in teacherIds.
    // For Student, groups they are in studentIds.
    const user = await import('@/services/users').then(m => m.fetchUsersByIds([userId])).then(users => users[0]);
    if (!user) return [];

    if (userRole === 'Admin') {
        return mockGroupsData.filter(group => group.schoolCode === user.schoolCode).map(g => ({...g}));
    } else if (userRole === 'Teacher') {
        return mockGroupsData.filter(group => group.teacherIds.includes(userId)).map(g => ({...g}));
    } else if (userRole === 'Student') {
        return mockGroupsData.filter(group => group.studentIds.includes(userId)).map(g => ({...g}));
    }
    return [];
}

export async function fetchGroupDetails(groupId: string): Promise<Group | null> {
    console.log(`[Service:groups] Fetching details for group ${groupId}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    const foundGroup = mockGroupsData.find(group => group.id === groupId);
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
    if (groupIndex === -1) return false;

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
                // If student was in join requests, remove them
                groupToUpdate.joinRequests = groupToUpdate.joinRequests?.filter(id => id !== member.id);
                changed = true;
            }
        }
    });

    if (changed) {
        mockGroupsData[groupIndex] = groupToUpdate;
        console.log("[Service:groups] Updated group members:", groupToUpdate);
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

export async function deleteGroup(groupId: string, adminId: string): Promise<boolean> {
    console.log(`[Service:groups] Admin ${adminId} attempting to delete group ${groupId}`);
    await new Promise(resolve => setTimeout(resolve, 200));
    // In a real app, verify adminId has permission for the group's schoolCode
    const initialLength = mockGroupsData.length;
    mockGroupsData = mockGroupsData.filter(group => group.id !== groupId);
    return mockGroupsData.length < initialLength;
}

// --- Join Request Functions (Stubs) ---
export async function requestToJoinGroup(groupId: string, studentId: string): Promise<boolean> {
    console.log(`[Service:groups] Student ${studentId} requesting to join group ${groupId}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    const groupIndex = mockGroupsData.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return false;

    const group = { ...mockGroupsData[groupIndex] };
    if (!group.joinRequests) group.joinRequests = [];
    if (group.studentIds.includes(studentId) || group.joinRequests.includes(studentId)) {
        console.log(`[Service:groups] Student ${studentId} already in group or request pending.`);
        return false; // Or true if already a member, depending on desired UX
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


// --- School Statistics Function ---
export interface SchoolStats {
    totalGroups: number;
    totalStudents: number;
    studentsInAnyGroup: number;
    studentsNotInAnyGroup: number;
    totalTeachers: number; // Including admins who might be teachers
    teachersInAnyGroup: number;
    teachersNotInAnyGroup: number;
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

    const teacherIdsInAnyGroup = new Set<string>();
    schoolGroups.forEach(g => g.teacherIds.forEach(id => teacherIdsInAnyGroup.add(id)));

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
        totalTeachers: schoolTeachersAndAdmins.length,
        teachersInAnyGroup: teacherIdsInAnyGroup.size,
        teachersNotInAnyGroup: schoolTeachersAndAdmins.length - teacherIdsInAnyGroup.size,
        groupMembership,
    };
}

// Basic group settings update (can be expanded)
export async function updateGroupSettings(groupId: string, settings: Partial<Pick<Group, 'name' | 'description' | 'subject'>>, adminOrTeacherId: string): Promise<Group | null> {
    console.log(`[Service:groups] Updating settings for group ${groupId} by user ${adminOrTeacherId}`);
    await new Promise(resolve => setTimeout(resolve, 100));

    const groupIndex = mockGroupsData.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return null;

    // Basic permission check (admin of school or teacher in group)
    const group = mockGroupsData[groupIndex];
    const user = await import('@/services/users').then(m => m.fetchUsersByIds([adminOrTeacherId])).then(users => users[0]);
    if (!user || (user.role !== 'Admin' && !group.teacherIds.includes(adminOrTeacherId))) {
        console.warn(`[Service:groups] User ${adminOrTeacherId} lacks permission to update group ${groupId}`);
        return null;
    }
    if (user.role === 'Admin' && user.schoolCode !== group.schoolCode) {
         console.warn(`[Service:groups] Admin ${adminOrTeacherId} from different school cannot update group ${groupId}`);
         return null;
    }


    mockGroupsData[groupIndex] = { ...group, ...settings };
    return { ...mockGroupsData[groupIndex] };
}
