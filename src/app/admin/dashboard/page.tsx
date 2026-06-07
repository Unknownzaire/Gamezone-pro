'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockTournaments, mockUsers, mockTransactions as initialTransactions } from "@/lib/mock-data";
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

export default function AdminDashboardPage() {
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

  const loadData = useCallback(() => {
    try {
      const storedUsers = localStorage.getItem('allUsers');
      const users: User[] = storedUsers ? JSON.parse(storedUsers).map((u: any) => ({...u, createdAt: u.createdAt ? new Date(u.createdAt) : new Date() })) : mockUsers;
      setAllUsers(users);
      setTotalUsers(users.length);

      const storedTransactions = localStorage.getItem('allTransactions');
      const transactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions).map((t: any) => ({...t, createdAt: new Date(t.createdAt)})) : initialTransactions;
      setAllTransactions(transactions);

      setPendingWithdrawals(transactions.filter(tx => tx.status === 'pending' && tx.type === 'debit'));
      setPendingDeposits(transactions.filter(tx => tx.status === 'pending' && tx.type === 'credit'));

      let tournamentsData: Tournament[] = [];
      const storedTournaments = localStorage.getItem('allTournaments');
      tournamentsData = storedTournaments ? JSON.parse(storedTournaments).map((t: any) => ({...t, matchTime: new Date(t.matchTime)})) : mockTournaments;
      setAllTournaments(tournamentsData);

      const storedAds = localStorage.getItem('promotionalAds');
      const ads: PromotionalAd[] = storedAds ? JSON.parse(storedAds) : [];
      setActiveAdsCount(ads.filter(ad => ad.status === 'active').length);

      const storedTickets = localStorage.getItem('supportTickets');
      const tickets: SupportTicket[] = storedTickets ? JSON.parse(storedTickets) : [];
      setOpenSupportTicketsCount(tickets.filter(ticket => ticket.status === 'open').length);

      setActiveRoyalPassCount(users.filter(u => u.hasRoyalPass).length);

      const storedGiveaways = localStorage.getItem('luckyDrawSettingsList');
      if (storedGiveaways) {
          const giveaways = JSON.parse(storedGiveaways);
          setActiveGiveawaysCount(giveaways.filter((g: any) => g.isActive).length);
      }

      const storedRedeemCodes = localStorage.getItem('redeemCodes');
      if (storedRedeemCodes) {
          const codes: RedeemCode[] = JSON.parse(storedRedeemCodes);
          setActiveRedeemCodesCount(codes.filter(c => c.status === 'active').length);
      }

    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);

  useEffect(() => {
    loadData();
    const handleStorageChange = (event: StorageEvent) => {
      if (['allUsers', 'allTransactions', 'allTournaments', 'promotionalAds', 'supportTickets', 'luckyDrawSettingsList', 'redeemCodes'].includes(event.key || '')) {
        loadData();
      }
    };
    
    const interval = setInterval(loadData, 15000);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', loadData);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', loadData);
    };
  }, [loadData]);

  const completedTournaments = allTournaments.filter((t: Tournament) => t.status === 'Completed');
  const totalTournaments = completedTournaments.length;
  const totalPrizeDistributed = completedTournaments.reduce((acc, t) => acc + t.prizePool, 0);

  const totalRevenue = completedTournaments.reduce((acc, t) => {
    const totalCollected = t.participants.length * t.entryFee;
    const revenueFromTournament = totalCollected * (t.commissionPercentage / 100);
    return acc + revenueFromTournament;
  }, 0);


  const totalDeposits = allTransactions
    .filter(tx => tx.type === 'credit' && tx.status === 'completed')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const totalWithdrawals = allTransactions
    .filter(tx => tx.type === 'debit' && tx.status === 'completed' && tx.description.toLowerCase().includes('withdrawal'))
    .reduce((acc, tx) => acc + tx.amount, 0);
    
  const totalPromotions = allTransactions
    .filter(tx => tx.type === 'credit' && tx.status === 'completed' && (tx.description.toLowerCase().includes('promotion') || tx.description.toLowerCase().includes('bonus')))
    .reduce((acc, tx) => acc + tx.amount, 0);

  const totalReferredUsers = allUsers.filter(u => u.referredBy).length;

  const stats = [
    { title: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, href: '/admin/revenue-report' },
    { title: "Total Users", value: totalUsers, icon: Users, href: '/admin/users' },
    { title: "Active Giveaways", value: activeGiveawaysCount, icon: Gift, href: '/admin/royal-pass'},
    { title: "Redeem Codes", value: activeRedeemCodesCount, icon: Tags, href: '/admin/redeem-codes' },
    { title: "Prize Distributed", value: `₹${totalPrizeDistributed.toLocaleString()}`, icon: BarChart3, href: '/admin/reports' },
    { title: "Total Tournaments", value: totalTournaments, icon: Swords, href: '/admin/tournaments' },
  ];
  
  const handleRequest = (transactionId: string, newStatus: 'completed' | 'declined', type: 'credit' | 'debit', reason?: string) => {
    let currentAllTransactions: Transaction[] = JSON.parse(localStorage.getItem('allTransactions') || '[]').map((t: any) => ({ ...t, createdAt: new Date(t.createdAt) }));
    let localAllUsers: User[] = JSON.parse(localStorage.getItem('allUsers') || '[]').map((u: any) => ({ ...u, createdAt: u.createdAt ? new Date(u.createdAt) : new Date() }));
    
    const transactionIndex = currentAllTransactions.findIndex(tx => tx.id === transactionId);
    if (transactionIndex === -1) {
        toast({ variant: 'destructive', title: "Error", description: "Transaction not found." });
        return;
    }
    
    const originalTransaction = currentAllTransactions[transactionIndex];
    if (originalTransaction.status !== 'pending') {
        toast({ variant: 'destructive', title: "Error", description: "This transaction is not pending." });
        loadData();
        return;
    }

    const transaction = { ...originalTransaction, status: newStatus, declineReason: reason };
    
    const userIndex = localAllUsers.findIndex(u => u.id === transaction.userId);

    if (userIndex !== -1) {
        if (type === 'credit' && newStatus === 'completed') {
            localAllUsers[userIndex].walletBalance += transaction.amount;
        }
        if (type === 'debit' && newStatus === 'declined') {
            localAllUsers[userIndex].walletBalance += transaction.amount;
            
            const refundTx: Transaction = {
                id: `tx-refund-${Date.now()}-${Math.random()}`,
                userId: transaction.userId,
                amount: transaction.amount,
                type: 'credit',
                description: `Refund for declined withdrawal: ${transaction.description}`,
                createdAt: new Date(),
                status: 'completed',
            };
            currentAllTransactions.push(refundTx);
        }
    }

    currentAllTransactions[transactionIndex] = transaction;

    localStorage.setItem('allTransactions', JSON.stringify(currentAllTransactions));
    localStorage.setItem('allUsers', JSON.stringify(localAllUsers));

    loadData();

    toast({
        title: `Request ${newStatus === 'completed' ? 'Approved' : 'Declined'}`,
        description: `The ${type === 'credit' ? 'deposit' : 'withdrawal'} request for ₹${transaction.amount} has been ${newStatus}.`,
    });

    if (type === 'debit' && pendingWithdrawals.length <= 1) setIsWithdrawalModalOpen(false);
    if (type === 'credit' && pendingDeposits.length <= 1) setIsDepositModalOpen(false);
};
  
  const getUserById = (userId: string) => allUsers.find(u => u.id === userId);

  const openDeclineDialog = (tx: Transaction) => {
    setTransactionToDecline(tx);
  }

  const confirmDecline = () => {
    if (!transactionToDecline) return;
    handleRequest(transactionToDecline.id, 'declined', transactionToDecline.type, declineReason);
    setTransactionToDecline(null);
    setDeclineReason('');
  }

  const handleSaveAmount = () => {
    if (!transactionToEditAmount || !editAmountValue) return;
    const amount = parseFloat(editAmountValue);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: "Invalid Amount", description: "Please enter a valid amount." });
      return;
    }

    let currentAllTransactions: Transaction[] = JSON.parse(localStorage.getItem('allTransactions') || '[]').map((t: any) => ({ ...t, createdAt: new Date(t.createdAt) }));
    const index = currentAllTransactions.findIndex(t => t.id === transactionToEditAmount.id);
    if (index !== -1) {
      currentAllTransactions[index].amount = amount;
      localStorage.setItem('allTransactions', JSON.stringify(currentAllTransactions));
      loadData();
      toast({ title: "Amount Updated", description: "Deposit amount has been adjusted." });
      setIsEditAmountDialogOpen(false);
      setTransactionToEditAmount(null);
      setEditAmountValue('');
    }
  };
  
  const handleRefreshClick = (e: React.MouseEvent, type: 'withdrawals' | 'deposits') => {
    e.stopPropagation();
    loadData();
    toast({ title: "Dashboard Updated", description: `Pending ${type} have been refreshed.` });
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
                <p className="text-muted-foreground text-center py-8">No pending withdrawals.</p>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

       <AlertDialog open={!!transactionToDecline} onOpenChange={(open) => {if(!open) {setTransactionToDecline(null); setDeclineReason('');}}}>
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
            <AlertDialogCancel onClick={() => {setTransactionToDecline(null); setDeclineReason('');}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDecline} disabled={!declineReason}>
              Confirm Decline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditAmountDialogOpen} onOpenChange={setIsEditAmountDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Deposit Amount</DialogTitle>
            <DialogDescription>
              Adjust the amount for this pending deposit request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">New Amount (₹)</Label>
              <Input 
                id="edit-amount" 
                type="number" 
                value={editAmountValue} 
                onChange={(e) => setEditAmountValue(e.target.value)} 
                placeholder="Enter correct amount"
              />
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
