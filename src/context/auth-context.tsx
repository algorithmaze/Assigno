
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
  schoolName?: string;
  schoolAddress?: string;
  admissionNumber?: string; // Only for students
  class?: string; // For students and optionally teachers
  // Add any other fields relevant to the user profile
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUserSession: (updatedUserData: Partial<User>) => Promise<void>; // For profile updates
  deleteAccount: () => Promise<boolean>; // For account deletion
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'assigno_user';
const AUTH_PROTECTED_ROUTES_PREFIX = '/';
const AUTH_PUBLIC_ROUTES = ['/login', '/signup'];


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();


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
    console.log("Logging in user with data:", userData);
    const completeUserData = { ...userData };
    setUser(completeUserData);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(completeUserData));
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
     router.replace('/login');
  }, [router]);

  const updateUserSession = useCallback(async (updatedUserData: Partial<User>) => {
    if (user) {
      const newUserData = { ...user, ...updatedUserData };
      setUser(newUserData);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUserData));
      console.log("User session updated:", newUserData);
    }
  }, [user]);

  const deleteAccount = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    // Simulate backend call
    console.log(`Simulating account deletion for user: ${user.id}`);
    // In a real app, call usersService.deleteUser(user.id)
    await new Promise(resolve => setTimeout(resolve, 500));
    logout(); // Log out after "deletion"
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

