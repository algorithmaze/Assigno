
import { InstituteRegistrationForm } from '@/components/auth/institute-registration-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

export default function InstituteRegistrationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-lg sm:max-w-2xl shadow-xl border-t-4 border-primary">
        <CardHeader className="text-center p-6 sm:p-8">
          <Building2 className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-primary mb-4" data-ai-hint="office building"/>
          <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">Register Your Institute</CardTitle>
          <CardDescription className="text-base sm:text-lg text-muted-foreground pt-1">
            Join Assigno by providing your institute's details.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <InstituteRegistrationForm />
          <p className="mt-6 sm:mt-8 text-center text-sm text-muted-foreground">
            Already registered or have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Login here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
