
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
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, RefreshCw, XCircle, Clock, Edit, Trash2, Search } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';
  const { toast } = useToast();
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = useCallback(() => {
    const storedUsers = localStorage.getItem('allUsers');
    setUsers(storedUsers ? JSON.parse(storedUsers) : mockUsers);

    const storedTransactions = localStorage.getItem('allTransactions');
    const allTransactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions).map((t: any) => ({...t, createdAt: new Date(t.createdAt)})) : mockTransactions;
    setTransactions(allTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
  }, []);

  useEffect(() => {
    loadData();
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'allUsers' || event.key === 'allTransactions') {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', loadData);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', loadData);
    };
  }, [loadData]);
  
  const getUserForTx = (userId: string) => users.find(u => u.id === userId);
  
  const handleRefresh = () => {
    loadData();
    toast({ title: 'Transactions Reloaded', description: 'The transaction list has been updated.' });
  }

  const handleDeleteTransaction = () => {
    if (!transactionToDelete) return;
    
    // Read directly from storage to ensure we have the full global list
    const stored = localStorage.getItem('allTransactions');
    let allTransactions: Transaction[] = stored ? JSON.parse(stored) : [];
    
    // Remove the specific transaction
    const updatedTransactions = allTransactions.filter(tx => tx.id !== transactionToDelete.id);
    
    // Save back to global storage so it's removed from user panels too
    localStorage.setItem('allTransactions', JSON.stringify(updatedTransactions));
    
    // Update local state for immediate feedback
    setTransactions(updatedTransactions.map(t => ({...t, createdAt: new Date(t.createdAt)})).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    
    toast({
      title: "Transaction Deleted",
      description: `The transaction has been removed from the system and user panels.`,
    });
    setTransactionToDelete(null);
  };
  
  const filteredTransactions = transactions.filter(tx => 
    tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {txs.map(tx => {
                    const user = getUserForTx(tx.userId);
                    return (
                       <Dialog key={tx.id}>
                        <TableRow>
                           <DialogTrigger asChild>
                            <TableCell className="cursor-pointer">
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
                           </DialogTrigger>
                            <DialogTrigger asChild><TableCell className="cursor-pointer">{tx.description}</TableCell></DialogTrigger>
                            <DialogTrigger asChild><TableCell className="cursor-pointer">{format(new Date(tx.createdAt), 'PPp')}</TableCell></DialogTrigger>
                            <DialogTrigger asChild>
                              <TableCell className="cursor-pointer">
                                  <Badge variant={tx.status === 'pending' ? 'outline' : tx.status === 'declined' ? 'destructive' : 'default'} className="capitalize flex items-center gap-1">
                                      {tx.status === 'pending' && <Clock className="h-3 w-3" />}
                                      {tx.status === 'declined' && <XCircle className="h-3 w-3" />}
                                      {tx.status}
                                  </Badge>
                              </TableCell>
                            </DialogTrigger>
                            <DialogTrigger asChild>
                              <TableCell className={`text-right font-bold cursor-pointer ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                                  {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                              </TableCell>
                            </DialogTrigger>
                             <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => setTransactionToDelete(tx)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </TableCell>
                         </TableRow>
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
                                {tx.paymentDetails.method === 'binance' && (
                                    <>
                                        {tx.paymentDetails.binanceNickname && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Nickname:</span>
                                                <span className="font-medium">{tx.paymentDetails.binanceNickname}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Binance ID:</span>
                                            <span className="font-mono text-xs">{tx.paymentDetails.binanceId}</span>
                                        </div>
                                    </>
                                )}
                                {tx.paymentDetails.method === 'paypal' && tx.paymentDetails.paypalEmail && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">PayPal Email:</span>
                                        <span className="font-mono text-xs">{tx.paymentDetails.paypalEmail}</span>
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
                              {user && (
                                <Link href={`/admin/users/edit/${user.id}`}>
                                  <Button variant="secondary">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit User
                                  </Button>
                                </Link>
                              )}
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

  const deposits = filteredTransactions.filter(tx => tx.type === 'credit' && (tx.description.toLowerCase().includes('deposit') || tx.description.toLowerCase().includes('added to wallet')));
  const withdrawals = filteredTransactions.filter(tx => tx.type === 'debit' && tx.description.toLowerCase().includes('withdrawal'));
  const declined = filteredTransactions.filter(tx => tx.status === 'declined');
  const pending = filteredTransactions.filter(tx => tx.status === 'pending');
  const prizes = filteredTransactions.filter(tx => tx.description.toLowerCase().includes('prize'));
  const referrals = filteredTransactions.filter(tx => tx.description.toLowerCase().includes('referral'));
  const bonuses = filteredTransactions.filter(tx => 
    (tx.description.toLowerCase().includes('bonus') || tx.description.toLowerCase().includes('promotion')) && 
    !tx.description.toLowerCase().includes('referral')
  );

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
                <p className="text-muted-foreground">Detailed history of all financial activities.</p>
            </div>
        </div>
        <div className='flex items-center gap-2'>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search ID or description..."
                    className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh Transactions</span>
            </Button>
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <ScrollArea className="w-full">
            <TabsList className="inline-flex w-max min-w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="deposits">Deposits</TabsTrigger>
                <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                <TabsTrigger value="prizes">Prizes</TabsTrigger>
                <TabsTrigger value="referrals">Referrals</TabsTrigger>
                <TabsTrigger value="bonuses">Bonuses</TabsTrigger>
                <TabsTrigger value="declined">Declined</TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <TabsContent value="all" className="mt-4">
            <Card>
                <CardContent className='p-0'>
                    <TransactionTable txs={filteredTransactions} />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
            <Card>
                <CardContent className='p-0'>
                    <TransactionTable txs={pending} />
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
        <TabsContent value="prizes" className="mt-4">
            <Card>
                <CardContent className='p-0'>
                    <TransactionTable txs={prizes} />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="referrals" className="mt-4">
            <Card>
                <CardContent className='p-0'>
                    <TransactionTable txs={referrals} />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="bonuses" className="mt-4">
            <Card>
                <CardContent className='p-0'>
                    <TransactionTable txs={bonuses} />
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
      <AlertDialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the transaction record from both the admin and the user panels.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTransactionToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
