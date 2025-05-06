import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Lock, Palette } from "lucide-react";

export default function SettingsPage() {
  // TODO: Fetch user settings
  // TODO: Implement saving settings

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell/> Notifications</CardTitle>
          <CardDescription>Manage how you receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="group-notifications" className="flex flex-col space-y-1">
              <span>Group Messages</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Receive notifications for new messages in your groups.
              </span>
            </Label>
            <Switch id="group-notifications" defaultChecked />
          </div>
           <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="announcement-notifications" className="flex flex-col space-y-1">
              <span>Announcements</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Receive notifications for new school announcements.
              </span>
            </Label>
            <Switch id="announcement-notifications" defaultChecked />
          </div>
           <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="event-reminders" className="flex flex-col space-y-1">
              <span>Event Reminders</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Get reminders for upcoming events mentioned in groups or announcements.
              </span>
            </Label>
            <Switch id="event-reminders" defaultChecked />
          </div>
          {/* Add more notification settings as needed */}
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock/> Privacy & Security</CardTitle>
           <CardDescription>Control your account privacy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="accept-chats" className="flex flex-col space-y-1">
              <span>Accept Chat Requests</span>
               <span className="font-normal leading-snug text-muted-foreground">
                 Allow other users (teachers/admins) to initiate chats with you. (Students cannot initiate chats).
               </span>
            </Label>
             {/* TODO: Make this switch functional based on user role */}
            <Switch id="accept-chats" defaultChecked />
          </div>
          {/* Add options like Blocked Users, Change Password (if applicable) */}
           <Button variant="outline">Change Password</Button>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette/> Appearance</CardTitle>
           <CardDescription>Customize the look and feel of the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {/* Theme switching is handled in the header for now */}
           <p className="text-sm text-muted-foreground">Theme selection (Light/Dark) is available in the header user menu.</p>
           {/* Add other appearance settings like font size if needed */}
        </CardContent>
      </Card>

    </div>
  );
}
