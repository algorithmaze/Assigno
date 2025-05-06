// TODO: Firebase - Import necessary Firebase modules (e.g., getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs)
// import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
// import { db } from '@/lib/firebase'; // Assuming you have a firebase.ts setup file

import type { User } from '@/context/auth-context';
import type { sampleCredentials as SampleCredentialsType } from './otp'; // Import type
import { getSchoolDetails } from './school';

// Use a global variable for mock data in non-production environments
declare global {
  var mockUsersData_assigno_users: User[] | undefined;
  var mockUsersInitialized_assigno_users: boolean | undefined;
}


let mockUsersData: User[] = globalThis.mockUsersData_assigno_users || [];
let isMockDataInitialized = globalThis.mockUsersInitialized_assigno_users || false;

if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    if (!globalThis.mockUsersData_assigno_users) {
        globalThis.mockUsersData_assigno_users = [];
    }
    if (globalThis.mockUsersInitialized_assigno_users === undefined) {
        globalThis.mockUsersInitialized_assigno_users = false;
    }
    mockUsersData = globalThis.mockUsersData_assigno_users;
    isMockDataInitialized = globalThis.mockUsersInitialized_assigno_users;
}


async function transformCredentialToUser(cred: SampleCredentialsType[keyof SampleCredentialsType]): Promise<User> {
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

// This function will be called from otp.ts to initialize users based on sampleCredentials
export async function initializeMockUsersWithCredentials(credentials: SampleCredentialsType) {
    if (isMockDataInitialized) return;

    console.log("[Service:users] Initializing mock users from OTP credentials...");
    const transformedUsers = await Promise.all(
        Object.values(credentials).map(cred => transformCredentialToUser(cred))
    );
    
    const uniqueUsersMap = new Map<string, User>();
    transformedUsers.forEach(user => {
        if (!uniqueUsersMap.has(user.id)) {
            uniqueUsersMap.set(user.id, user);
        }
    });
    
    mockUsersData.splice(0, mockUsersData.length, ...Array.from(uniqueUsersMap.values())); // Replace current mock data
    
    isMockDataInitialized = true;
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
        globalThis.mockUsersData_assigno_users = mockUsersData;
        globalThis.mockUsersInitialized_assigno_users = isMockDataInitialized;
    }
    console.log("[Service:users] Initialized mock users:", mockUsersData.length, mockUsersData.map(u => `${u.name} (${u.role})`));
}


export async function fetchUsersByIds(userIds: string[]): Promise<User[]> {
    if (!isMockDataInitialized) {
        console.warn("[Service:users] Mock data not initialized in fetchUsersByIds. This might happen if otp.ts didn't call initializeMockUsersWithCredentials yet.");
        // Attempt to initialize if running in a context where credentials might be available (e.g. client-side dev)
        // This is a fallback, ideally otp.ts handles initialization.
         if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
            const otpService = await import('./otp');
            await initializeMockUsersWithCredentials(otpService.sampleCredentials);
        }
    }
    console.log(`[Service:users] Fetching users by IDs: ${userIds.join(', ')}`);
    // TODO: Firebase - Replace with multiple getDoc calls or a more efficient Firestore query if possible (e.g., IN query for up to 30 IDs)
    // const firestore = getFirestore();
    // const usersPromises = userIds.map(id => getDoc(doc(firestore, 'users', id)));
    // const userDocs = await Promise.all(usersPromises);
    // const users = userDocs.filter(docSnap => docSnap.exists()).map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as User));
    // console.log(`[Service:users] Found ${users.length} users for IDs from Firestore: ${userIds.join(', ')}`);
    // return users;

    // --- Mock implementation ---
    await new Promise(resolve => setTimeout(resolve, 10)); // Reduced delay
    const users = mockUsersData.filter(user => userIds.includes(user.id));
    console.log(`[Service:users] Found ${users.length} users for IDs (mock): ${userIds.join(', ')}`);
    return users.map(u => ({...u})); 
    // --- End mock implementation ---
}

