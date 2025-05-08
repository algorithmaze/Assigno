'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Lock, Palette, Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { user, deleteAccount } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = React.useState(false);

  // TODO: Fetch and save user settings state (e.g., notification preferences)
  const [settings, setSettings] = React.useState({
    groupNotifications: true,
    announcementNotifications: true,
    eventReminders: true,
    acceptChatRequests: true, // This might be role-dependent
  });

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // TODO: Call API to save this preference
    console.log(`Setting ${key} changed to ${value}. (API call to be implemented)`);
    toast({ title: "Setting Updated (Simulated)", description: `${key} preference saved.`});
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteAccount();
      if (success) {
        toast({ title: "Account Deletion Initiated", description: "Your account is being deleted. You will be logged out."});
        // AuthProvider will handle logout and redirect
      } else {
        toast({ title: "Deletion Failed", description: "Could not delete your account. Please try again.", variant: "destructive"});
      }
    } catch (error) {
        console.error("Error deleting account:", error);
        toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive"});
    } finally {
        setIsDeleting(false);
    }
  };

  if (!user) {
    return <div className="text-center mt-10 text-muted-foreground">Loading user settings...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell/> Notifications</CardTitle>
          <CardDescription>Manage how you receive notifications from Assigno.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
            <Label htmlFor="group-notifications" className="flex flex-col space-y-1 cursor-pointer flex-1 mr-2">
              <span>Group Messages</span>
              <span className="font-normal leading-snug text-muted-foreground text-xs sm:text-sm">
                Receive notifications for new messages in your groups.
              </span>
            </Label>
            <Switch
                id="group-notifications"
                checked={settings.groupNotifications}
                onCheckedChange={(checked) => handleSettingChange('groupNotifications', checked)}
            />
          </div>
           <div className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
            <Label htmlFor="announcement-notifications" className="flex flex-col space-y-1 cursor-pointer flex-1 mr-2">
              <span>Announcements</span>
              <span className="font-normal leading-snug text-muted-foreground text-xs sm:text-sm">
                Receive notifications for new school announcements.
              </span>
            </Label>
            <Switch
                id="announcement-notifications"
                checked={settings.announcementNotifications}
                onCheckedChange={(checked) => handleSettingChange('announcementNotifications', checked)}
            />
          </div>
           <div className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
            <Label htmlFor="event-reminders" className="flex flex-col space-y-1 cursor-pointer flex-1 mr-2">
              <span>Event Reminders</span>
              <span className="font-normal leading-snug text-muted-foreground text-xs sm:text-sm">
                Get reminders for upcoming events.
              </span>
            </Label>
            <Switch
                id="event-reminders"
                checked={settings.eventReminders}
                onCheckedChange={(checked) => handleSettingChange('eventReminders', checked)}
            />
          </div>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock/> Privacy & Security</CardTitle>
           <CardDescription>Control your account privacy and security settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
            <Label htmlFor="accept-chats" className="flex flex-col space-y-1 cursor-pointer flex-1 mr-2">
              <span>Accept Chat Requests</span>
               <span className="font-normal leading-snug text-muted-foreground text-xs sm:text-sm">
                 Allow teachers/admins to initiate chats. (Students cannot initiate with teachers/admins).
               </span>
            </Label>
            <Switch
                id="accept-chats"
                checked={settings.acceptChatRequests}
                onCheckedChange={(checked) => handleSettingChange('acceptChatRequests', checked)}
                disabled={user.role === 'Student'} // Example: Students might not control this
            />
          </div>
           <Button variant="outline" disabled className="w-full sm:w-auto">Change Password (Not Implemented)</Button>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette/> Appearance</CardTitle>
           <CardDescription>Customize the look and feel of the app.</CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-sm text-muted-foreground">Theme selection (Light/Dark) is available in the header user menu.</p>
           {/* Future: Font size, other display preferences */}
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive"><Trash2/> Danger Zone</CardTitle>
            <CardDescription>Manage account deletion and other critical actions.</CardDescription>
        </CardHeader>
        <CardContent>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting} className="w-full sm:w-auto">
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                        Delete Account
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove your data from our servers.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                         {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Yes, delete my account
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <p className="text-sm text-muted-foreground mt-2">
                Deleting your account will remove all your personal data, messages, and group memberships.
            </p>
        </CardContent>
      </Card>

    </div>
  );
}
