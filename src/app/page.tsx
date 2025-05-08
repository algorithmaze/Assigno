
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { Loader2, LogIn, Building2 } from 'lucide-react';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard'); // Redirect logged-in users to the dashboard
    }
  }, [user, loading, router]);

  if (loading) {
    return (
       <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
         <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary" />
       </div>
    );
  }

  // If user is not logged in and not loading, show the landing page
  if (!user && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="w-full max-w-md sm:max-w-lg shadow-2xl border-t-4 border-primary">
          <CardHeader className="text-center p-6 sm:p-8">
             <Building2 className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-primary mb-6" data-ai-hint="logo building" />
            <CardTitle className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Welcome to Assigno
            </CardTitle>
            <CardDescription className="text-base sm:text-lg text-muted-foreground pt-2">
              The collaborative platform for modern educational institutions.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-4 sm:space-y-6">
            <Link href="/login" passHref legacyBehavior>
              <Button className="w-full py-5 sm:py-6 text-base sm:text-lg" size="lg">
                <LogIn className="mr-2 h-5 w-5" /> Login to Your Account
              </Button>
            </Link>
            <Link href="/institute-registration" passHref legacyBehavior>
              <Button variant="outline" className="w-full py-5 sm:py-6 text-base sm:text-lg" size="lg">
                <Building2 className="mr-2 h-5 w-5" /> Register Your Institute
              </Button>
            </Link>
            <p className="text-center text-xs sm:text-sm text-muted-foreground pt-4">
              Students and Teachers: Please login or create an account if your institute is already registered.
              Account creation is available via the{' '}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Signup page
              </Link> or Login page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback for when user is defined but redirection hasn't happened yet (should be brief)
  // or if somehow user is not null but loading is false and useEffect hasn't redirected.
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary" />
    </div>
  );
}

