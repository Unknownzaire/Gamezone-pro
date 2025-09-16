
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockTournaments, mockUsers, mockTransactions as initialTransactions } from "@/lib/mock-data";
import { User, Transaction, Tournament } from '@/lib/types';
import { DollarSign, Swords, Trophy, Users, Clock, ArrowDownLeft, ArrowUpRight, RefreshCw, History, Settings, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [completedTournaments, setCompletedTournaments] = useState<Tournament[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<Transaction[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const { toast } = useToast();
  
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  
  const [transactionToDecline, setTransactionToDecline] = useState<Transaction | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  const loadData = useCallback(() => {
    const storedUsers = localStorage.getItem('allUsers');
    const users: User[] = storedUsers ? JSON.parse(storedUsers) : mockUsers;
    setAllUsers(users);
    setTotalUsers(users.length);

    const storedTransactions = localStorage.getItem('allTransactions');
    const allTransactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions).map((t: any) => ({...t, createdAt: new Date(t.createdAt)})) : initialTransactions;

    setPendingDeposits(allTransactions.filter(tx => tx.status === 'pending' && tx.type === 'credit'));
    setPendingWithdrawals(allTransactions.filter(tx => tx.status === 'pending' && tx.type === 'debit'));

    const storedTournaments = localStorage.getItem('allTournaments');
    const allTournaments = storedTournaments ? JSON.parse(storedTournaments).map((t: any) => ({...t, matchTime: new Date(t.matchTime)})) : mockTournaments;
    setCompletedTournaments(allTournaments.filter((t: Tournament) => t.status === 'Completed'));

    console.log("Data reloaded");
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const totalTournaments = mockTournaments.length;
  const totalPrizeDistributed = completedTournaments.reduce((acc, t) => acc + t.prizePool, 0);
  const totalRevenue = completedTournaments.reduce((acc, t) => acc + t.prizePool * (t.commissionPercentage / 100), 0);

  const stats = [
    { title: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, href: null },
    { title: "Total Users", value: totalUsers, icon: Users, href: '/admin/users' },
    { title: "Total Tournaments", value: totalTournaments, icon: Swords, href: '/admin/tournaments' },
    { title: "Prize Distributed", value: `₹${totalPrizeDistributed.toLocaleString()}`, icon: BarChart3, href: '/admin/reports' },
  ];
  
  const handleRequest = (transactionId: string, status: 'completed' | 'declined', type: 'credit' | 'debit', reason?: string) => {
    const isDeposit = type === 'credit';
    
    let allTransactions: Transaction[] = JSON.parse(localStorage.getItem('allTransactions') || '[]');
    const transaction = allTransactions.find(tx => tx.id === transactionId);
    if(!transaction) return;

    allTransactions = allTransactions.map(t => t.id === transactionId ? {...t, status: status, declineReason: reason } : t);
    localStorage.setItem('allTransactions', JSON.stringify(allTransactions));

    let updatedUsers = [...allUsers];
    const userToUpdate = allUsers.find(u => u.id === transaction.userId);

    if (userToUpdate) {
      if (status === 'completed') {
        if (isDeposit) {
          updatedUsers = updatedUsers.map(u => 
            u.id === userToUpdate.id 
            ? { ...u, walletBalance: u.walletBalance + transaction.amount } 
            : u
          );
        }
      } else { 
        if (!isDeposit) {
          updatedUsers = updatedUsers.map(u => 
            u.id === userToUpdate.id 
            ? { ...u, walletBalance: u.walletBalance + transaction.amount } 
            : u
          );
        }
      }
    }

    setAllUsers(updatedUsers);
    localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
    
    loadData();
    
    toast({
      title: `Request ${status === 'completed' ? 'Approved' : 'Declined'}`,
      description: `The ${isDeposit ? 'deposit' : 'withdrawal'} request for ₹${transaction.amount} has been ${status === 'completed' ? 'approved' : 'declined'}.`,
    });
    
    if (isDeposit && pendingDeposits.length <= 1) setIsDepositModalOpen(false);
    if (!isDeposit && pendingWithdrawals.length <= 1) setIsWithdrawalModalOpen(false);
  };
  
  const getUserById = (userId: string) => allUsers.find(u => u.id === userId);

  const openDeclineDialog = (tx: Transaction) => {
    setTransactionToDecline(tx);
  }

  const confirmDecline = () => {
    if (!transactionToDecline) return;
    handleRequest(transactionToDecline.id, 'declined', transactionToDecline.type, declineReason);
    setTransactionToDecline(null);
  }
  
  const handleRefreshClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    loadData();
    toast({ title: "Dashboard Updated", description: "Pending requests have been refreshed." });
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold">Dashboard</h1>
         <Link href="/admin/settings">
          <Button variant="outline">
            <Settings className="mr-2" />
            Settings
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const cardContent = (
            <Card key={index} className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                {stat.icon && <stat.icon className="h-4 w-4 text-muted-foreground" />}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
          
          return stat.href ? <Link href={stat.href} key={index}>{cardContent}</Link> : <div key={index}>{cardContent}</div>;
        })}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <ArrowDownLeft className="text-green-500" />
                  Pending Deposits
                </CardTitle>
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefreshClick}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Badge variant="secondary">{pendingDeposits.length}</Badge>
                 </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Verify and approve user deposit requests.</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                  <div className="flex-1">
                      <DialogTitle>Pending Deposits</DialogTitle>
                      <DialogDescription>Review and approve deposit requests from users.</DialogDescription>
                  </div>
                  <DialogClose />
              </div>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              {pendingDeposits.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Ref No.</TableHead>
                      <TableHead>History</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingDeposits.map(tx => {
                      const user = getUserById(tx.userId);
                      return (
                        <TableRow key={tx.id}>
                          <TableCell>
                            {user ? (
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.avatarUrl} alt={user.username} />
                                  <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="font-medium">{user.username}</div>
                              </div>
                            ) : 'Unknown User'}
                          </TableCell>
                          <TableCell className="font-semibold">₹{tx.amount.toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-xs">{tx.paymentDetails?.upiId}</TableCell>
                           <TableCell>
                            {user && (
                              <Link href={`/admin/users/${user.id}/history?tab=transactions`}>
                                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                  <History className="h-4 w-4" />
                                  Transaction History
                                </Button>
                              </Link>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => openDeclineDialog(tx)}>Decline</Button>
                              <Button size="sm" onClick={() => handleRequest(tx.id, 'completed', 'credit')}>Approve</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">No pending deposits.</p>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isWithdrawalModalOpen} onOpenChange={setIsWithdrawalModalOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-headline text-lg flex items-center gap-2">
                        <ArrowUpRight className="text-red-500" />
                        Pending Withdrawals
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefreshClick}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Badge variant="destructive">{pendingWithdrawals.length}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Review and process user withdrawal requests.</p>
                </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
             <DialogHeader>
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <DialogTitle>Pending Withdrawals</DialogTitle>
                        <DialogDescription>Review and process withdrawal requests from users.</DialogDescription>
                    </div>
                    <DialogClose />
                </div>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              {pendingWithdrawals.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Details</TableHead>
                      <TableHead>History</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingWithdrawals.map(tx => {
                      const user = getUserById(tx.userId);
                      return (
                        <TableRow key={tx.id}>
                          <TableCell>
                            {user ? (
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.avatarUrl} alt={user.username} />
                                  <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="font-medium">{user.username}</div>
                              </div>
                            ) : 'Unknown User'}
                          </TableCell>
                          <TableCell className="font-semibold">₹{tx.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            {tx.paymentDetails ? (
                              <div className="text-xs">
                                <p className="font-bold uppercase">{tx.paymentDetails.method}</p>
                                {tx.paymentDetails.method === 'upi' && <p className="font-mono">{tx.paymentDetails.upiId}</p>}
                                {tx.paymentDetails.method === 'bank' && (
                                  <div className="font-mono">
                                    <p>{tx.paymentDetails.accountHolderName}</p>
                                    <p>A/C: {tx.paymentDetails.accountNumber}</p>
                                    <p>IFSC: {tx.paymentDetails.ifscCode}</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-muted-foreground">N/A</p>
                            )}
                          </TableCell>
                          <TableCell>
                            {user && (
                              <Link href={`/admin/users/${user.id}/history?tab=transactions`}>
                                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                  <History className="h-4 w-4" />
                                  Transaction History
                                </Button>
                              </Link>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                               <Button variant="outline" size="sm" onClick={() => openDeclineDialog(tx)}>Decline</Button>
                              <Button size="sm" onClick={() => handleRequest(tx.id, 'completed', 'debit')}>Approve</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">No pending withdrawals.</p>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

       <AlertDialog open={!!transactionToDecline} onOpenChange={(open) => !open && setTransactionToDecline(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reason for Decline</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for declining this transaction. This will be visible to the user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="decline-reason" className="sr-only">Decline Reason</Label>
            <Textarea 
              id="decline-reason" 
              placeholder="e.g., Invalid UPI reference number, screenshot unclear, etc." 
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTransactionToDecline(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDecline} disabled={!declineReason}>
              Confirm Decline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
