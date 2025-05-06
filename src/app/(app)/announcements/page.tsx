import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function AnnouncementsPage() {
  // TODO: Fetch announcements
  // TODO: Implement posting new announcements for Admin
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold">Announcements</h1>
         {/* TODO: Conditionally render based on role (Admin) */}
         <Link href="/announcements/create">
            <Button>New Announcement</Button>
         </Link>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Latest Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <p>School-wide announcements will appear here.</p>
           {/* Placeholder - Map through actual announcements */}
           <div className="mt-4 space-y-4">
             <Card>
               <CardHeader><CardTitle>Important Update</CardTitle></CardHeader>
               <CardContent><p>Details about the update...</p></CardContent>
             </Card>
             <Card>
               <CardHeader><CardTitle>Upcoming Holiday</CardTitle></CardHeader>
               <CardContent><p>School closed on...</p></CardContent>
             </Card>
           </div>
        </CardContent>
       </Card>
    </div>
  );
}