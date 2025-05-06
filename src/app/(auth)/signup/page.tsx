import { SignupForm } from '@/components/auth/signup-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Create an Assigno Account</CardTitle>
        <CardDescription className="text-center">
          Enter your details to sign up.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
         <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="underline text-primary">
              Login
            </Link>
          </p>
      </CardContent>
    </Card>
  );
}
