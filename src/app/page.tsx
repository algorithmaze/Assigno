'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from "@/components/ui/skeleton"; // Optional: Add a loading indicator

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard'); // Redirect logged-in users to the dashboard
      } else {
        router.replace('/login'); // Redirect non-logged-in users to login
      }
    }
  }, [user, loading, router]);

  // Optional: Show a loading state while checking auth status
  if (loading) {
    return (
       <div className="flex min-h-screen items-center justify-center">
         <div className="space-y-4 w-full max-w-sm">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/2" />
         </div>
       </div>
    );
  }

  // This part will likely not be rendered due to redirection, but it's good practice
  return null;
}
