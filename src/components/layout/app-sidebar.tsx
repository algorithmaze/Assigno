'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Megaphone,
  Settings,
  UserCircle,
  LogOut,
  School,
  BookUser,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Button } from '../ui/button';


// Helper function to determine if a path is active
const isActive = (pathname: string, href: string) => {
  if (href === '/dashboard') {
    return pathname === href; // Exact match for dashboard
  }
  return pathname.startsWith(href); // Starts with for others
};


export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === 'Admin';
  const isTeacher = user?.role === 'Teacher';
  const isStudent = user?.role === 'Student';

  return (
    <>
      <SidebarHeader className="flex items-center justify-between">
         <Link href="/dashboard" className="text-lg font-semibold px-2 group-data-[collapsible=icon]:hidden">
            Assigno
         </Link>
         <div className="hidden md:block">
             <SidebarTrigger />
         </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-auto">
        <SidebarMenu>
          {/* Common Links */}
          <SidebarMenuItem>
            <Link href="/dashboard" passHref legacyBehavior>
              <SidebarMenuButton asChild isActive={isActive(pathname, '/dashboard')} tooltip="Dashboard">
                <a><LayoutDashboard /> <span>Dashboard</span></a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link href="/groups" passHref legacyBehavior>
              <SidebarMenuButton asChild isActive={isActive(pathname, '/groups')} tooltip="Groups">
                <a><Users /> <span>Groups</span></a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

           <SidebarMenuItem>
            <Link href="/announcements" passHref legacyBehavior>
              <SidebarMenuButton asChild isActive={isActive(pathname, '/announcements')} tooltip="Announcements">
                <a><Megaphone /> <span>Announcements</span></a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

            <SidebarMenuItem>
                <Link href="/teachers" passHref legacyBehavior>
                <SidebarMenuButton asChild isActive={isActive(pathname, '/teachers')} tooltip="Teachers & Admins">
                    <a><BookUser /> <span>Teachers & Admins</span></a>
                </SidebarMenuButton>
                </Link>
           </SidebarMenuItem>


           {/* Admin Specific Links */}
           {isAdmin && (
            <>
                <SidebarSeparator />
                 <SidebarMenuItem>
                    <Link href="/admin/users" passHref legacyBehavior>
                    <SidebarMenuButton asChild isActive={isActive(pathname, '/admin/users')} tooltip="Manage Users">
                        <a><UserCircle /> <span>Manage Users</span></a>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/admin/groups" passHref legacyBehavior>
                    <SidebarMenuButton asChild isActive={isActive(pathname, '/admin/groups')} tooltip="Manage Groups">
                        <a><Users /> <span>Manage Groups</span></a>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/admin/school" passHref legacyBehavior>
                    <SidebarMenuButton asChild isActive={isActive(pathname, '/admin/school')} tooltip="School Settings">
                        <a><School /> <span>School Settings</span></a>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </>
           )}

            {/* Teacher Specific Links */}
           {isTeacher && (
            <>
                <SidebarSeparator />
                 <SidebarMenuItem>
                    <Link href="/teacher/requests" passHref legacyBehavior>
                    <SidebarMenuButton asChild isActive={isActive(pathname, '/teacher/requests')} tooltip="Join Requests">
                        <a><ClipboardList /> <span>Join Requests</span></a>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </>
           )}


           {/* Student Specific Links - Maybe Chat History? */}
            {/* {isStudent && (
            <>
                <SidebarSeparator />
                 <SidebarMenuItem>
                    <Link href="/student/chats" passHref legacyBehavior>
                    <SidebarMenuButton asChild isActive={isActive(pathname, '/student/chats')} tooltip="My Chats">
                        <a><MessageSquare /> <span>My Chats</span></a>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </>
           )} */}

        </SidebarMenu>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-2">
         <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/profile" passHref legacyBehavior>
                    <SidebarMenuButton asChild isActive={isActive(pathname, '/profile')} tooltip="Profile">
                       <a> <UserCircle /> <span>Profile</span> </a>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <Link href="/settings" passHref legacyBehavior>
                    <SidebarMenuButton asChild isActive={isActive(pathname, '/settings')} tooltip="Settings">
                        <a><Settings /> <span>Settings</span></a>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton onClick={logout} tooltip="Logout">
                    <LogOut /> <span>Logout</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>

      </SidebarFooter>
    </>
  );
}
