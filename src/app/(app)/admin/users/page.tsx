
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, Edit, Trash2, Loader2, User as UserIcon, Download, Upload } from "lucide-react";
import { useAuth } from '@/context/auth-context';
import type { User, ExcelUser } from '@/context/auth-context'; // ExcelUser might need to be defined or imported from users service if it's different
import { fetchAllUsers, deleteUser as deleteUserService, bulkAddUsersFromExcel } from '@/services/users';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input'; // For file input
import * as XLSX from 'xlsx'; // For Excel export


export default function AdminUsersPage() {
  const { user: adminUser, loading: authLoading } = useAuth();
  const [users, setUsers] = React.useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
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
    toast({ title: "Action Required", description: "Manual user creation form to be implemented. Use Excel Upload for now." });
    console.log("Open create user dialog");
  };

  const handleEditUser = (userToEdit: User) => {
    toast({ title: "Action Required", description: `Edit form for ${userToEdit.name} to be implemented.` });
    console.log("Open edit user dialog for:", userToEdit);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!adminUser || adminUser.id === userId) {
        toast({title: "Cannot Delete", description: "Admins cannot delete their own account from this panel.", variant: "destructive"});
        return;
    }
    setIsDeleting(userId);
    try {
      const success = await deleteUserService(userId);
      if (success) {
        toast({ title: "User Deleted", description: `${userName} has been removed.` });
        loadUsers();
      } else {
        toast({ title: "Deletion Failed", description: `Could not delete ${userName}.`, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An error occurred during deletion.", variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDownloadTemplate = () => {
    // Explicitly define headers matching ExcelUser type keys
    const teacherHeaders = ["Name", "Email or Phone", "Role", "Designation (Teacher Only)", "Class Handling (Teacher Only)"];
    const studentHeaders = ["Name", "Email or Phone", "Role", "Admission Number (Student Only)", "Class (Student Only)"];

    const teacherSheetData: Partial<ExcelUser>[] = [
      { Name: "Teacher Example One", 'Email or Phone': "teacher1@example.com", Role: "Teacher", 'Designation (Teacher Only)': "Class Teacher", 'Class Handling (Teacher Only)': "10A" },
      { Name: "Teacher Example Two", 'Email or Phone': "1234567891", Role: "Teacher", 'Designation (Teacher Only)': "Subject Teacher", 'Class Handling (Teacher Only)': "9B, 11C" },
    ];
    const studentSheetData: Partial<ExcelUser>[] = [
      { Name: "Student Example One", 'Email or Phone': "student1@example.com", Role: "Student", 'Admission Number (Student Only)': "S001", 'Class (Student Only)': "10A" },
      { Name: "Student Example Two", 'Email or Phone': "9876543211", Role: "Student", 'Admission Number (Student Only)': "S002", 'Class (Student Only)': "9B" },
    ];

    const wb = XLSX.utils.book_new();
    const wsTeachers = XLSX.utils.json_to_sheet(teacherSheetData, { header: teacherHeaders });
    const wsStudents = XLSX.utils.json_to_sheet(studentSheetData, { header: studentHeaders });

    XLSX.utils.book_append_sheet(wb, wsTeachers, "Teachers_Template");
    XLSX.utils.book_append_sheet(wb, wsStudents, "Students_Template");
    XLSX.writeFile(wb, "Assigno_User_Import_Template.xlsx");
    toast({title: "Template Downloaded", description: "Excel template has been downloaded."});
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !adminUser) return;

    setIsUploading(true);
    try {
      const result = await bulkAddUsersFromExcel(file, adminUser.schoolCode);
      toast({
        title: "Upload Processed",
        description: `Successfully added: ${result.successCount}. Failed: ${result.errorCount}.`,
        duration: result.errorCount > 0 ? 10000 : 5000, // Longer duration if errors
      });
      if (result.errors.length > 0) {
        console.error("Bulk import errors:", result.errors);
        // Could display errors in a dialog or more detailed toast
        result.errors.slice(0, 5).forEach(err => toast({ title: "Import Error", description: err, variant: "destructive", duration: 10000 }));
        if (result.errors.length > 5) {
             toast({ title: "Multiple Import Errors", description: `There were ${result.errors.length - 5} more errors. Check console for details.`, variant: "destructive", duration: 10000 });
        }
      }
      if (result.successCount > 0) {
        loadUsers(); // Refresh user list if any users were added
      }
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message || "Could not process the Excel file.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
      }
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <div className="flex flex-wrap gap-2">
            <Button onClick={handleDownloadTemplate} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Download Template
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} variant="outline">
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload Excel
            </Button>
            <Input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
            />
            <Button onClick={handleCreateUser} disabled>
                <PlusCircle className="mr-2 h-4 w-4" /> Create User (Manual)
            </Button>
        </div>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>View, edit, or remove users in {adminUser?.schoolName}. Use Excel upload for bulk additions.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No users found in this school yet. Use 'Upload Excel' or 'Create User'.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email / Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Class / Admission No. / Designation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.profilePictureUrl || `https://picsum.photos/40/40?random=${user.id}`} alt={user.name} data-ai-hint="user avatar" />
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
                      {user.role === 'Student' ? `${user.class || 'N/A'} (${user.admissionNumber || 'N/A'})` 
                       : user.role === 'Teacher' ? `${user.designation || 'N/A'} ${user.class ? `(${user.class})` : ''}` 
                       : user.class || 'N/A'}
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
    </div>
  );
}

