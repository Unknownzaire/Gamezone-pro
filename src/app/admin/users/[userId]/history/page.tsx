'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { User, Tournament, Transaction } from '@/lib/types';
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

// FIREBASE IMPORTS
import { useFirebase } from '@/firebase';
import { doc, onSnapshot, collection, query, orderBy, deleteDoc, Timestamp } from 'firebase/firestore';

type UserMatchHistory = {
  tournament: Tournament;
  participantResult: string | null;
};

export default function UserHistoryPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const [user, setUser] = useState<User | null>(null);
  const [matchHistory, setMatchHistory] = useState<UserMatchHistory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'credit' | 'debit' | 'pending'>('all');
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!firestore || !userId) return;

    // User Profile Listener
    const unsubUser = onSnapshot(doc(firestore, 'users', userId), (snap) => {
      if (snap.exists()) setUser({ id: snap.id, ...snap.data() } as User);
      else router.push('/admin/users');
    });

    // Transaction History Listener
    const qTx = query(collection(firestore, 'users', userId, 'transactions'), orderBy('createdAt', 'desc'));
    const unsubTx = onSnapshot(qTx, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date())
        } as Transaction;
      });
      setTransactions(list);
    });

    // Match History Listener (derived from tournaments)
    const unsubTournaments = onSnapshot(collection(firestore, 'tournaments'), (snapshot) => {
      const history: UserMatchHistory[] = [];
      snapshot.docs.forEach(snap => {
        const data = snap.data();
        const participants = data.participants || [];
        const myP = participants.find((p: any) => p.user.id === userId);
        if (myP) {
          history.push({
            tournament: { id: snap.id, ...data } as Tournament,
            participantResult: myP.result
          });
        }
      });
      setMatchHistory(history);
      setLoading(false);
    });

    return () => {
      unsubUser();
      unsubTx();
      unsubTournaments();
    };
  }, [firestore, userId, router]);

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete || !firestore || !userId) return;
    try {
      await deleteDoc(doc(firestore, 'users', userId, 'transactions', transactionToDelete.id));
      toast({ title: "Transaction Deleted" });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: "Error" });
    }
    setTransactionToDelete(null);
  };

  if (loading || !user) return <div className="p-8 text-center">Fetching user history...</div>;

  const filteredTransactions = transactions.filter(tx => {
    if (transactionFilter === 'all') return true;
    if (transactionFilter === 'pending') return tx.status === 'pending';
    return tx.type === transactionFilter && tx.status !== 'pending';
  });

  const pendingAmount = transactions.filter(tx => tx.status === 'pending').reduce((acc, tx) => acc + tx.amount, 0);
  const pendingDebits = transactions.filter(tx => tx.status === 'pending' && tx.type === 'debit').reduce((acc, tx) => acc + tx.amount, 0);
  const availableBalance = user.walletBalance - pendingDebits;

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
        <Link href="/admin/users"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
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
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {matchHistory.map(({ tournament, participantResult }) => (
                                <TableRow key={tournament.id}>
                                <TableCell className="font-medium">{tournament.title}</TableCell>
                                <TableCell>
                                    <Badge variant={participantResult === 'Winner' ? 'default' : 'outline'}>
                                    {participantResult ?? 'Participated'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/admin/tournaments/${tournament.id}`}>
                                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                    </Link>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                        ) : (
                        <p className="text-center text-muted-foreground p-4">No match history found.</p>
                        )}
                    </TabsContent>
                    <TabsContent value="transactions" className="mt-4">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Available</div><div className="text-lg font-bold">₹{availableBalance.toLocaleString()}</div></CardContent></Card>
                                <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Pending</div><div className="text-lg font-bold">₹{pendingAmount.toLocaleString()}</div></CardContent></Card>
                            </div>
                             <div className="flex items-center gap-2">
                                {['all', 'credit', 'debit', 'pending'].map(f => (
                                    <Button key={f} size="sm" variant={transactionFilter === f ? 'default' : 'outline'} className="capitalize" onClick={() => setTransactionFilter(f as any)}>{f}</Button>
                                ))}
                             </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Details</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions.map(tx => (
                                        <TableRow key={tx.id}>
                                            <TableCell>
                                                <div className="text-sm font-medium">{tx.description}</div>
                                                <div className="text-[10px] text-muted-foreground">{format(tx.createdAt, 'PPp')}</div>
                                            </TableCell>
                                             <TableCell className={`text-right font-bold ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                                                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setTransactionToDelete(tx)}><Trash2 className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>

        <AlertDialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete Record?</AlertDialogTitle></AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteTransaction} className="bg-destructive">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
