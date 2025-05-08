
import type { ReactNode } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
         <AppSidebar />
      </Sidebar>
      {/* SidebarInset is the main content area, it renders a <main> tag and handles flex layout */}
      <SidebarInset> 
        <AppHeader />
        {/* This div is for the scrollable content within the main area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6"> {/* Adjusted padding */}
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

