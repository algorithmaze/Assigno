import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User, Edit } from "lucide-react";

// TODO: Fetch user data based on logged-in user context

export default function ProfilePage() {
  // Placeholder user data - replace with actual data from context/API
  const user = {
    name: "Current User Name",
    email: "user@example.com",
    phoneNumber: "+1234567890",
    role: "Student", // Example: Could be 'Teacher', 'Admin'
    admissionNumber: "S12345", // Only for students
    class: "10A", // For students and maybe teachers
    profilePictureUrl: "https://picsum.photos/150/150?random=profile",
    schoolCode: "XYZ123",
    schoolName: "Example High School",
    schoolAddress: "123 Main St, Anytown"
  };

  const isStudent = user.role === 'Student';
  const isTeacher = user.role === 'Teacher';
  const isAdmin = user.role === 'Admin';


  // TODO: Implement profile editing functionality

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your Profile</h1>
      <Card className="shadow-lg">
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={user.profilePictureUrl} alt={user.name} data-ai-hint="profile picture" />
            <AvatarFallback className="text-3xl">
                <User/>
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{user.name}</CardTitle>
          <CardDescription>{user.role} @ {user.schoolName}</CardDescription>
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
                {/* Mask phone number */}
                <Input id="phone" value={'****' + user.phoneNumber.slice(-4)} readOnly />
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
             <Input id="schoolName" value={`${user.schoolName} (${user.schoolCode})`} readOnly />
           </div>
            <div className="space-y-1 md:col-span-2">
             <Label htmlFor="schoolAddress">School Address</Label>
             <Input id="schoolAddress" value={user.schoolAddress} readOnly />
           </div>
        </CardContent>
         <CardFooter className="flex justify-end">
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
            {/* TODO: Add Edit Profile Modal/Page */}
         </CardFooter>
      </Card>
       {isAdmin && (
         <Card>
           <CardHeader>
             <CardTitle>Admin Actions</CardTitle>
           </CardHeader>
           <CardContent className="flex flex-wrap gap-4">
             <Button>Manage Users</Button>
             <Button>Manage Groups</Button>
             <Button>School Settings</Button>
             {/* TODO: Link these to respective management pages */}
           </CardContent>
         </Card>
       )}
    </div>
  );
}