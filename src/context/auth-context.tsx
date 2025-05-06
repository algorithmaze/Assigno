
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Define the user data structure
// Add fields as needed based on your backend response
export interface User {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  role: 'Student' | 'Teacher' | 'Admin';
  profilePictureUrl?: string;
  schoolCode: string;
  schoolName?: string; // Added school name
  schoolAddress?: string; // Added school address
  admissionNumber?: string; // Only for students
  class?: string; // For students and optionally teachers
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'assigno_user';
const AUTH_PROTECTED_ROUTES_PREFIX = '/'; // Protect all routes under /app by default
const AUTH_PUBLIC_ROUTES = ['/login', '/signup']; // Routes accessible without login


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start loading until we check storage/API
  const router = useRouter();
  const pathname = usePathname();


  // Check for user session on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        // TODO: Optionally verify token/session with backend here
        // Ensure schoolName and schoolAddress are loaded if they exist
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

   // Redirect logic based on auth state and route
  useEffect(() => {
    if (loading) return; // Don't redirect while loading

    const isPublicRoute = AUTH_PUBLIC_ROUTES.includes(pathname);
    const isProtectedRoute = pathname.startsWith(AUTH_PROTECTED_ROUTES_PREFIX) && !isPublicRoute;

    if (!user && isProtectedRoute) {
      // If not logged in and trying to access protected route, redirect to login
      router.replace('/login');
    } else if (user && isPublicRoute) {
       // If logged in and trying to access public auth route, redirect to dashboard
       router.replace('/dashboard');
    }
     // No redirection needed if:
     // - User is logged in and on a protected route
     // - User is not logged in and on a public route

  }, [user, loading, pathname, router]);


  const login = useCallback(async (userData: User) => {
     console.log("Logging in user with data:", userData); // Debug log
    // Ensure school details are included before setting state and storage
    const completeUserData = {
        ...userData,
        // Fetch school details if missing? Or ensure they are always passed in.
        // For now, assume userData includes them if available.
    };
    setUser(completeUserData);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(completeUserData));
    // No need to router.push here, the useEffect above will handle redirection
  }, []);

  const logout = useCallback(async () => {
    // TODO: Call backend logout API if necessary (e.g., invalidate token)
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
     router.replace('/login'); // Explicitly redirect to login on logout
  }, [router]);


  const value = { user, loading, login, logout };

  return (
     <AuthContext.Provider value={value}>
        {/* Render children only after loading is complete and redirection logic has potentially run */}
        {/* Or show a global loader based on `loading` state */}
        {!loading ? children : null /* Or your global loading indicator */}
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
