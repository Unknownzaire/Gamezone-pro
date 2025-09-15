
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockTournaments, mockUsers, mockTransactions as initialTransactions } from "@/lib/mock-data";
import { User, Transaction } from '@/lib/types';
import { DollarSign, Swords, Trophy, Users, Clock, ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [pendingDeposits, setPendingDeposits] = useState<Transaction[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const { toast } = useToast();
  
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

  const loadData = useCallback(() => {
    const storedUsers = localStorage.getItem('allUsers');
    const users: User[] = storedUsers ? JSON.parse(storedUsers) : mockUsers;
    setAllUsers(users);
    setTotalUsers(users.length);

    const storedTransactions = localStorage.getItem('allTransactions');
    const allTransactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions).map((t: any) => ({...t, createdAt: new Date(t.createdAt)})) : initialTransactions;

    setPendingDeposits(allTransactions.filter(tx => tx.status === 'pending' && tx.type === 'credit'));
    setPendingWithdrawals(allTransactions.filter(tx => tx.status === 'pending' && tx.type === 'debit'));
    console.log("Data reloaded");
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const totalTournaments = mockTournaments.length;
  const totalPrizeDistributed = mockTournaments
    .filter(t => t.status === 'Completed')
    .reduce((acc, t) => acc + t.prizePool, 0);
  const totalRevenue = mockTournaments
    .filter(t => t.status === 'Completed')
    .reduce((acc, t) => acc + t.prizePool * (t.commissionPercentage / 100), 0);

  const stats = [
    { title: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, href: null },
    { title: "Total Users", value: totalUsers, icon: Users, href: '/admin/users' },
    { title: "Total Tournaments", value: totalTournaments, icon: Swords, href: '/admin/tournaments' },
    { title: "Prize Distributed", value: `₹${totalPrizeDistributed.toLocaleString()}`, icon: Trophy, href: null },
  ];
  
  const handleRequest = (transactionId: string, status: 'completed' | 'declined', type: 'credit' | 'debit') => {
    const isDeposit = type === 'credit';
    const transactionList = isDeposit ? pendingDeposits : pendingWithdrawals;
    const setTransactionList = isDeposit ? setPendingDeposits : setPendingWithdrawals;
    
    const transaction = transactionList.find(tx => tx.id === transactionId);
    if(!transaction) return;

    let updatedUsers = [...allUsers];
    const userToUpdate = allUsers.find(u => u.id === transaction.userId);

    if (userToUpdate) {
        if (status === 'completed') {
            if (isDeposit) {
                // Add to balance for approved deposit
                updatedUsers = updatedUsers.map(u => 
                    u.id === userToUpdate.id 
                    ? { ...u, walletBalance: u.walletBalance + transaction.amount } 
                    : u
                );
            }
            // For approved withdrawal, balance is already deducted on request. No change needed here.
        } else { // Declined
            if (!isDeposit) {
                // Refund to balance for declined withdrawal
                updatedUsers = updatedUsers.map(u => 
                    u.id === userToUpdate.id 
                    ? { ...u, walletBalance: u.walletBalance + transaction.amount } 
                    : u
                );
            }
            // For declined deposit, no change to balance.
        }
    }

    setAllUsers(updatedUsers);
    localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
    
    const storedTransactions = localStorage.getItem('allTransactions');
    let allTransactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions) : initialTransactions;
    allTransactions = allTransactions.map(t => t.id === transactionId ? {...t, status: status } : t);
    localStorage.setItem('allTransactions', JSON.stringify(allTransactions));

    setTransactionList(prev => prev.filter(tx => tx.id !== transactionId));
    
    toast({
      title: `Request ${status === 'completed' ? 'Approved' : 'Declined'}`,
      description: `The ${isDeposit ? 'deposit' : 'withdrawal'} request for ₹${transaction.amount} has been ${status === 'completed' ? 'approved' : 'declined'}.`,
    });
    
    if (isDeposit && pendingDeposits.length <= 1) setIsDepositModalOpen(false);
    if (!isDeposit && pendingWithdrawals.length <= 1) setIsWithdrawalModalOpen(false);
  };
  
  const getUserById = (userId: string) => allUsers.find(u => u.id === userId);

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const cardContent = (
            <Card key={index} className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
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
                 <Badge variant="secondary">{pendingDeposits.length}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Verify and approve user deposit requests.</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader className="flex-row items-center justify-between">
                <div>
                    <DialogTitle>Pending Deposits</DialogTitle>
                    <DialogDescription>Review and approve deposit requests from users.</DialogDescription>
                </div>
                <Button variant="outline" size="icon" onClick={loadData} className="relative -top-2 -right-2">
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Refresh</span>
                </Button>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              {pendingDeposits.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Ref No.</TableHead>
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
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => handleRequest(tx.id, 'declined', 'credit')}>Decline</Button>
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
             <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground" />

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
                    <Badge variant="destructive">{pendingWithdrawals.length}</Badge>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Review and process user withdrawal requests.</p>
                </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
             <DialogHeader className="flex-row items-center justify-between">
                <div>
                    <DialogTitle>Pending Withdrawals</DialogTitle>
                    <DialogDescription>Review and process withdrawal requests from users.</DialogDescription>
                </div>
                  <Button variant="outline" size="icon" onClick={loadData} className="relative -top-2 -right-2">
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Refresh</span>
                </Button>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              {pendingWithdrawals.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Details</TableHead>
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
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => handleRequest(tx.id, 'declined', 'debit')}>Decline</Button>
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
    </div>
  );
}
