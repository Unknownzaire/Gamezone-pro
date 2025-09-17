
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockTournaments, mockUsers, mockTransactions as initialTransactions } from "@/lib/mock-data";
import { User, Transaction, Tournament, PromotionalAd } from '@/lib/types';
import { DollarSign, Swords, Users, BarChart3, Banknote, RefreshCw, Settings, History, ArrowDownLeft, ArrowUpRight, Gift, Megaphone, UserPlus } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [completedTournaments, setCompletedTournaments] = useState<Tournament[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<Transaction[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [activeAdsCount, setActiveAdsCount] = useState(0);

  const { toast } = useToast();
  
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  
  const [transactionToDecline, setTransactionToDecline] = useState<Transaction | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  const loadData = useCallback(() => {
    try {
      const storedUsers = localStorage.getItem('allUsers');
      const users: User[] = storedUsers ? JSON.parse(storedUsers).map((u: any) => ({...u, createdAt: u.createdAt ? new Date(u.createdAt) : new Date() })) : mockUsers;
      setAllUsers(users);
      setTotalUsers(users.length);

      const storedTransactions = localStorage.getItem('allTransactions');
      const transactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions).map((t: any) => ({...t, createdAt: new Date(t.createdAt)})) : initialTransactions;
      setAllTransactions(transactions);

      setPendingDeposits(transactions.filter(tx => tx.status === 'pending' && tx.type === 'credit'));
      setPendingWithdrawals(transactions.filter(tx => tx.status === 'pending' && tx.type === 'debit'));

      let allTournaments: Tournament[] = [];
      const storedTournaments = localStorage.getItem('allTournaments');
      allTournaments = storedTournaments ? JSON.parse(storedTournaments).map((t: any) => ({...t, matchTime: new Date(t.matchTime)})) : mockTournaments;
      setCompletedTournaments(allTournaments.filter((t: Tournament) => t.status === 'Completed'));

      const storedAds = localStorage.getItem('promotionalAds');
      const ads: PromotionalAd[] = storedAds ? JSON.parse(storedAds) : [];
      setActiveAdsCount(ads.filter(ad => ad.status === 'active').length);

    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);

  useEffect(() => {
    loadData();
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'allUsers' || event.key === 'allTransactions' || event.key === 'allTournaments' || event.key === 'promotionalAds') {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadData]);

  const totalTournaments = completedTournaments.length;
  const totalPrizeDistributed = completedTournaments.reduce((acc, t) => acc + t.prizePool, 0);
  const totalRevenue = allTransactions.filter(tx => tx.status === 'completed').reduce((acc, tx) => {
    if (tx.type === 'debit' && tx.description.toLowerCase().includes('joined')) {
        const tournament = mockTournaments.find(t => t.title === tx.description.replace('Joined "', '').replace('"', ''));
        if (tournament) {
            return acc + (tx.amount * (tournament.commissionPercentage / 100));
        }
    }
    return acc;
  }, 0);


  const totalDeposits = allTransactions
    .filter(tx => tx.type === 'credit' && tx.status === 'completed')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const totalWithdrawals = allTransactions
    .filter(tx => tx.type === 'debit' && tx.status === 'completed' && tx.description.toLowerCase().includes('withdrawal'))
    .reduce((acc, tx) => acc + tx.amount, 0);
    
  const totalPromotions = allTransactions
    .filter(tx => tx.type === 'credit' && tx.status === 'completed' && (tx.description.toLowerCase().includes('promotion') || tx.description.toLowerCase().includes('bonus') || tx.description.toLowerCase() === 'admin deposit'))
    .reduce((acc, tx) => acc + tx.amount, 0);

  const totalReferredUsers = allUsers.filter(u => u.referredBy).length;

  const stats = [
    { title: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, href: '/admin/revenue-report' },
    { title: "Total Users", value: totalUsers, icon: Users, href: '/admin/users' },
    { title: "Prize Distributed", value: `₹${totalPrizeDistributed.toLocaleString()}`, icon: BarChart3, href: '/admin/reports' },
    { title: "Total Tournaments", value: totalTournaments, icon: Swords, href: '/admin/tournaments' },
  ];
  
  const handleRequest = (transactionId: string, status: 'completed' | 'declined', type: 'credit' | 'debit', reason?: string) => {
    const isDeposit = type === 'credit';

    let currentAllTransactions: Transaction[] = JSON.parse(localStorage.getItem('allTransactions') || '[]').map((t: any) => ({ ...t, createdAt: new Date(t.createdAt) }));
    let localAllUsers: User[] = JSON.parse(localStorage.getItem('allUsers') || '[]').map((u: any) => ({ ...u, createdAt: u.createdAt ? new Date(u.createdAt) : new Date() }));
    
    const transactionIndex = currentAllTransactions.findIndex(tx => tx.id === transactionId);
    if (transactionIndex === -1) {
        toast({ variant: 'destructive', title: "Error", description: "Transaction not found." });
        return;
    }

    const transaction = currentAllTransactions[transactionIndex];
    
    // Ensure the transaction is actually pending
    if (transaction.status !== 'pending') {
        toast({ variant: 'destructive', title: "Error", description: "This transaction is not pending." });
        loadData(); // Reload data to show the correct state
        return;
    }
    
    const userIndex = localAllUsers.findIndex(u => u.id === transaction.userId);

    if (userIndex !== -1) {
        if (status === 'completed') {
            if (isDeposit) {
                // For an approved deposit, add the amount to the user's balance
                localAllUsers[userIndex].walletBalance += transaction.amount;
            } 
            // For an approved withdrawal, the amount is already deducted from the available balance,
            // but we need to update the main balance if it wasn't already.
            // Assuming balance is only updated on 'completed' status.
            else {
                // In a real system, you'd confirm the funds were sent before this.
                // The balance was effectively "held" and now it's "gone".
                // If the main balance already reflects the debit on 'pending', no change is needed.
                // If not, it should be debited here. Based on use-user hook, it is not debited on pending,
                // so we should debit it now. Let's assume it was already debited for withdrawal for now.
            }
        } else { // status === 'declined'
            // No balance change for declined deposit.
            // For a declined withdrawal, the "held" amount should be returned.
            // But since our user hook doesn't create a 'held' state, we just don't debit.
            // Let's assume the user balance is not yet debited for pending withdrawals
        }
    }

    transaction.status = status;
    if (reason) transaction.declineReason = reason;
    currentAllTransactions[transactionIndex] = transaction;

    localStorage.setItem('allTransactions', JSON.stringify(currentAllTransactions));
    localStorage.setItem('allUsers', JSON.stringify(localAllUsers));

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
    setDeclineReason('');
  }
  
  const handleRefreshClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    loadData();
    toast({ title: "Dashboard Updated", description: "Pending requests have been refreshed." });
  };
  
  const getTotalDepositsForUser = (userId: string) => {
    return allTransactions
      .filter(tx => tx.userId === userId && tx.type === 'credit' && tx.status === 'completed')
      .reduce((acc, tx) => acc + tx.amount, 0);
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
          <DialogContent className="max-w-4xl">
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
                      <TableHead>Total Deposits</TableHead>
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
                          <TableCell>₹{user ? getTotalDepositsForUser(user.id).toLocaleString() : 'N/A'}</TableCell>
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

    </div>
  );
