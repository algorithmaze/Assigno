import { LoginForm } from '@/components/auth/login-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Assigno Login</CardTitle>
        <CardDescription className="text-center">
          Enter your school email or phone number to receive an OTP.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
         <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="underline text-primary">
              Sign up
            </Link>
          </p>
      </CardContent>
    </Card>
  );
}
