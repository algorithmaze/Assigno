import { LoginForm } from '@/components/auth/login-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Building, School, Users } from 'lucide-react';

export default function LoginPage() {
  return (
    <Card className="shadow-xl border-t-4 border-primary w-full max-w-md mx-auto">
      <CardHeader className="text-center p-6 sm:p-8">
        <div className="mx-auto mb-4 text-primary">
             <Building size={40} className="sm:size-48"/>
        </div>
        <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome to Assigno</CardTitle>
        <CardDescription className="text-base sm:text-lg text-muted-foreground pt-1">
          Sign in to connect with your school community.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        <LoginForm />
         <p className="mt-6 sm:mt-8 text-center text-sm text-muted-foreground">
            New to Assigno?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
          <p className="mt-3 sm:mt-4 text-center text-sm text-muted-foreground">
            Is your institute not yet registered?{' '}
            <Link href="/institute-registration" className="font-semibold text-primary hover:underline flex items-center justify-center">
              <School className="mr-1 h-4 w-4" /> Register Your Institute
            </Link>
          </p>
      </CardContent>
    </Card>
  );
}
