

'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockUsers as initialUsers, mockTransactions as initialTransactions } from "@/lib/mock-data";
import { MoreHorizontal, ArrowLeft, RefreshCw, Wallet } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { User, Transaction } from "@/lib/types";
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
import { format } from "date-fns";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToFund, setUserToFund] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFundDialogOpen, setIsFundDialogOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState('');

  const { toast } = useToast();

  const loadData = useCallback(() => {
    const storedUsers = localStorage.getItem('allUsers');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers).map((u: any) => ({...u, createdAt: u.createdAt ? new Date(u.createdAt) : new Date() })));
    } else {
      setUsers(initialUsers);
      localStorage.setItem('allUsers', JSON.stringify(initialUsers));
    }
    
    const storedTransactions = localStorage.getItem('allTransactions');
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions).map((t: any) => ({...t, createdAt: new Date(t.createdAt)})));
    } else {
      setTransactions(initialTransactions);
      localStorage.setItem('allTransactions', JSON.stringify(initialTransactions));
    }
  }, []);

  useEffect(() => {
    loadData();
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'allUsers' || event.key === 'allTransactions') {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadData]);

  const saveUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
  };
  
  const saveTransactions = (updatedTransactions: Transaction[]) => {
    setTransactions(updatedTransactions);
    localStorage.setItem('allTransactions', JSON.stringify(updatedTransactions));
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
        user.id === userId ? { ...user, isBlocked: !user.isBlocked } : user
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

  const openFundDialog = (user: User) => {
    setUserToFund(user);
    setIsFundDialogOpen(true);
  };
  
  const handleAddFunds = () => {
    if (!userToFund || !fundAmount) return;

    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: "Invalid Amount", description: "Please enter a valid positive amount." });
      return;
    }

    const updatedUsers = users.map(u => 
      u.id === userToFund.id ? { ...u, walletBalance: u.walletBalance + amount } : u
    );
    saveUsers(updatedUsers);

    const newTransaction: Transaction = {
      id: `tx-${Date.now()}-${Math.random()}`,
      userId: userToFund.id,
      amount,
      type: 'credit',
      description: 'Admin Deposit',
      createdAt: new Date(),
      status: 'completed'
    };
    saveTransactions([newTransaction, ...transactions]);

    toast({
      title: "Funds Added",
      description: `₹${amount.toLocaleString()} has been added to ${userToFund.username}'s wallet.`,
    });
    
    setIsFundDialogOpen(false);
    setFundAmount('');
    setUserToFund(null);
  };

  const getAvailableBalance = (user: User) => {
    const pendingDebits = transactions
      .filter(tx => tx.userId === user.id && tx.status === 'pending' && tx.type === 'debit')
      .reduce((acc, tx) => acc + tx.amount, 0);
    return user.walletBalance - pendingDebits;
  };

  const getTotalDeposits = (user: User) => {
    if (user.totalDeposits !== undefined) {
      return user.totalDeposits;
    }
    return transactions
      .filter(tx => tx.userId === user.id && tx.type === 'credit' && tx.status === 'completed' && (tx.description.toLowerCase().includes('deposit') || tx.description.toLowerCase().includes('added to wallet')))
      .reduce((acc, tx) => acc + tx.amount, 0);
  };

  const getTotalReferrals = (userId: string) => {
    return users.filter(u => u.referredBy === userId).length;
  };


  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="hidden md:block">
              <Button variant="outline" size="icon" className="h-7 w-7">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
              </Button>
          </Link>
          <div>
            <h1 className="font-headline text-3xl font-bold">Users</h1>
            <p className="text-muted-foreground">Manage all registered users.</p>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={() => loadData()}>
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh users</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Available Balance</TableHead>
                <TableHead>Total Balance</TableHead>
                <TableHead>Total Deposits</TableHead>
                <TableHead>BGMI Username</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Referred By</TableHead>
                <TableHead>Total Referrals</TableHead>
                <TableHead>Registered</TableHead>
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
                  <TableCell>{user.password}</TableCell>
                  <TableCell>₹{getAvailableBalance(user).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>₹{user.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>₹{getTotalDeposits(user).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>{user.bgmiUsername}</TableCell>
                  <TableCell>{user.mobile}</TableCell>
                  <TableCell>
                    {user.referredBy ? users.find(u => u.id === user.referredBy)?.username || 'N/A' : 'N/A'}
                  </TableCell>
                  <TableCell className="font-bold text-center">{getTotalReferrals(user.id)}</TableCell>
                   <TableCell>{format(new Date(user.createdAt), 'PP')}</TableCell>
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
                         <DropdownMenuItem onClick={() => openFundDialog(user)}>
                            Add Funds
                        </DropdownMenuItem>
                         <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${user.id}/history`}>View Match History</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${user.id}/history?tab=transactions`}>View Transaction History</Link>
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

       <Dialog open={isFundDialogOpen} onOpenChange={setIsFundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds to {userToFund?.username}</DialogTitle>
            <DialogDescription>
              Manually credit the user's wallet. This will create a transaction record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="fund-amount">Amount (₹)</Label>
              <Input 
                id="fund-amount" 
                type="number" 
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="e.g., 100"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddFunds}>Confirm Deposit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
