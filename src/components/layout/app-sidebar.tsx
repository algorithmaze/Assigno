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
  Megaphone,
  Settings,
  UserCircle,
  LogOut,
  School,
  BookUser,
  ClipboardList, // For Join Requests
  ShieldCheck, // For Admin specific section
  PlusCircle, // For Create User/Group by Admin
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';


// Helper function to determine if a path is active
const isActive = (pathname: string, href: string, exact: boolean = false) => {
  if (exact) {
    return pathname === href;
  }
  return pathname.startsWith(href);
};


export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === 'Admin';
  const isTeacher = user?.role === 'Teacher';
  // const isStudent = user?.role === 'Student';

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
              <SidebarMenuButton asChild isActive={isActive(pathname, '/dashboard', true)} tooltip="Dashboard">
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
                    <a><BookUser /> <span>Staff Directory</span></a>
                </SidebarMenuButton>
                </Link>
           </SidebarMenuItem>


           {/* Teacher & Admin Specific Links */}
           {(isTeacher || isAdmin) && (
            <>
                {/* <SidebarSeparator /> */}
                 <SidebarMenuItem>
                    <Link href="/teacher/requests" passHref legacyBehavior>
                    <SidebarMenuButton asChild isActive={isActive(pathname, '/teacher/requests')} tooltip="Group Join Requests">
                        <a><ClipboardList /> <span>Join Requests</span></a>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </>
           )}


           {/* Admin Specific Section */}
           {isAdmin && (
            <>
                <SidebarSeparator />
                 <SidebarMenuItem className="mt-2 mb-1 px-2 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
                    Admin Panel
                 </SidebarMenuItem>
                 <SidebarMenuItem>
                    <Link href="/admin/users" passHref legacyBehavior>
                    <SidebarMenuButton asChild isActive={isActive(pathname, '/admin/users')} tooltip="Manage Users">
                        <a><UserCircle /> <span>Manage Users</span></a>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                 {/* Admins can create groups from the main /groups page now, consistent with teachers if they could create
                 <SidebarMenuItem>
                    <Link href="/groups/create" passHref legacyBehavior>
                    <SidebarMenuButton asChild isActive={isActive(pathname, '/groups/create')} tooltip="Create New Group">
                        <a><PlusCircle /> <span>Create Group</span></a>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem> */}
                <SidebarMenuItem>
                    <Link href="/admin/school" passHref legacyBehavior>
                    <SidebarMenuButton asChild isActive={isActive(pathname, '/admin/school')} tooltip="School Settings">
                        <a><School /> <span>School Settings</span></a>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </>
           )}

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
