import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';

// The GeistSans object imported already contains the necessary configuration (like variable name).
// No need to call it like a function.

export const metadata: Metadata = {
  title: 'Assigno',
  description: 'School Homework Sharing App',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Use the .variable property directly from the imported GeistSans object */}
      <body className={`${GeistSans.variable} antialiased`}>
        <AuthProvider>
           <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
