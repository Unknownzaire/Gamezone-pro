
'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Transaction, Tournament, PromotionalAd, SupportTicket, RedeemCode } from '@/lib/types';
import { DollarSign, Swords, Users, BarChart3, Banknote, RefreshCw, Settings, History, ArrowDownLeft, ArrowUpRight, Gift, Megaphone, UserPlus, LifeBuoy, Ticket, Pencil, Tags } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

// FIREBASE IMPORTS
import { 
  collection, 
  collectionGroup, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  runTransaction, 
  Timestamp, 
  orderBy 
} from 'firebase/firestore';
import { useFirebase } from '@/firebase';

export default function AdminDashboardPage() {
  const { firestore } = useFirebase();
  const [totalUsers, setTotalUsers] = useState(0);
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Transaction[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [activeAdsCount, setActiveAdsCount] = useState(0);
  const [openSupportTicketsCount, setOpenSupportTicketsCount] = useState(0);
  const [activeRoyalPassCount, setActiveRoyalPassCount] = useState(0);
  const [activeGiveawaysCount, setActiveGiveawaysCount] = useState(0);
  const [activeRedeemCodesCount, setActiveRedeemCodesCount] = useState(0);

  const { toast } = useToast();
  
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  
  const [transactionToDecline, setTransactionToDecline] = useState<Transaction | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  const [transactionToEditAmount, setTransactionToEditAmount] = useState<Transaction | null>(null);
  const [editAmountValue, setEditAmountValue] = useState('');
  const [isEditAmountDialogOpen, setIsEditAmountDialogOpen] = useState(false);

  useEffect(() => {
    if (!firestore) return;

    // Users listener
    const unsubUsers = onSnapshot(collection(firestore, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
      setAllUsers(usersData);
      setTotalUsers(usersData.length);
      setActiveRoyalPassCount(usersData.filter(u => u.hasRoyalPass).length);
    });

    // Tournaments listener
    const unsubTournaments = onSnapshot(collection(firestore, 'tournaments'), (snapshot) => {
      const tournamentsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          matchTime: data.matchTime instanceof Timestamp ? data.matchTime.toDate() : (data.matchTime ? new Date(data.matchTime) : new Date())
        };
      }) as Tournament[];
      setAllTournaments(tournamentsData);
    });

    // Transactions listener (Collection Group)
    const unsubTransactions = onSnapshot(query(collectionGroup(firestore, 'transactions'), orderBy('createdAt', 'desc')), (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date())
        };
      }) as Transaction[];
      setAllTransactions(transactionsData);
      setPendingWithdrawals(transactionsData.filter(tx => tx.status === 'pending' && tx.type === 'debit'));
      setPendingDeposits(transactionsData.filter(tx => tx.status === 'pending' && tx.type === 'credit'));
    });

    // Promotional Ads listener
    const unsubAds = onSnapshot(collection(firestore, 'promotionalAds'), (snapshot) => {
      const ads = snapshot.docs.map(doc => doc.data()) as PromotionalAd[];
      setActiveAdsCount(ads.filter(ad => ad.status === 'active').length);
    });

    // Support Tickets listener
    const unsubTickets = onSnapshot(collection(firestore, 'supportTickets'), (snapshot) => {
      const tickets = snapshot.docs.map(doc => doc.data()) as SupportTicket[];
      setOpenSupportTicketsCount(tickets.filter(ticket => ticket.status === 'open').length);
    });

    // Giveaways listener
    const unsubGiveaways = onSnapshot(collection(firestore, 'luckyDrawSettingsList'), (snapshot) => {
      const giveaways = snapshot.docs.map(doc => doc.data()) as any[];
      setActiveGiveawaysCount(giveaways.filter(g => g.isActive).length);
    });

    // Redeem Codes listener
    const unsubCodes = onSnapshot(collection(firestore, 'redeemCodes'), (snapshot) => {
      const codes = snapshot.docs.map(doc => doc.data()) as RedeemCode[];
      setActiveRedeemCodesCount(codes.filter(c => c.status === 'active').length);
    });

    return () => {
      unsubUsers();
      unsubTournaments();
      unsubTransactions();
      unsubAds();
      unsubTickets();
      unsubGiveaways();
      unsubCodes();
    };
  }, [firestore]);

  const completedTournaments = useMemo(() => allTournaments.filter((t: Tournament) => t.status === 'Completed'), [allTournaments]);
  const totalTournaments = completedTournaments.length;
  const totalPrizeDistributed = useMemo(() => completedTournaments.reduce((acc, t) => acc + t.prizePool, 0), [completedTournaments]);

  const totalRevenue = useMemo(() => completedTournaments.reduce((acc, t) => {
    const totalCollected = (t.participants?.length || 0) * t.entryFee;
    const revenueFromTournament = totalCollected * (t.commissionPercentage / 100);
    return acc + revenueFromTournament;
  }, 0), [completedTournaments]);

  const totalDeposits = useMemo(() => allTransactions
    .filter(tx => tx.type === 'credit' && tx.status === 'completed')
    .reduce((acc, tx) => acc + tx.amount, 0), [allTransactions]);

  const totalWithdrawals = useMemo(() => allTransactions
    .filter(tx => tx.type === 'debit' && tx.status === 'completed' && tx.description.toLowerCase().includes('withdrawal'))
    .reduce((acc, tx) => acc + tx.amount, 0), [allTransactions]);
    
  const totalPromotions = useMemo(() => allTransactions
    .filter(tx => tx.type === 'credit' && tx.status === 'completed' && (tx.description.toLowerCase().includes('promotion') || tx.description.toLowerCase().includes('bonus')))
    .reduce((acc, tx) => acc + tx.amount, 0), [allTransactions]);

  const totalReferredUsers = useMemo(() => allUsers.filter(u => u.referredBy).length, [allUsers]);

  const stats = useMemo(() => [
    { title: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, href: '/admin/revenue-report' },
    { title: "All Users", value: totalUsers, icon: Users, href: '/admin/users' },
    { title: "Active Giveaways", value: activeGiveawaysCount, icon: Gift, href: '/admin/royal-pass'},
    { title: "Redeem Codes", value: activeRedeemCodesCount, icon: Tags, href: '/admin/redeem-codes' },
    { title: "Prize Distributed", value: `₹${totalPrizeDistributed.toLocaleString()}`, icon: BarChart3, href: '/admin/reports' },
    { title: "Total Tournaments", value: totalTournaments, icon: Swords, href: '/admin/tournaments' },
  ], [totalRevenue, totalUsers, activeGiveawaysCount, activeRedeemCodesCount, totalPrizeDistributed, totalTournaments]);
  
  const handleRequest = async (transactionId: string, newStatus: 'completed' | 'declined', type: 'credit' | 'debit', reason?: string) => {
    if (!firestore) return;

    const tx = allTransactions.find(t => t.id === transactionId);
    if (!tx || !tx.userId) {
      toast({ variant: 'destructive', title: "Error", description: "Transaction details not found." });
      return;
    }

    const userId = tx.userId;
    const userRef = doc(firestore, 'users', userId);
    const txRef = doc(firestore, 'users', userId, 'transactions', transactionId);

    try {
      await runTransaction(firestore, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        const txSnap = await transaction.get(txRef);

        if (!userSnap.exists() || !txSnap.exists()) throw new Error("Missing document.");

        const userData = userSnap.data() as User;
        const txData = txSnap.data() as Transaction;

        if (txData.status !== 'pending') throw new Error("Transaction is not pending.");

        transaction.update(txRef, { status: newStatus, declineReason: reason || null });

        if (type === 'credit' && newStatus === 'completed') {
          transaction.update(userRef, { walletBalance: (userData.walletBalance || 0) + txData.amount });
        }
        
        if (type === 'debit' && newStatus === 'declined') {
          transaction.update(userRef, { walletBalance: (userData.walletBalance || 0) + txData.amount });
          
          const refundRef = doc(collection(firestore, 'users', userId, 'transactions'));
          transaction.set(refundRef, {
            userId,
            amount: txData.amount,
            type: 'credit',
            description: `Refund for declined withdrawal: ${txData.description}`,
            createdAt: Timestamp.now(),
            status: 'completed'
          });
        }
      });

      toast({
        title: `Request ${newStatus === 'completed' ? 'Approved' : 'Declined'}`,
        description: `The ${type === 'credit' ? 'deposit' : 'withdrawal'} request for ₹${tx.amount} has been ${newStatus}.`,
      });
    } catch (e: any) {
      console.error(e);
      toast({ variant: 'destructive', title: "Error", description: e.message || "Operation failed." });
    }
  };
  
  const getUserById = useCallback((userId: string) => allUsers.find(u => u.id === userId), [allUsers]);

  const openDeclineDialog = (tx: Transaction) => setTransactionToDecline(tx);

  const confirmDecline = () => {
    if (!transactionToDecline) return;
    handleRequest(transactionToDecline.id, 'declined', transactionToDecline.type, declineReason);
    setTransactionToDecline(null);
    setDeclineReason('');
  }

  const handleSaveAmount = async () => {
    if (!transactionToEditAmount || !editAmountValue || !firestore) return;
    const amount = parseFloat(editAmountValue);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: "Invalid Amount" });
      return;
    }

    try {
      const txRef = doc(firestore, 'users', transactionToEditAmount.userId, 'transactions', transactionToEditAmount.id);
      await updateDoc(txRef, { amount });
      toast({ title: "Amount Updated" });
      setIsEditAmountDialogOpen(false);
      setTransactionToEditAmount(null);
      setEditAmountValue('');
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: "Error" });
    }
  };
  
  const handleRefreshClick = (e: React.MouseEvent, type: 'withdrawals' | 'deposits') => {
    e.stopPropagation();
    toast({ title: "Synced", description: `Pending ${type} are up to date.` });
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {stats.map((stat, index) => {
          const cardContent = (
            <Card key={index} className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">{stat.title}</CardTitle>
                {stat.icon && <stat.icon className="h-4 w-4 text-muted-foreground" />}
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
          return stat.href ? <Link href={stat.href} key={index}>{cardContent}</Link> : <div key={index}>{cardContent}</div>;
        })}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Link href="/admin/transactions?tab=deposits">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{totalDeposits.toLocaleString()}</div>
                </CardContent>
            </Card>
        </Link>
         <Link href="/admin/transactions?tab=withdrawals">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{totalWithdrawals.toLocaleString()}</div>
                </CardContent>
            </Card>
        </Link>
        <Link href="/admin/promotions">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Promotional Credit</CardTitle>
                    <Gift className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{totalPromotions.toLocaleString()}</div>
                </CardContent>
            </Card>
        </Link>
        <Link href="/admin/promotional-ads">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Ads</CardTitle>
                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeAdsCount}</div>
                </CardContent>
            </Card>
        </Link>
        <Link href="/admin/referrals">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Referred Users</CardTitle>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalReferredUsers}</div>
                </CardContent>
            </Card>
        </Link>
        <Link href="/admin/support">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                    <LifeBuoy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{openSupportTicketsCount}</div>
                </CardContent>
            </Card>
        </Link>
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
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleRefreshClick(e, 'deposits')}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Badge variant="default" className="bg-green-500">{pendingDeposits.length}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Review and process user deposit requests.</p>
                </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
             <DialogHeader>
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <DialogTitle>Pending Deposits</DialogTitle>
                        <DialogDescription>Review and process deposit requests from users.</DialogDescription>
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
                      <TableHead>Payment Details</TableHead>
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
                          <TableCell className="font-semibold">
                            <div className="flex items-center gap-2">
                              ₹{tx.amount.toLocaleString()}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => {
                                  setTransactionToEditAmount(tx);
                                  setEditAmountValue(tx.amount.toString());
                                  setIsEditAmountDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {tx.paymentDetails ? (
                              <div className="text-xs">
                                <p className="font-bold uppercase">{tx.paymentDetails.method}</p>
                                {tx.paymentDetails.method === 'upi' && <p>Ref: <span className="font-mono">{tx.paymentDetails.upiId}</span></p>}
                                {tx.paymentDetails.method === 'binance' && <p>Binance: <span className="font-mono">{tx.paymentDetails.binanceId}</span></p>}
                                {tx.paymentDetails.method === 'paypal' && <p>PayPal: <span className="font-mono">{tx.paymentDetails.paypalEmail}</span></p>}
                                {tx.paymentDetails.method === 'bank' && <p>A/C: <span className="font-mono">{tx.paymentDetails.accountNumber}</span></p>}
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
                                  History
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
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">show user payment request</p>
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
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleRefreshClick(e, 'withdrawals')}>
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
                                {tx.paymentDetails.method === 'binance' && (
                                  <div className="font-mono">
                                    <p>Nick: {tx.paymentDetails.binanceNickname || 'N/A'}</p>
                                    <p>ID: {tx.paymentDetails.binanceId}</p>
                                  </div>
                                )}
                                {tx.paymentDetails.method === 'paypal' && <p className="font-mono">{tx.paymentDetails.paypalEmail}</p>}
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
                                  History
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
                <p className="text-center text-muted-foreground py-8">show user payment request</p>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
       <AlertDialog open={!!transactionToDecline} onOpenChange={(open) => {if(!open) {setTransactionToDecline(null); setDeclineReason('');}}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reason for Decline</AlertDialogTitle>
            <AlertDialogDescription>Please provide a reason for declining this transaction.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="decline-reason" className="sr-only">Decline Reason</Label>
            <Textarea id="decline-reason" placeholder="Reason..." value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setTransactionToDecline(null); setDeclineReason('');}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDecline} disabled={!declineReason}>Confirm Decline</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={isEditAmountDialogOpen} onOpenChange={setIsEditAmountDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Deposit Amount</DialogTitle>
            <DialogDescription>Adjust the amount for this pending request.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">New Amount (₹)</Label>
              <Input id="edit-amount" type="number" value={editAmountValue} onChange={(e) => setEditAmountValue(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditAmountDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAmount}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
