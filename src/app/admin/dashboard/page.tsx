
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockTournaments, mockUsers, mockTransactions as initialTransactions } from "@/lib/mock-data";
import { User, Transaction } from '@/lib/types';
import { DollarSign, Swords, Trophy, Users, Clock } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // In a real app, this data would be fetched from a server.
    // For now, we simulate this by using localStorage as a mock database.
    const storedUsers = localStorage.getItem('allUsers');
    const users: User[] = storedUsers ? JSON.parse(storedUsers) : mockUsers;
    setAllUsers(users);
    setTotalUsers(users.length);

    // For simplicity, we'll manage transactions in local state for this component.
    // A real app would use a centralized state management or server-side data fetching.
    const withdrawals = initialTransactions.filter(tx => tx.status === 'pending' && tx.type === 'debit');
    setPendingWithdrawals(withdrawals);

  }, []);

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
  
  const handleRequest = (transactionId: string, status: 'approved' | 'declined') => {
    // This is a mock implementation. A real app would update the database.
    const transaction = pendingWithdrawals.find(tx => tx.id === transactionId);
    if(!transaction) return;

    if (status === 'declined') {
        // If declined, refund the amount to the user's balance
        const userToRefund = allUsers.find(u => u.id === transaction.userId);
        if (userToRefund) {
            const updatedUsers = allUsers.map(u => 
                u.id === userToRefund.id 
                ? { ...u, walletBalance: u.walletBalance + transaction.amount } 
                : u
            );
            setAllUsers(updatedUsers);
            localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
        }
    }

    setPendingWithdrawals(prev => prev.filter(tx => tx.id !== transactionId));
    
    toast({
      title: `Request ${status}`,
      description: `The withdrawal request for ₹${transaction.amount} has been ${status}.`,
    });
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
       <Card>
        <CardHeader>
            <CardTitle className="font-headline">Pending Withdrawals</CardTitle>
            <CardDescription>Review and process user withdrawal requests.</CardDescription>
        </CardHeader>
        <CardContent>
            {pendingWithdrawals.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Payment Details</TableHead>
                            <TableHead>Date</TableHead>
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
                                                {tx.paymentDetails.method === 'upi' && <p>{tx.paymentDetails.upiId}</p>}
                                                {tx.paymentDetails.method === 'bank' && (
                                                    <div>
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
                                    <TableCell>{format(new Date(tx.createdAt), 'PP')}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button variant="outline" size="sm" onClick={() => handleRequest(tx.id, 'declined')}>Decline</Button>
                                            <Button size="sm" onClick={() => handleRequest(tx.id, 'approved')}>Approve</Button>
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
        </CardContent>
       </Card>
    </div>
  );
}
