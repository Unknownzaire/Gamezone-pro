
'use client';

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowDownLeft, ArrowUpRight, Clock, RefreshCw, XCircle, Gift } from "lucide-react";
import { format } from "date-fns";
import { useUser } from "@/hooks/use-user.tsx";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Transaction } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import type { WalletSettings } from "@/app/admin/settings/page";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";

function TransactionList({ transactions, showStatus = false }: { transactions: Transaction[], showStatus?: boolean }) {
    if (transactions.length === 0) {
        return <p className="text-muted-foreground text-center p-8">No transactions in this category.</p>;
    }
    
    const sortedTransactions = [...transactions].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="space-y-4">
            {sortedTransactions.map((tx, index) => (
                <Dialog key={tx.id}>
                  <DialogTrigger asChild>
                    <div className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center p-4">
                          <div className="p-2 bg-muted rounded-full mr-4">
                              {tx.type === 'credit' ? (
                                  <ArrowDownLeft className="h-5 w-5 text-green-500" />
                              ) : (
                                  <ArrowUpRight className="h-5 w-5 text-red-500" />
                              )}
                          </div>
                          <div className="flex-1">
                              <p className="font-semibold">{tx.description}</p>
                              <p className="text-sm text-muted-foreground">{format(new Date(tx.createdAt), 'PPp')}</p>
                          </div>
                          <div className="flex flex-col items-end">
                              <p className={`font-bold ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                                  {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                              </p>
                              {showStatus && tx.status && (
                                  <Badge variant={tx.status === 'pending' ? 'outline' : tx.status === 'declined' ? 'destructive' : 'default'} className="mt-1 flex items-center gap-1 capitalize">
                                      {tx.status === 'pending' && <Clock className="h-3 w-3" />}
                                       {tx.status === 'declined' && <XCircle className="h-3 w-3" />}
                                      {tx.status}
                                  </Badge>
                              )}
                          </div>
                      </div>
                      {index < sortedTransactions.length - 1 && <Separator />}
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
            ))}
        </div>
    );
}

export default function WalletPage() {
  const { user, transactions, addTransaction, updateUser, reload: reloadUser, moveReferralBonusToWallet } = useUser();
  const { toast } = useToast();
  const [walletSettings, setWalletSettings] = useState<WalletSettings>({
    minWithdrawal: 100,
    maxWithdrawal: 5000,
    depositUpiId: 'gamezonepro@upi',
  });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'bank'>('upi');
  
  const [upiIdInput, setUpiIdInput] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  const [addAmount, setAddAmount] = useState('500');
  const [upiRef, setUpiRef] = useState('');
  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];
  const quickAddAmounts = [50, 100, 200, 500, 1000];

  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const loadWalletSettings = () => {
    const storedSettings = localStorage.getItem('walletSettings');
    if (storedSettings) {
      setWalletSettings(JSON.parse(storedSettings));
    }
  };

  useEffect(() => {
    loadWalletSettings();
    // This component is now managed by the storage event listener in useUser hook.
  }, []);

  const handleWithdraw = () => {
    if (!user) return;
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: "Invalid Amount", description: "Please enter a valid amount to withdraw." });
      return;
    }
     if (amount < walletSettings.minWithdrawal) {
      toast({ variant: 'destructive', title: "Amount Too Low", description: `Minimum withdrawal amount is ₹${walletSettings.minWithdrawal}.` });
      return;
    }
    if (amount > walletSettings.maxWithdrawal) {
      toast({ variant: 'destructive', title: "Amount Too High", description: `Maximum withdrawal amount is ₹${walletSettings.maxWithdrawal}.` });
      return;
    }
    if (amount > user.walletBalance) {
      toast({ variant: 'destructive', title: "Insufficient Balance", description: "You cannot withdraw more than your available balance." });
      return;
    }

    let paymentDetails: Transaction['paymentDetails'];
    if (withdrawMethod === 'upi') {
      if (!upiIdInput) {
        toast({ variant: 'destructive', title: "Missing UPI ID", description: "Please enter your UPI ID." });
        return;
      }
      paymentDetails = { method: 'upi', upiId: upiIdInput };
    } else {
      if (!accountNumber || !ifscCode || !accountHolderName) {
        toast({ variant: 'destructive', title: "Missing Bank Details", description: "Please fill in all bank account details." });
        return;
      }
      paymentDetails = { method: 'bank', accountNumber, ifscCode, accountHolderName };
    }
    
    // Immediately deduct balance
    updateUser({ walletBalance: user.walletBalance - amount });

    addTransaction({
        amount,
        type: 'debit',
        description: `Withdrawal via ${withdrawMethod.toUpperCase()}`,
        status: 'pending',
        paymentDetails
    });

    toast({ title: "Withdrawal Request Submitted", description: `Your request to withdraw ₹${amount.toLocaleString()} has been submitted.` });
    setWithdrawAmount('');
    setUpiIdInput('');
    setAccountNumber('');
    setIfscCode('');
    setAccountHolderName('');
    setIsWithdrawOpen(false);
  };

  const handleAddMoney = () => {
    if(!user) return;
    const amount = parseFloat(addAmount);
     if (isNaN(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: "Invalid Amount", description: "Please enter a valid amount to add." });
      return;
    }
    if (!upiRef || upiRef.length !== 12) {
       toast({ variant: 'destructive', title: "Invalid Reference Number", description: "Please enter the 12-digit UPI transaction reference number." });
      return;
    }

    addTransaction({
        amount,
        type: 'credit',
        description: `Deposit via UPI`,
        status: 'pending',
        paymentDetails: {
          method: 'upi',
          upiId: upiRef, // Store the reference number here
        }
    });

    toast({ title: "Deposit Request Submitted", description: `Your request to deposit ₹${amount.toLocaleString()} has been sent for approval.` });
    setAddAmount('');
    setUpiRef('');
    setIsAddMoneyOpen(false);
  }
  
  const handleRefresh = () => {
    reloadUser();
    toast({ title: "Wallet Updated", description: "Your balance and transactions are up to date." });
  };
  
  const payeeName = 'Gamezone Pro';
  const qrCodeUrl = walletSettings.qrCodeImageUrl
    ? walletSettings.qrCodeImageUrl
    : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${walletSettings.depositUpiId}&pn=${encodeURIComponent(payeeName)}${addAmount ? `&am=${addAmount}` : ''}&cu=INR`;


  if (!user) {
    return (
       <div className="space-y-6">
        <h1 className="font-headline text-3xl font-bold">My Wallet</h1>
         <Card className="text-center">
          <CardHeader>
            <CardDescription>Current Balance</CardDescription>
            <CardTitle className="font-headline text-5xl text-primary">
                <Skeleton className="h-12 w-48 mx-auto" />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button className="w-full" disabled>Add Money</Button>
            <Button variant="secondary" className="w-full" disabled>Withdraw</Button>
          </CardContent>
        </Card>
        <div>
          <h2 className="font-headline text-2xl font-semibold mb-4">Transaction History</h2>
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
                Loading...
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  
  const sortTransactions = (txs: Transaction[]) => [...txs].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const allSortedTransactions = sortTransactions(transactions);
  const creditTransactions = sortTransactions(allSortedTransactions.filter(tx => tx.type === 'credit' && tx.status === 'completed'));
  const debitTransactions = sortTransactions(allSortedTransactions.filter(tx => tx.type === 'debit' && tx.status === 'completed'));
  const pendingTransactions = sortTransactions(allSortedTransactions.filter(tx => tx.status === 'pending'));
  const declinedTransactions = sortTransactions(allSortedTransactions.filter(tx => tx.status === 'declined'));
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-bold">My Wallet</h1>
        <Button variant="ghost" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-5 w-5" />
            <span className="sr-only">Refresh Wallet</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardDescription>Current Balance</CardDescription>
          <CardTitle className="font-headline text-5xl text-primary">
            ₹{user.walletBalance.toFixed(2)}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
            <Dialog open={isAddMoneyOpen} onOpenChange={setIsAddMoneyOpen}>
                <DialogTrigger asChild>
                    <Button className="w-full">Add Money</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Money</DialogTitle>
                        <DialogDescription>Scan the QR or use the UPI ID to add funds to your wallet.</DialogDescription>
                    </DialogHeader>
                     <div className="flex flex-col sm:flex-row items-start justify-between gap-6 rounded-lg bg-card p-4">
                        <div className="w-full sm:w-1/2 space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="add-amount">Amount (₹)</Label>
                                <Input 
                                id="add-amount" 
                                type="number" 
                                placeholder="e.g., 500" 
                                value={addAmount} 
                                onChange={(e) => setAddAmount(e.target.value)} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Quick Add</Label>
                                <div className="flex flex-wrap gap-2">
                                    {quickAddAmounts.map(amount => (
                                        <Button 
                                            key={amount} 
                                            variant={addAmount === amount.toString() ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setAddAmount(amount.toString())}
                                        >
                                            ₹{amount}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="upi-ref">UPI Transaction Reference No.</Label>
                                <Input 
                                id="upi-ref" 
                                placeholder="Enter the 12-digit number"
                                value={upiRef}
                                onChange={(e) => {
                                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                    if (numericValue.length <= 12) {
                                      setUpiRef(numericValue);
                                    }
                                }}
                                />
                            </div>
                        </div>
                        <div className="w-full sm:w-auto flex flex-col items-center justify-center space-y-2">
                             <Label>Scan and Pay</Label>
                             <div className="flex flex-col items-center gap-2 rounded-lg bg-white p-2">
                               <Image src={qrCodeUrl} alt="UPI QR Code" width={128} height={128} unoptimized/>
                               <p className="font-mono text-xs text-black">{walletSettings.depositUpiId}</p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleAddMoney}>Confirm Deposit</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                <DialogTrigger asChild>
                    <Button variant="secondary" className="w-full">Withdraw</Button>
                </DialogTrigger>
                <DialogContent>
                     <DialogHeader>
                        <DialogTitle>Withdraw Funds</DialogTitle>
                        <DialogDescription>Request a withdrawal to your bank account or UPI.</DialogDescription>
                    </DialogHeader>
                     <div className="space-y-4 rounded-lg bg-card p-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (₹)</Label>
                            <Input 
                            id="amount" 
                            type="number" 
                            placeholder="e.g., 500" 
                            value={withdrawAmount} 
                            onChange={(e) => setWithdrawAmount(e.target.value)} 
                            />
                             <p className="text-xs text-muted-foreground">Min: ₹{walletSettings.minWithdrawal}, Max: ₹{walletSettings.maxWithdrawal}</p>
                        </div>
                        <div className="space-y-2">
                                <Label>Quick Withdraw</Label>
                                <div className="flex flex-wrap gap-2">
                                    {quickAmounts.map(amount => (
                                        <Button 
                                            key={amount} 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setWithdrawAmount(amount.toString())}
                                        >
                                            ₹{amount}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        <div className="space-y-2">
                            <Label>Withdrawal Method</Label>
                            <RadioGroup defaultValue="upi" onValueChange={(v) => setWithdrawMethod(v as 'upi' | 'bank')} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="upi" id="upi" />
                                <Label htmlFor="upi">UPI</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="bank" id="bank" />
                                <Label htmlFor="bank">Bank Transfer</Label>
                            </div>
                            </RadioGroup>
                        </div>
                        {withdrawMethod === 'upi' && (
                            <div className="space-y-2">
                            <Label htmlFor="upi-id">UPI ID</Label>
                            <Input id="upi-id" placeholder="yourname@bank" value={upiIdInput} onChange={(e) => setUpiIdInput(e.target.value)} />
                            </div>
                        )}
                        {withdrawMethod === 'bank' && (
                            <div className="space-y-4 rounded-md border p-4">
                            <p className="text-sm font-medium">Bank Account Details</p>
                            <div className="space-y-2">
                                <Label htmlFor="acc-number">Account Number</Label>
                                <Input id="acc-number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ifsc">IFSC Code</Label>
                                <Input id="ifsc" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="acc-holder">Account Holder Name</Label>
                                <Input id="acc-holder" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} />
                            </div>
                            </div>
                        )}
                    </div>
                     <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button variant="secondary" onClick={handleWithdraw}>Submit Withdrawal Request</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </CardContent>
      </Card>
      
      <div>
        <h2 className="font-headline text-2xl font-semibold mb-4">Transaction History</h2>
         <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="credit">Credit</TabsTrigger>
                <TabsTrigger value="debit">Debit</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="declined">Declined</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
                <Card>
                    <CardContent className="p-0">
                       <TransactionList transactions={allSortedTransactions} showStatus={true} />
                    </CardContent>
                </Card>
            </TabsContent>
             <TabsContent value="credit" className="mt-4">
                <Card>
                    <CardContent className="p-0">
                       <TransactionList transactions={creditTransactions} />
                    </CardContent>
                </Card>
            </TabsContent>
             <TabsContent value="debit" className="mt-4">
                <Card>
                    <CardContent className="p-0">
                       <TransactionList transactions={debitTransactions} />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="pending" className="mt-4">
                <Card>
                    <CardContent className="p-0">
                       <TransactionList transactions={pendingTransactions} showStatus={true}/>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="declined" className="mt-4">
                <Card>
                    <CardContent className="p-0">
                       <TransactionList transactions={declinedTransactions} showStatus={true}/>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