export async function searchUsers(schoolCode: string, searchTerm: string, excludeIds: string[] = []): Promise<User[]> {
    if (!isMockDataInitialized) {
       console.warn("[Service:users] Mock data not initialized in searchUsers.");
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
            const otpService = await import('./otp');
            await initializeMockUsersWithCredentials(otpService.sampleCredentials);
        }
    }
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
    await new Promise(resolve => setTimeout(resolve, 10)); // Reduced delay
    const lowerSearchTerm = searchTerm.trim().toLowerCase();
    const filterByTerm = lowerSearchTerm.length > 0;
    const results = mockUsersData.filter(user => {
        const matchesSchool = user.schoolCode === schoolCode;
        const isExcluded = excludeIds.includes(user.id);
        if (!matchesSchool || isExcluded) {
            return false;
        }
        if (!filterByTerm) { // If no search term, return all non-excluded users from the school
             return true; 
        }
        // If there is a search term, filter by it
        const matchesName = user.name.toLowerCase().includes(lowerSearchTerm);
        const matchesEmail = user.email && user.email.toLowerCase().includes(lowerSearchTerm);
        return matchesName || matchesEmail;
    });
    console.log(`[Service:users] Found ${results.length} users matching criteria (mock).`);
    return results.map(u => ({...u}));
    // --- End mock implementation ---
}

export async function addUser(user: User): Promise<User> {
    if (!isMockDataInitialized) {
        console.warn("[Service:users] Mock data not initialized in addUser.");
         if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
            const otpService = await import('./otp');
            await initializeMockUsersWithCredentials(otpService.sampleCredentials);
        }
    }
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
        if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
            globalThis.mockUsersData_assigno_users = mockUsersData;
        }
        console.log("[Service:users] Added mock user:", userToAdd.name);
        return {...userToAdd};
    } else {
        console.log("[Service:users] User already exists, not adding (mock):", user.id);
        return mockUsersData.find(u => u.id === user.id)!; 
    }
    // --- End mock implementation ---
}

export async function fetchAllUsers(schoolCode: string): Promise<User[]> {
     if (!isMockDataInitialized) {
        console.warn("[Service:users] Mock data not initialized in fetchAllUsers.");
         if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
            const otpService = await import('./otp');
            await initializeMockUsersWithCredentials(otpService.sampleCredentials);
        }
     }
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
     await new Promise(resolve => setTimeout(resolve, 10)); // Reduced delay
     const users = mockUsersData.filter(user => user.schoolCode === schoolCode);
     console.log(`[Service:users] Found ${users.length} users in school ${schoolCode} (mock).`);
     return users.map(u => ({...u}));
     // --- End mock implementation ---
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    if (!isMockDataInitialized) {
        console.warn("[Service:users] Mock data not initialized in updateUser.");
         if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
            const otpService = await import('./otp');
            await initializeMockUsersWithCredentials(otpService.sampleCredentials);
        }
    }
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
    await new Promise(resolve => setTimeout(resolve, 10)); // Reduced delay
    const userIndex = mockUsersData.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        console.error(`[Service:users] User ${userId} not found for update (mock).`);
        return null;
    }
    mockUsersData[userIndex] = { ...mockUsersData[userIndex], ...updates };
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
        globalThis.mockUsersData_assigno_users = mockUsersData;
    }
    console.log("[Service:users] Updated user (mock):", mockUsersData[userIndex].name);
    return { ...mockUsersData[userIndex] }; 
    // --- End mock implementation ---
}

export async function deleteUser(userId: string): Promise<boolean> {
    if (!isMockDataInitialized) {
        console.warn("[Service:users] Mock data not initialized in deleteUser.");
         if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
            const otpService = await import('./otp');
            await initializeMockUsersWithCredentials(otpService.sampleCredentials);
        }
    }
    console.log(`[Service:users] Deleting user ${userId}`);
    // TODO: Firebase - Replace with Firestore deleteDoc
    // const firestore = getFirestore();
    // const userRef = doc(firestore, 'users', userId);
    // await deleteDoc(userRef);
    // console.log(`[Service:users] User ${userId} deleted successfully from Firestore.`);
    // // TODO: Firebase - Implement additional cleanup in Firestore (e.g., remove from groups' member arrays using batched writes or cloud functions)
    // return true;

    // --- Mock implementation ---
    await new Promise(resolve => setTimeout(resolve, 10)); // Reduced delay
    const initialLength = mockUsersData.length;
    mockUsersData = mockUsersData.filter(u => u.id !== userId);
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
        globalThis.mockUsersData_assigno_users = mockUsersData;
    }
    if (mockUsersData.length < initialLength) {
        console.log(`[Service:users] User ${userId} deleted successfully (mock).`);
        return true;
    } else {
        console.error(`[Service:users] User ${userId} not found for deletion (mock).`);
        return false;
    }
    // --- End mock implementation ---
}

// Ensure mock data is initialized if accessed directly by other modules on client side.
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && !isMockDataInitialized) {
    console.log("[Service:users] Attempting late initialization of mock users...");
    (async () => {
        try {
            const otpService = await import('./otp');
            await initializeMockUsersWithCredentials(otpService.sampleCredentials);
        } catch (e) {
            console.error("Late initialization of mock users failed:", e);
        }
    })();
}
