'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User, Edit, Loader2, Mail, Phone, Building, BookOpen, Hash, Briefcase } from "lucide-react";
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
// TODO: import updateUser from '@/services/users' and a profile edit form component

export default function ProfilePage() {
  const { user, loading, updateUserSession } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = React.useState(false);
  // TODO: Add state for form fields if implementing inline editing

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-theme(spacing.24))]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <div className="text-center mt-10 text-muted-foreground">User not found. Please login again.</div>;
  }

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    // If canceling edit, reset form fields if any
  };

  const handleProfileUpdate = async (formData: any) => {
    // Example: const updatedUser = await updateUser(user.id, formData);
    // if (updatedUser) {
    //   updateUserSession(updatedUser);
    //   toast({ title: "Profile Updated" });
    //   setIsEditing(false);
    // } else {
    //   toast({ title: "Update Failed", variant: "destructive" });
    // }
    toast({ title: "Profile Update (Simulated)", description: "Edit functionality to be implemented."});
    setIsEditing(false);
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <Button onClick={handleEditToggle} variant="outline">
          <Edit className="mr-2 h-4 w-4" /> {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      {isEditing ? (
        // TODO: Replace with a proper ProfileEditForm component
        <Card className="shadow-lg">
            <CardHeader><CardTitle>Edit Your Profile</CardTitle></CardHeader>
            <CardContent>
                <p>Profile editing form will be here.</p>
                {/* Example: <ProfileEditForm user={user} onSubmit={handleProfileUpdate} onCancel={handleEditToggle} /> */}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleEditToggle}>Cancel</Button>
                <Button onClick={() => handleProfileUpdate({})}>Save Changes (Simulated)</Button>
            </CardFooter>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center border-b pb-6">
            <Avatar className="h-28 w-28 mb-4 ring-2 ring-primary/20 p-1">
              <AvatarImage src={user.profilePictureUrl || `https://picsum.photos/120/120?random=${user.id}`} alt={user.name} data-ai-hint="profile large" />
              <AvatarFallback className="text-4xl">
                  <UserIcon/>
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-3xl">{user.name}</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
                {user.role}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid gap-6 md:grid-cols-2">
            <h2 className="text-xl font-semibold col-span-full border-b pb-2 mb-2">Personal Information</h2>
             <div className="space-y-1">
               <Label htmlFor="name" className="flex items-center text-muted-foreground"><User className="mr-2 h-4 w-4" />Name</Label>
               <Input id="name" value={user.name} readOnly className="text-base"/>
             </div>
             <div className="space-y-1">
               <Label htmlFor="role" className="flex items-center text-muted-foreground"><Briefcase className="mr-2 h-4 w-4" />Role</Label>
               <Input id="role" value={user.role} readOnly className="text-base"/>
             </div>
             {user.email && (
               <div className="space-y-1">
                 <Label htmlFor="email" className="flex items-center text-muted-foreground"><Mail className="mr-2 h-4 w-4" />Email</Label>
                 <Input id="email" type="email" value={user.email} readOnly className="text-base"/>
               </div>
             )}
             {user.phoneNumber && (
                <div className="space-y-1">
                  <Label htmlFor="phone" className="flex items-center text-muted-foreground"><Phone className="mr-2 h-4 w-4" />Phone Number</Label>
                  <Input id="phone" value={user.phoneNumber} readOnly className="text-base"/>
                </div>
             )}
             {user.role === 'Student' && user.admissionNumber && (
               <div className="space-y-1">
                 <Label htmlFor="admissionNumber" className="flex items-center text-muted-foreground"><Hash className="mr-2 h-4 w-4" />Admission Number</Label>
                 <Input id="admissionNumber" value={user.admissionNumber} readOnly className="text-base"/>
               </div>
             )}
             {(user.role === 'Student' || user.role === 'Teacher') && user.class && (
               <div className="space-y-1">
                 <Label htmlFor="class" className="flex items-center text-muted-foreground"><BookOpen className="mr-2 h-4 w-4" />Class</Label>
                 <Input id="class" value={user.class} readOnly className="text-base"/>
               </div>
             )}

            <h2 className="text-xl font-semibold col-span-full border-b pb-2 mt-4 mb-2">School Information</h2>
             <div className="space-y-1 md:col-span-2">
               <Label htmlFor="schoolName" className="flex items-center text-muted-foreground"><Building className="mr-2 h-4 w-4" />School Name</Label>
               <Input id="schoolName" value={user.schoolName || 'N/A'} readOnly className="text-base"/>
             </div>
             <div className="space-y-1 md:col-span-2">
               <Label htmlFor="schoolCode" className="flex items-center text-muted-foreground"><Hash className="mr-2 h-4 w-4" />School Code</Label>
               <Input id="schoolCode" value={user.schoolCode || 'N/A'} readOnly className="text-base"/>
             </div>
             <div className="space-y-1 md:col-span-2">
               <Label htmlFor="schoolAddress" className="flex items-center text-muted-foreground"><Building className="mr-2 h-4 w-4" />School Address</Label>
               <Input id="schoolAddress" value={user.schoolAddress || 'N/A'} readOnly className="text-base"/>
             </div>
          </CardContent>
        </Card>
      )}

       {user.role === 'Admin' && !isEditing && (
         <Card className="shadow-md">
           <CardHeader>
             <CardTitle>Admin Actions</CardTitle>
             <CardDescription>Quick links for administrators.</CardDescription>
           </CardHeader>
           <CardContent className="flex flex-wrap gap-4">
             <Link href="/admin/users"><Button>Manage Users</Button></Link>
             {/* <Link href="/admin/groups"><Button>Manage All Groups</Button></Link> */}
             <Link href="/admin/school"><Button>School Settings</Button></Link>
           </CardContent>
         </Card>
       )}
    </div>
  );
}
