
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockTransactions, mockUsers } from "@/lib/mock-data";
import { Transaction, User } from "@/lib/types";
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, RefreshCw, XCircle, Clock } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';
  const { toast } = useToast();

  const loadData = useCallback(() => {
    const storedUsers = localStorage.getItem('allUsers');
    setUsers(storedUsers ? JSON.parse(storedUsers) : mockUsers);

    const storedTransactions = localStorage.getItem('allTransactions');
    const allTransactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions).map((t: any) => ({...t, createdAt: new Date(t.createdAt)})) : mockTransactions;
    setTransactions(allTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
    };
  }, [loadData]);
  
  const getUserForTx = (userId: string) => users.find(u => u.id === userId);
  
  const handleRefresh = () => {
    loadData();
    toast({ title: 'Transactions Reloaded', description: 'The transaction list has been updated.' });
  }

  const TransactionTable = ({ txs }: { txs: Transaction[] }) => {
    if (txs.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No transactions in this category.</p>;
    }
    
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {txs.map(tx => {
                    const user = getUserForTx(tx.userId);
                    return (
                       <Dialog key={tx.id}>
                        <DialogTrigger asChild>
                         <TableRow className="cursor-pointer">
                            <TableCell>
                                {user ? (
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.avatarUrl} alt={user.username} />
                                            <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{user.username}</span>
                                    </div>
                                ) : (
                                    <span>Unknown User</span>
                                )}
                            </TableCell>
                            <TableCell>{tx.description}</TableCell>
                            <TableCell>{format(new Date(tx.createdAt), 'PPp')}</TableCell>
                            <TableCell>
                                <Badge variant={tx.status === 'pending' ? 'outline' : tx.status === 'declined' ? 'destructive' : 'default'} className="capitalize flex items-center gap-1">
                                    {tx.status === 'pending' && <Clock className="h-3 w-3" />}
                                    {tx.status === 'declined' && <XCircle className="h-3 w-3" />}
                                    {tx.status}
                                </Badge>
                            </TableCell>
                            <TableCell className={`text-right font-bold ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                            </TableCell>
                         </TableRow>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                            <DialogTitle>Transaction Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Transaction ID:</span>
                                <span className="font-mono text-xs">{tx.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">User:</span>
                                <span className="font-medium">{user?.username || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Date:</span>
                                <span className="font-medium">{format(new Date(tx.createdAt), 'PPp')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Description:</span>
                                <span className="font-medium">{tx.description}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Amount:</span>
                                <span className={`font-bold ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Type:</span>
                                <span className="font-medium capitalize">{tx.type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <Badge variant={tx.status === 'pending' ? 'outline' : tx.status === 'declined' ? 'destructive' : 'default'} className="capitalize">{tx.status}</Badge>
                            </div>
                            {tx.status === 'declined' && tx.declineReason && (
                                <div className="flex justify-between items-start">
                                <span className="text-muted-foreground">Reason:</span>
                                <span className="font-medium text-right text-destructive w-2/3">{tx.declineReason}</span>
                                </div>
                            )}
                            {tx.paymentDetails && (
                                <>
                                <Separator />
                                <p className="font-semibold">Payment Details</p>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Method:</span>
                                    <span className="font-medium uppercase">{tx.paymentDetails.method}</span>
                                </div>
                                {tx.paymentDetails.method === 'upi' && tx.paymentDetails.upiId && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{tx.description.includes('Withdrawal') ? 'UPI ID:' : 'Reference No.:'}</span>
                                        <span className="font-mono text-xs">{tx.paymentDetails.upiId}</span>
                                    </div>
                                )}
                                {tx.paymentDetails.method === 'bank' && (
                                    <>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Account Holder:</span>
                                        <span>{tx.paymentDetails.accountHolderName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Account Number:</span>
                                        <span>{tx.paymentDetails.accountNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">IFSC Code:</span>
                                        <span className="font-mono">{tx.paymentDetails.ifscCode}</span>
                                    </div>
                                    </>
                                )}
                                </>
                            )}
                            </div>
                            <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Close</Button>
                            </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                       </Dialog>
                    )
                })}
            </TableBody>
        </Table>
    )
  }

  const deposits = transactions.filter(tx => tx.type === 'credit' && tx.description.toLowerCase().includes('deposit') && tx.status === 'completed');
  const withdrawals = transactions.filter(tx => tx.type === 'debit' && tx.description.toLowerCase().includes('withdrawal') && tx.status === 'completed');
  const declined = transactions.filter(tx => tx.status === 'declined');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className='flex items-center gap-4'>
            <Link href="/admin/dashboard">
                <Button variant="outline" size="icon" className="h-7 w-7">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
            </Link>
            <div>
                <h1 className="font-headline text-3xl font-bold">Transaction History</h1>
                <p className="text-muted-foreground">A log of all deposits and withdrawals.</p>
            </div>
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">Refresh Transactions</span>
        </Button>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="declined">Declined</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
            <Card>
                <CardContent className='p-0'>
                    <TransactionTable txs={transactions} />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="deposits" className="mt-4">
            <Card>
                <CardContent className='p-0'>
                    <TransactionTable txs={deposits} />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="withdrawals" className="mt-4">
            <Card>
                <CardContent className='p-0'>
                    <TransactionTable txs={withdrawals} />
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="declined" className="mt-4">
            <Card>
                <CardContent className='p-0'>
                    <TransactionTable txs={declined} />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
