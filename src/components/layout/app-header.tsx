'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, Settings, Moon, Sun } from 'lucide-react'; // Import icons
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { useTheme } from '@/context/theme-context';


export function AppHeader() {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();

     const toggleTheme = () => {
       setTheme(theme === 'light' ? 'dark' : 'light');
     };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        {/* Sidebar Trigger for mobile */}
        <div className="md:hidden">
            <SidebarTrigger />
        </div>

        {/* App Title/Logo (Optional) */}
        <div className="hidden md:block">
             {/* You can add a logo or app name here */}
             <Link href="/dashboard" className="text-xl font-semibold">Assigno</Link>
        </div>


      <div className="ml-auto flex items-center gap-4">
         <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
           {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
         </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                {/* TODO: Replace with actual user profile picture */}
                <AvatarImage src={user?.profilePictureUrl || `https://picsum.photos/100/100?random=${user?.id}`} alt={user?.name} data-ai-hint="profile avatar" />
                <AvatarFallback>
                    {user?.name?.charAt(0).toUpperCase() || <UserIcon />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.name || 'User'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/profile" passHref>
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
            </Link>
            <Link href="/settings" passHref>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
