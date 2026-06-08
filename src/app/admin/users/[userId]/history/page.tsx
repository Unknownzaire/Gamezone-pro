
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, use } from 'react';
import { User, Tournament, Participant, Transaction } from '@/lib/types';
import { mockTournaments, mockUsers, mockTransactions } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Wallet, Hourglass, ArrowUpRight, ArrowDownLeft, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
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
import { useToast } from '@/hooks/use-toast';

type UserMatchHistory = {
  tournament: Tournament;
  participant: Participant;
};

export default function UserHistoryPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [matchHistory, setMatchHistory] = useState<UserMatchHistory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'credit' | 'debit' | 'pending'>('all');
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const loadData = useCallback(() => {
    if (!userId) return;

    const storedUsers = localStorage.getItem('allUsers');
    const allUsers: User[] = storedUsers ? JSON.parse(storedUsers) : mockUsers;
    
    const foundUser = allUsers.find(u => u.id === userId);
    
    if (foundUser) {
      setUser(foundUser);
      
      const history: UserMatchHistory[] = [];
      const storedTournaments = localStorage.getItem('allTournaments');
      const allTournaments = storedTournaments ? JSON.parse(storedTournaments).map((t: any) => ({...t, matchTime: new Date(t.matchTime)})) : mockTournaments;
      allTournaments.forEach(tournament => {
        const participantRecord = tournament.participants.find(p => p.user.id === userId);
        if (participantRecord) {
          history.push({ tournament, participant: participantRecord });
        }
      });
      setMatchHistory(history.sort((a,b) => new Date(b.tournament.matchTime).getTime() - new Date(a.tournament.matchTime).getTime()));

      const storedTransactions = localStorage.getItem('allTransactions');
      const allTransactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions).map((t: any) => ({...t, createdAt: new Date(t.createdAt)})) : mockTransactions;
      setTransactions(allTransactions.filter(tx => tx.userId === userId));

    } else {
        router.push('/admin/users');
    }
    
    setLoading(false);
  }, [userId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteTransaction = () => {
    if (!transactionToDelete) return;
    
    const stored = localStorage.getItem('allTransactions');
    let allTransactions: Transaction[] = stored ? JSON.parse(stored) : [];
    
    const updatedTransactions = allTransactions.filter(tx => tx.id !== transactionToDelete.id);
    localStorage.setItem('allTransactions', JSON.stringify(updatedTransactions));
    
    toast({
      title: "Transaction Deleted",
      description: `The transaction has been removed from global history.`,
    });
    
    setTransactionToDelete(null);
    loadData(); // Reload to refresh local lists
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>User not found. Redirecting...</div>;
  }

  const sortedTransactions = [...transactions].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const filteredTransactions = sortedTransactions.filter(tx => {
    if (transactionFilter === 'all') return true;
    if (transactionFilter === 'pending') return tx.status === 'pending';
    return tx.type === transactionFilter && tx.status !== 'pending';
  });

  const pendingAmount = transactions.filter(tx => tx.status === 'pending').reduce((acc, tx) => {
      return acc + tx.amount;
  }, 0);
  
  const pendingDebits = transactions
      .filter(tx => tx.status === 'pending' && tx.type === 'debit')
      .reduce((acc, tx) => acc + tx.amount, 0);
  
  const availableBalance = user.walletBalance - pendingDebits;

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-headline text-3xl font-bold">User History</h1>
          <p className="text-muted-foreground">Viewing history for {user.username}</p>
        </div>
      </div>
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatarUrl} alt={user.username} />
                        <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle>{user.username}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="matches" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="matches">Match History</TabsTrigger>
                        <TabsTrigger value="transactions">Transaction History</TabsTrigger>
                    </TabsList>
                    <TabsContent value="matches" className="mt-4">
                        {matchHistory.length > 0 ? (
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Tournament</TableHead>
                                <TableHead>Result</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {matchHistory.map(({ tournament, participant }) => (
                                <TableRow key={tournament.id}>
                                <TableCell className="font-medium">{tournament.title}</TableCell>
                                <TableCell>
                                    <Badge variant={participant.result === 'Winner' ? 'default' : 'outline'}>
                                    {participant.result ?? 'Participated'}
                                    </Badge>
                                </TableCell>
                                <TableCell>{format(new Date(tournament.matchTime), 'PP')}</TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/admin/tournaments/edit/${tournament.id}`}>
                                        <Button variant="ghost" size="icon">
                                            <Edit className="h-4 w-4" />
                                            <span className="sr-only">Edit Tournament</span>
                                        </Button>
                                    </Link>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                        ) : (
                        <p className="text-center text-muted-foreground p-4">This user has not participated in any tournaments yet.</p>
                        )}
                    </TabsContent>
                    <TabsContent value="transactions" className="mt-4">
                       {sortedTransactions.length > 0 ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                                        <Wallet className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
                                        <Hourglass className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">₹{pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </CardContent>
                                </Card>
                            </div>
                             <div className="flex items-center gap-2">
                                <Button size="sm" variant={transactionFilter === 'all' ? 'default' : 'outline'} onClick={() => setTransactionFilter('all')}>All</Button>
                                <Button size="sm" variant={transactionFilter === 'credit' ? 'default' : 'outline'} onClick={() => setTransactionFilter('credit')}>Credit</Button>
                                <Button size="sm" variant={transactionFilter === 'debit' ? 'default' : 'outline'} onClick={() => setTransactionFilter('debit')}>Debit</Button>
                                <Button size="sm" variant={transactionFilter === 'pending' ? 'default' : 'outline'} onClick={() => setTransactionFilter('pending')}>Pending</Button>
                             </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Details</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions.map(tx => (
                                        <TableRow key={tx.id}>
                                            <TableCell>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                                                            <div className="p-2 bg-muted rounded-full">
                                                                {tx.type === 'credit' ? <ArrowDownLeft className="h-4 w-4 text-green-500" /> : <ArrowUpRight className="h-4 w-4 text-red-500" />}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{tx.description}</p>
                                                                <Badge variant={tx.status === 'pending' ? 'outline' : tx.status === 'declined' ? 'destructive' : 'default'} className="capitalize mt-1">{tx.status}</Badge>
                                                            </div>
                                                        </div>
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
                                                            {tx.paymentDetails && (
                                                                <>
                                                                <Separator />
                                                                <p className="font-semibold">Payment Details</p>
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">Method:</span>
                                                                    <span className="font-medium uppercase">{tx.paymentDetails.method}</span>
                                                                </div>
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
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{format(new Date(tx.createdAt), 'PPp')}</TableCell>
                                             <TableCell className={`text-right font-bold ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                                                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setTransactionToDelete(tx)}>
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                       ) : (
                         <p className="text-center text-muted-foreground p-4">This user has no transactions yet.</p>
                       )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>

        <AlertDialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently remove this record from both the admin history and the user's wallet history panel. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setTransactionToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteTransaction} className="bg-destructive hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
