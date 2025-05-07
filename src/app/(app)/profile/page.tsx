
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User as UserIcon, Edit, Loader2, Mail, Phone, Building, BookOpen, Hash, Briefcase, Award, ShieldCheck, LogOut, Settings as SettingsIcon, UploadCloud, Save } from "lucide-react";
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { updateUser } from '@/services/users'; // Assuming this service exists and works
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).max(50),
  // Add other editable fields here if needed
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user, loading, updateUserSession } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
    },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({ name: user.name });
      setPreviewUrl(null); // Clear preview when user changes or edit mode is toggled off
      setSelectedFile(null);
    }
  }, [user, form, isEditing]);


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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate: SubmitHandler<ProfileFormData> = async (data) => {
    if (!user) return;
    setIsSaving(true);

    let newProfilePictureUrl = user.profilePictureUrl;

    if (selectedFile && previewUrl) {
      // In a real app, upload selectedFile to a storage service and get the URL
      // For this mock, we'll use the data URI (previewUrl) as the new profilePictureUrl
      newProfilePictureUrl = previewUrl;
    }

    const updates: Partial<typeof user> = {
      name: data.name,
      profilePictureUrl: newProfilePictureUrl,
    };

    try {
      const updatedUserFromService = await updateUser(user.id, updates);
      if (updatedUserFromService) {
        await updateUserSession(updatedUserFromService); // Update context and localStorage
        toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
        setIsEditing(false);
        setSelectedFile(null);
        // previewUrl will be reset by useEffect when isEditing changes
      } else {
        toast({ title: "Update Failed", description: "Could not update your profile.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error Updating Profile", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    form.reset({ name: user.name }); // Reset form to original user data
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
        )}
      </div>

      <Card className="shadow-lg">
        <form onSubmit={form.handleSubmit(handleProfileUpdate)}>
            <CardHeader className="items-center text-center border-b pb-6">
                <div className="relative">
                <Avatar className="h-28 w-28 mb-4 ring-2 ring-primary/20 p-1">
                    <AvatarImage 
                        src={previewUrl || user.profilePictureUrl || undefined} // Pass undefined if no URL
                        alt={user.name} 
                        data-ai-hint="profile large" 
                    />
                    <AvatarFallback className="text-4xl">
                        {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon/>}
                    </AvatarFallback>
                </Avatar>
                {isEditing && (
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        className="absolute bottom-4 right-0 rounded-full h-8 w-8 bg-background"
                        onClick={triggerFileInput}
                        aria-label="Upload new profile picture"
                        disabled={isSaving}
                    >
                        <UploadCloud className="h-4 w-4"/>
                    </Button>
                )}
                </div>
                <Input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    disabled={!isEditing || isSaving}
                />

                {isEditing ? (
                     <Controller
                        name="name"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <div className="w-full max-w-xs">
                                <Input 
                                    {...field} 
                                    className="text-3xl font-semibold text-center border-0 shadow-none focus-visible:ring-1 focus-visible:ring-ring"
                                    disabled={isSaving}
                                />
                                {fieldState.error && <p className="text-sm text-destructive mt-1">{fieldState.error.message}</p>}
                            </div>
                        )}
                    />
                ) : (
                    <CardTitle className="text-3xl">{user.name}</CardTitle>
                )}
                <CardDescription className="text-lg text-muted-foreground">
                    {user.role}
                    {user.role === 'Teacher' && user.designation && (
                        <span className="block text-sm">({user.designation})</span>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6 grid gap-6 md:grid-cols-2">
                <h2 className="text-xl font-semibold col-span-full border-b pb-2 mb-2">Personal Information</h2>
                {/* Name field is handled in CardHeader when editing */}
                {!isEditing && (
                    <div className="space-y-1">
                    <Label htmlFor="name" className="flex items-center text-muted-foreground"><UserIcon className="mr-2 h-4 w-4" />Name</Label>
                    <Input id="name" value={user.name} readOnly className="text-base"/>
                    </div>
                )}
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
                    <Label htmlFor="class" className="flex items-center text-muted-foreground"><BookOpen className="mr-2 h-4 w-4" />Class(es)</Label>
                    <Input id="class" value={user.class} readOnly className="text-base"/>
                </div>
                )}
                {user.role === 'Teacher' && user.designation && (
                    <div className="space-y-1">
                        <Label htmlFor="designation" className="flex items-center text-muted-foreground"><Award className="mr-2 h-4 w-4" />Designation</Label>
                        <Input id="designation" value={user.designation} readOnly className="text-base"/>
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
            {isEditing && (
                <CardFooter className="flex justify-end gap-2 border-t pt-6">
                    <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </CardFooter>
            )}
        </form>
      </Card>

    {user.role === 'Admin' && !isEditing && (
        <Card className="shadow-md">
        <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
            <CardDescription>Quick links for administrators.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
            <Link href="/admin/users"><Button><UserIcon className="mr-2 h-4 w-4" /> Manage Users</Button></Link>
            <Link href="/admin/school"><Button><ShieldCheck className="mr-2 h-4 w-4" /> School Settings</Button></Link>
            <Link href="/settings"><Button variant="outline"><SettingsIcon className="mr-2 h-4 w-4"/>General Settings</Button></Link>
        </CardContent>
        </Card>
    )}
    </div>
  );
}

