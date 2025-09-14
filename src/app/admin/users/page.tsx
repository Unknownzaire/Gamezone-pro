'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockUsers as initialUsers } from "@/lib/mock-data";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { User } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedUsers = localStorage.getItem('allUsers');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      setUsers(initialUsers);
      localStorage.setItem('allUsers', JSON.stringify(initialUsers));
    }
  }, []);

  const saveUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    const updatedUsers = users.filter(user => user.id !== userToDelete.id);
    saveUsers(updatedUsers);
    toast({ title: "User Deleted", description: `User ${userToDelete.username} has been deleted.` });
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleBlockUser = (userId: string) => {
    const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, isBlocked: user.isBlocked ? !user.isBlocked : true } : user
    );
    saveUsers(updatedUsers);
    const user = users.find(u => u.id === userId);
    if(user) {
        toast({ title: `User ${user.isBlocked ? 'Unblocked' : 'Blocked'}`, description: `User ${user.username} has been ${user.isBlocked ? 'unblocked' : 'blocked'}.` });
    }
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage all registered users.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Wallet Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className={user.isBlocked ? 'bg-destructive/10' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl} alt={user.username} />
                        <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">
                        <p>{user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>₹{user.walletBalance.toLocaleString()}</TableCell>
                   <TableCell>
                    {user.isBlocked ? (
                      <Badge variant="destructive">Blocked</Badge>
                    ) : (
                      <Badge variant="secondary">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/edit/${user.id}`}>Edit User</Link>
                        </DropdownMenuItem>
                         <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${user.id}/history`}>View Match History</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleBlockUser(user.id)}>
                          {user.isBlocked ? 'Unblock User' : 'Block User'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(user)}>
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user '{userToDelete?.username}' and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
