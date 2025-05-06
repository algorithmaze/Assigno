
'use client';

// TODO: Firebase - Import Firebase Auth related functions if using Firebase Authentication
// import { getAuth, onAuthStateChanged, signOut, deleteUser as deleteFirebaseAuthUser } from 'firebase/auth';
// import { app as firebaseApp } from '@/lib/firebase'; // Assuming firebase.ts exports the initialized app

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  id: string; // This would typically be the Firebase Auth UID
  name: string;
  email?: string;
  phoneNumber?: string;
  role: 'Student' | 'Teacher' | 'Admin';
  profilePictureUrl?: string;
  schoolCode: string;
  schoolName?: string;
  schoolAddress?: string;
  admissionNumber?: string; 
  class?: string; // For Students: their class (e.g., "10A"). For Teachers: classes they handle (e.g., "10A, 9B")
  designation?: string; // For Teachers: "Class Teacher" or "Subject Teacher"
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => Promise<void>; // userData would be fetched from Firestore after auth
  logout: () => Promise<void>;
  updateUserSession: (updatedUserData: Partial<User>) => Promise<void>; 
  deleteAccount: () => Promise<boolean>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// TODO: Firebase - If using Firebase Auth, localStorage might not be needed for the primary user object,
// as Firebase Auth SDK handles session persistence. You'd still store app-specific user details from Firestore.
const AUTH_STORAGE_KEY = 'assigno_user_details'; // Changed key to reflect it's app user details
const AUTH_PROTECTED_ROUTES_PREFIX = '/';
const AUTH_PUBLIC_ROUTES = ['/login', '/signup'];


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); // This would be your app-specific User object from Firestore
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // TODO: Firebase - Replace localStorage with Firebase Auth listener and Firestore fetch
  // useEffect(() => {
  //   const auth = getAuth(firebaseApp);
  //   const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
  //     if (firebaseUser) {
  //       // User is signed in, fetch their details from Firestore
  //       const userDoc = await fetchUserFromFirestore(firebaseUser.uid); // Implement this function
  //       if (userDoc) {
  //         setUser(userDoc);
  //       } else {
  //         // Handle case where user exists in Auth but not Firestore (e.g., incomplete signup)
  //         setUser(null); 
  //         // Optionally sign them out of Firebase Auth here or redirect to complete profile
  //       }
  //     } else {
  //       // User is signed out
  //       setUser(null);
  //     }
  //     setLoading(false);
  //   });
  //   return () => unsubscribe(); // Cleanup subscription on unmount
  // }, []);

  // Current mock/localStorage implementation
  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);


  useEffect(() => {
    if (loading) return;

    const isPublicRoute = AUTH_PUBLIC_ROUTES.includes(pathname);
    const isAppRoute = pathname.startsWith(AUTH_PROTECTED_ROUTES_PREFIX) && !isPublicRoute;

    if (!user && isAppRoute) {
      router.replace('/login');
    } else if (user && isPublicRoute) {
       router.replace('/dashboard');
    }
  }, [user, loading, pathname, router]);


  const login = useCallback(async (userData: User) => {
    console.log("Storing user details:", userData);
    // TODO: Firebase - This function would be called *after* successful Firebase Auth login.
    // It would mainly be responsible for setting the app-specific user state.
    // Firebase Auth SDK handles the actual login token.
    setUser(userData);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData)); // Store app user details
  }, []);

  const logout = useCallback(async () => {
    // TODO: Firebase - Call Firebase Auth signOut
    // const auth = getAuth(firebaseApp);
    // await signOut(auth);
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    router.replace('/login');
  }, [router]);

  const updateUserSession = useCallback(async (updatedUserData: Partial<User>) => {
    // TODO: Firebase - User data updates should primarily happen in Firestore.
    // This function would update the local state and localStorage if still used for caching.
    // The source of truth for user profile is Firestore.
    if (user) {
      const newUserData = { ...user, ...updatedUserData };
      setUser(newUserData);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUserData));
      console.log("User session updated (local cache):", newUserData);
    }
  }, [user]);

  const deleteAccount = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    // TODO: Firebase - Implement full account deletion
    // 1. Delete user from Firebase Authentication:
    //    const auth = getAuth(firebaseApp);
    //    const firebaseUser = auth.currentUser;
    //    if (firebaseUser && firebaseUser.uid === user.id) { // Ensure it's the current user
    //        await deleteFirebaseAuthUser(firebaseUser); // This might require re-authentication
    //    } else { throw new Error("User mismatch or not authenticated for deletion."); }
    // 2. Delete user document from Firestore 'users' collection.
    //    await deleteUserFromFirestore(user.id); // Implement this
    // 3. Delete user's content or anonymize (e.g., messages, posts in groups - complex operation, often done via Cloud Functions).
    console.log(`Simulating account deletion for user: ${user.id}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    await logout(); 
    return true;
  }, [user, logout]);


  const value = { user, loading, login, logout, updateUserSession, deleteAccount };

  return (
     <AuthContext.Provider value={value}>
        {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Example placeholder for fetching user from Firestore
// async function fetchUserFromFirestore(uid: string): Promise<User | null> {
//   const firestore = getFirestore();
//   const userRef = doc(firestore, 'users', uid);
//   const docSnap = await getDoc(userRef);
//   if (docSnap.exists()) {
//     return { id: docSnap.id, ...docSnap.data() } as User;
//   }
//   return null;
// }
