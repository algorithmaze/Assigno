'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, Edit, Trash2, Loader2, User as UserIcon } from "lucide-react";
import { useAuth } from '@/context/auth-context';
import type { User } from '@/context/auth-context';
import { fetchAllUsers, deleteUser as deleteUserService } from '@/services/users'; // Assuming you have these
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
// TODO: Import a UserFormDialog component

export default function AdminUsersPage() {
  const { user: adminUser, loading: authLoading } = useAuth();
  const [users, setUsers] = React.useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null); // Store ID of user being deleted
  const { toast } = useToast();
  const router = useRouter();

  // Redirect if not admin
  React.useEffect(() => {
    if (!authLoading && adminUser?.role !== 'Admin') {
      toast({ title: "Unauthorized", description: "You do not have permission to access this page.", variant: "destructive" });
      router.replace('/dashboard');
    }
  }, [adminUser, authLoading, router, toast]);

  const loadUsers = React.useCallback(async () => {
    if (!adminUser || adminUser.role !== 'Admin') return;
    setLoadingUsers(true);
    try {
      const fetchedUsers = await fetchAllUsers(adminUser.schoolCode);
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({ title: "Error", description: "Could not load users.", variant: "destructive" });
    } finally {
      setLoadingUsers(false);
    }
  }, [adminUser, toast]);

  React.useEffect(() => {
    if (adminUser?.role === 'Admin') {
      loadUsers();
    }
  }, [adminUser, loadUsers]);

  const handleCreateUser = () => {
    // TODO: Open UserFormDialog for creation
    toast({ title: "Action Required", description: "User creation form to be implemented." });
    console.log("Open create user dialog");
  };

  const handleEditUser = (userToEdit: User) => {
    // TODO: Open UserFormDialog for editing, passing userToEdit
    toast({ title: "Action Required", description: `Edit form for ${userToEdit.name} to be implemented.` });
    console.log("Open edit user dialog for:", userToEdit);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!adminUser || adminUser.id === userId) {
        toast({title: "Cannot Delete", description: "Admins cannot delete their own account from this panel.", variant: "destructive"});
        return;
    }
    // Optional: Add an AlertDialog confirmation here
    setIsDeleting(userId);
    try {
      const success = await deleteUserService(userId);
      if (success) {
        toast({ title: "User Deleted", description: `${userName} has been removed.` });
        loadUsers(); // Refresh the list
      } else {
        toast({ title: "Deletion Failed", description: `Could not delete ${userName}.`, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An error occurred during deletion.", variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };


  if (authLoading || (adminUser && adminUser.role !== 'Admin')) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-theme(spacing.24))]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <Button onClick={handleCreateUser} disabled>
          <PlusCircle className="mr-2 h-4 w-4" /> Create User (Not Implemented)
        </Button>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>View, edit, or remove users in your school ({adminUser?.schoolName}).</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No users found in this school yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email / Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Class / Admission No.</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.profilePictureUrl} alt={user.name} data-ai-hint="user avatar" />
                          <AvatarFallback>
                            {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon />}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email || user.phoneNumber || 'N/A'}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      {user.role === 'Student' ? `${user.class || 'N/A'} (${user.admissionNumber || 'N/A'})` : user.class || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)} className="mr-2" disabled>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit User</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        disabled={isDeleting === user.id || adminUser?.id === user.id}
                      >
                        {isDeleting === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        <span className="sr-only">Delete User</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {/* TODO: Add UserFormDialog component here, controlled by state */}
      {/* <UserFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} userToEdit={editingUser} onSave={loadUsers} /> */}
    </div>
  );
}
