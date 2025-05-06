
// TODO: Firebase - Import necessary Firebase modules (e.g., getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs)
// import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
// import { db } from '@/lib/firebase'; // Assuming you have a firebase.ts setup file

import type { User } from '@/context/auth-context';
import { sampleCredentials } from './otp';
import { getSchoolDetails } from './school';


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


let mockUsersData: User[] = [];
let isMockDataInitialized = false;

async function initializeMockUsers() {
    if (isMockDataInitialized) return;

    const transformedUsers = await Promise.all(
        Object.values(sampleCredentials).map(cred => transformToUser(cred))
    );

    const additionalUsersRaw = [
        {
            id: 'teacher-extra-004',
            name: 'Nina Teacher',
            email: 'nina@school.com',
            role: 'Teacher' as 'Teacher',
            schoolCode: 'samp123',
            class: 'Class 12 Arts',
            profilePictureUrl: `https://picsum.photos/100/100?random=teacher-extra-004`,
        },
        {
            id: 'student-extra-004',
            name: 'Leo Student (Extra)', 
            email: 'leo.student@school.com',
            role: 'Student' as 'Student',
            schoolCode: 'samp123',
            admissionNumber: 'SAMP9004',
            class: 'Class 5A',
            profilePictureUrl: `https://picsum.photos/100/100?random=student-extra-004`,
        },
         {
            id: 'teacher-extra-005',
            name: 'Sam Teacher',
            email: 'sam@school.com',
            role: 'Teacher' as 'Teacher',
            schoolCode: 'samp123',
            class: 'Class 7 Social Studies',
            profilePictureUrl: `https://picsum.photos/100/100?random=teacher-extra-005`,
        },
        {
            id: 'student-extra-005',
            name: 'Grace Student',
            email: 'grace@school.com',
            role: 'Student'as 'Student',
            schoolCode: 'samp123',
            admissionNumber: 'SAMP9005',
            class: 'Class 9C',
            profilePictureUrl: `https://picsum.photos/100/100?random=student-extra-005`,
        },
    ];

    const additionalTransformedUsers = await Promise.all(
        additionalUsersRaw.map(async (rawUser) => {
            const schoolDetails = await getSchoolDetails(rawUser.schoolCode);
            return {
                ...rawUser,
                schoolName: schoolDetails?.schoolName,
                schoolAddress: schoolDetails?.address,
                phoneNumber: undefined, 
                admissionNumber: rawUser.role === 'Student' ? rawUser.admissionNumber : undefined,
                profilePictureUrl: rawUser.profilePictureUrl || `https://picsum.photos/100/100?random=${rawUser.id}`,
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

initializeMockUsers();


export async function fetchUsersByIds(userIds: string[]): Promise<User[]> {
    await initializeMockUsers(); 
    console.log(`[Service:users] Fetching users by IDs: ${userIds.join(', ')}`);
    // TODO: Firebase - Replace with multiple getDoc calls or a more efficient Firestore query if possible (e.g., IN query for up to 30 IDs)
    // const firestore = getFirestore();
    // const usersPromises = userIds.map(id => getDoc(doc(firestore, 'users', id)));
    // const userDocs = await Promise.all(usersPromises);
    // const users = userDocs.filter(docSnap => docSnap.exists()).map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as User));
    // console.log(`[Service:users] Found ${users.length} users for IDs from Firestore: ${userIds.join(', ')}`);
    // return users;

    // --- Mock implementation ---
    await new Promise(resolve => setTimeout(resolve, 50)); 
    const users = mockUsersData.filter(user => userIds.includes(user.id));
    console.log(`[Service:users] Found ${users.length} users for IDs (mock): ${userIds.join(', ')}`);
    return users.map(u => ({...u})); 
    // --- End mock implementation ---
}

export async function searchUsers(schoolCode: string, searchTerm: string, excludeIds: string[] = []): Promise<User[]> {
    await initializeMockUsers();
    console.log(`[Service:users] User search. Term: "${searchTerm}", School: "${schoolCode}", Excluding: ${excludeIds.length} IDs`);
    // TODO: Firebase - Replace with Firestore query. This is complex to replicate exactly with client-side filtering.
    // Firestore queries for searching parts of strings typically require a third-party search service like Algolia or Typesense,
    // or careful data structuring (e.g., storing keywords in an array).
    // A simple Firestore query might look like:
    // const firestore = getFirestore();
    // const usersCol = collection(firestore, 'users');
    // let q = query(usersCol, where('schoolCode', '==', schoolCode));
    // // Further filtering by searchTerm and excludeIds would be done client-side on the results, or by structuring data for search.
    // const snapshot = await getDocs(q);
    // let results = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as User));
    // results = results.filter(user => !excludeIds.includes(user.id) && 
    //    (user.name.toLowerCase().includes(lowerSearchTerm) || (user.email && user.email.toLowerCase().includes(lowerSearchTerm)))
    // );

    // --- Mock implementation ---
    await new Promise(resolve => setTimeout(resolve, 100));
    const lowerSearchTerm = searchTerm.trim().toLowerCase();
    const filterByTerm = lowerSearchTerm.length > 0;
    const results = mockUsersData.filter(user => {
        const matchesSchool = user.schoolCode === schoolCode;
        const isExcluded = excludeIds.includes(user.id);
        if (!matchesSchool || isExcluded) {
            return false;
        }
        if (!filterByTerm && excludeIds.length === 0) { 
             return true;
        }
         if (!filterByTerm && excludeIds.length > 0) { 
             return true; 
        }
        const matchesName = user.name.toLowerCase().includes(lowerSearchTerm);
        const matchesEmail = user.email && user.email.toLowerCase().includes(lowerSearchTerm);
        return matchesName || matchesEmail;
    });
    console.log(`[Service:users] Found ${results.length} users matching criteria (mock).`);
    return results.map(u => ({...u}));
    // --- End mock implementation ---
}

export async function addUser(user: User): Promise<User> {
    await initializeMockUsers();
    console.log("[Service:users] Adding user:", user.name);
    // TODO: Firebase - Replace with Firestore setDoc (if ID is known, e.g., auth UID) or addDoc
    // const firestore = getFirestore();
    // const userRef = doc(firestore, 'users', user.id); // Assuming user.id is the auth UID
    // await setDoc(userRef, user); // Use setDoc to create or overwrite
    // console.log("[Service:users] Added user to Firestore:", user.name);
    // return user;

    // --- Mock implementation ---
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
        console.log("[Service:users] User already exists, not adding (mock):", user.id);
        return mockUsersData.find(u => u.id === user.id)!; 
    }
    // --- End mock implementation ---
}

export async function fetchAllUsers(schoolCode: string): Promise<User[]> {
     await initializeMockUsers();
     console.log(`[Service:users] Fetching all users for school "${schoolCode}"`);
     // TODO: Firebase - Replace with Firestore query
     // const firestore = getFirestore();
     // const usersCol = collection(firestore, 'users');
     // const q = query(usersCol, where('schoolCode', '==', schoolCode));
     // const snapshot = await getDocs(q);
     // const users = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as User));
     // console.log(`[Service:users] Found ${users.length} users in school ${schoolCode} from Firestore.`);
     // return users;

     // --- Mock implementation ---
     await new Promise(resolve => setTimeout(resolve, 50));
     const users = mockUsersData.filter(user => user.schoolCode === schoolCode);
     console.log(`[Service:users] Found ${users.length} users in school ${schoolCode} (mock).`);
     return users.map(u => ({...u}));
     // --- End mock implementation ---
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    await initializeMockUsers();
    console.log(`[Service:users] Updating user ${userId} with data:`, updates);
    // TODO: Firebase - Replace with Firestore updateDoc
    // const firestore = getFirestore();
    // const userRef = doc(firestore, 'users', userId);
    // await updateDoc(userRef, updates);
    // const updatedUserSnap = await getDoc(userRef);
    // if (!updatedUserSnap.exists()) return null;
    // const updatedUser = {id: updatedUserSnap.id, ...updatedUserSnap.data()} as User;
    // console.log("[Service:users] Updated user in Firestore:", updatedUser.name);
    // return updatedUser;

    // --- Mock implementation ---
    await new Promise(resolve => setTimeout(resolve, 100));
    const userIndex = mockUsersData.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        console.error(`[Service:users] User ${userId} not found for update (mock).`);
        return null;
    }
    mockUsersData[userIndex] = { ...mockUsersData[userIndex], ...updates };
    console.log("[Service:users] Updated user (mock):", mockUsersData[userIndex].name);
    return { ...mockUsersData[userIndex] }; 
    // --- End mock implementation ---
}

export async function deleteUser(userId: string): Promise<boolean> {
    await initializeMockUsers();
    console.log(`[Service:users] Deleting user ${userId}`);
    // TODO: Firebase - Replace with Firestore deleteDoc
    // const firestore = getFirestore();
    // const userRef = doc(firestore, 'users', userId);
    // await deleteDoc(userRef);
    // console.log(`[Service:users] User ${userId} deleted successfully from Firestore.`);
    // // TODO: Firebase - Implement additional cleanup in Firestore (e.g., remove from groups' member arrays using batched writes or cloud functions)
    // return true;

    // --- Mock implementation ---
    await new Promise(resolve => setTimeout(resolve, 100));
    const initialLength = mockUsersData.length;
    mockUsersData = mockUsersData.filter(u => u.id !== userId);
    if (mockUsersData.length < initialLength) {
        console.log(`[Service:users] User ${userId} deleted successfully (mock).`);
        return true;
    } else {
        console.error(`[Service:users] User ${userId} not found for deletion (mock).`);
        return false;
    }
    // --- End mock implementation ---
}
