import { LoginForm } from '@/components/auth/login-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Building } from 'lucide-react'; // Icon for branding

export default function LoginPage() {
  return (
    <Card className="shadow-xl border-t-4 border-primary w-full max-w-lg">
      <CardHeader className="text-center p-8">
        <div className="mx-auto mb-4 text-primary">
             <Building size={48}/>
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight">Welcome to Assigno</CardTitle>
        <CardDescription className="text-lg text-muted-foreground pt-1">
          Sign in to connect with your school community.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        <LoginForm />
         <p className="mt-8 text-center text-sm text-muted-foreground">
            New to Assigno?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
      </CardContent>
    </Card>
  );
}
