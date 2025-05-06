
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User, Edit, Loader2 } from "lucide-react";
import { useAuth } from '@/context/auth-context'; // Import useAuth

export default function ProfilePage() {
  const { user, loading } = useAuth(); // Use the hook to get user data

  // TODO: Implement profile editing functionality

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-theme(spacing.24))]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    // Handle case where user is somehow null after loading (should be redirected by AuthProvider)
    return <div className="text-center mt-10 text-muted-foreground">User not found.</div>;
  }

  const isStudent = user.role === 'Student';
  const isTeacher = user.role === 'Teacher';
  const isAdmin = user.role === 'Admin';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your Profile</h1>
      <Card className="shadow-lg">
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={user.profilePictureUrl || `https://picsum.photos/100/100?random=${user.id}`} alt={user.name} data-ai-hint="profile picture" />
            <AvatarFallback className="text-3xl">
                <User/>
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{user.name}</CardTitle>
          <CardDescription>{user.role} @ {user.schoolName || 'Your School'}</CardDescription> {/* Display school name */}
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
           <div className="space-y-1">
             <Label htmlFor="name">Name</Label>
             <Input id="name" value={user.name} readOnly />
           </div>
           <div className="space-y-1">
             <Label htmlFor="role">Role</Label>
             <Input id="role" value={user.role} readOnly />
           </div>
           {user.email && (
             <div className="space-y-1">
               <Label htmlFor="email">Email</Label>
               <Input id="email" type="email" value={user.email} readOnly />
             </div>
           )}
           {user.phoneNumber && (
              <div className="space-y-1">
                <Label htmlFor="phone">Phone Number</Label>
                {/* Consider better masking or showing partial number */}
                <Input id="phone" value={user.phoneNumber.length > 4 ? '****' + user.phoneNumber.slice(-4) : '****'} readOnly />
              </div>
           )}
           {isStudent && user.admissionNumber && (
             <div className="space-y-1">
               <Label htmlFor="admissionNumber">Admission Number</Label>
               <Input id="admissionNumber" value={user.admissionNumber} readOnly />
             </div>
           )}
           {(isStudent || isTeacher) && user.class && (
             <div className="space-y-1">
               <Label htmlFor="class">Class</Label>
               <Input id="class" value={user.class} readOnly />
             </div>
           )}
           <div className="space-y-1 md:col-span-2">
             <Label htmlFor="schoolName">School</Label>
             {/* Display school name and code */}
             <Input id="schoolName" value={`${user.schoolName || 'N/A'} (${user.schoolCode || 'N/A'})`} readOnly />
           </div>
            <div className="space-y-1 md:col-span-2">
             <Label htmlFor="schoolAddress">School Address</Label>
              {/* Display school address */}
             <Input id="schoolAddress" value={user.schoolAddress || 'N/A'} readOnly />
           </div>
        </CardContent>
         <CardFooter className="flex justify-end">
            {/* TODO: Implement Edit Profile functionality */}
            <Button variant="outline" disabled> {/* Disable edit button for now */}
              <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
         </CardFooter>
      </Card>
       {isAdmin && (
         <Card>
           <CardHeader>
             <CardTitle>Admin Actions</CardTitle>
           </CardHeader>
           <CardContent className="flex flex-wrap gap-4">
             {/* TODO: Link these to respective management pages */}
             <Button disabled>Manage Users</Button>
             <Button disabled>Manage Groups</Button>
             <Button disabled>School Settings</Button>
           </CardContent>
         </Card>
       )}
    </div>
  );
}
