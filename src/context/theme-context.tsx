'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context'; // Import useAuth

type Theme = 'light' | 'dark';
type RoleTheme = 'theme-admin' | 'theme-teacher' | 'theme-student' | ''; // Specific role themes

interface ThemeContextType {
  theme: Theme;
  roleTheme: RoleTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'assigno_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light'); // Default to light
  const [roleTheme, setRoleTheme] = useState<RoleTheme>('');
  const { user } = useAuth(); // Get user from AuthContext


   // Effect to load theme preference from storage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
     const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

     if (storedTheme) {
        setThemeState(storedTheme);
     } else {
        // Set theme based on system preference if no stored theme
        setThemeState(prefersDark ? 'dark' : 'light');
     }
  }, []);


  // Effect to update role theme based on authenticated user
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'Admin':
          setRoleTheme('theme-admin');
          break;
        case 'Teacher':
          setRoleTheme('theme-teacher');
          break;
        case 'Student':
          setRoleTheme('theme-student');
          break;
        default:
          setRoleTheme('');
      }
    } else {
      setRoleTheme(''); // Clear role theme if no user
    }
  }, [user]);


   // Effect to apply theme classes to the HTML element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'theme-admin', 'theme-teacher', 'theme-student');

    // Add base theme class (light/dark)
    root.classList.add(theme);

    // Add role-specific theme class if applicable
    if (roleTheme) {
      root.classList.add(roleTheme);
    }

  }, [theme, roleTheme]);


  const setTheme = useCallback((newTheme: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    setThemeState(newTheme);
  }, []);


  const value = { theme, roleTheme, setTheme };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
