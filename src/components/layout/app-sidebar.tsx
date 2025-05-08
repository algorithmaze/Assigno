
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
  useSidebar
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
  Building2, // Assigno Icon
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
  const { isMobile, setOpenMobile } = useSidebar();

  const isAdmin = user?.role === 'Admin';
  const isTeacher = user?.role === 'Teacher';
  // const isStudent = user?.role === 'Student';

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <>
      <SidebarHeader className="flex items-center justify-between">
         <Link href="/dashboard" className="text-xl font-semibold px-2 group-data-[collapsible=icon]:hidden flex items-center gap-2" onClick={handleLinkClick}>
            <Building2 className="h-6 w-6 text-primary" />
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
              <SidebarMenuButton asChild isActive={isActive(pathname, '/dashboard', true)} tooltip="Dashboard" onClick={handleLinkClick}>
                <a><LayoutDashboard /> <span>Dashboard</span></a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link href="/groups" passHref legacyBehavior>
              <SidebarMenuButton asChild isActive={isActive(pathname, '/groups')} tooltip="Groups" onClick={handleLinkClick}>
                <a><Users /> <span>Groups</span></a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

           <SidebarMenuItem>
            <Link href="/announcements" passHref legacyBehavior>
              <SidebarMenuButton asChild isActive={isActive(pathname, '/announcements')} tooltip="Announcements" onClick={handleLinkClick}>
                <a><Megaphone /> <span>Announcements</span></a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

            <SidebarMenuItem>
                <Link href="/teachers" passHref legacyBehavior>
                <SidebarMenuButton asChild isActive={isActive(pathname, '/teachers')} tooltip="Teachers & Admins" onClick={handleLinkClick}>
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
                    <SidebarMenuButton asChild isActive={isActive(pathname, '/teacher/requests')} tooltip="Group Join Requests" onClick={handleLinkClick}>
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
                    <SidebarMenuButton asChild isActive={isActive(pathname, '/admin/users')} tooltip="Manage Users" onClick={handleLinkClick}>
                        <a><UserCircle /> <span>Manage Users</span></a>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/admin/school" passHref legacyBehavior>
                    <SidebarMenuButton asChild isActive={isActive(pathname, '/admin/school')} tooltip="School Settings" onClick={handleLinkClick}>
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
                    <SidebarMenuButton asChild isActive={isActive(pathname, '/profile')} tooltip="Profile" onClick={handleLinkClick}>
                       <a> <UserCircle /> <span>Profile</span> </a>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <Link href="/settings" passHref legacyBehavior>
                    <SidebarMenuButton asChild isActive={isActive(pathname, '/settings')} tooltip="Settings" onClick={handleLinkClick}>
                        <a><Settings /> <span>Settings</span></a>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton onClick={() => {logout(); handleLinkClick();}} tooltip="Logout">
                    <LogOut /> <span>Logout</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
