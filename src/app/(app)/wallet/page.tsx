
'use client';

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react";
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

function TransactionList({ transactions, showStatus = false }: { transactions: Transaction[], showStatus?: boolean }) {
    if (transactions.length === 0) {
        return <p className="text-muted-foreground text-center p-8">No transactions in this category.</p>;
    }

    return (
        <div className="space-y-4">
            {transactions.map((tx, index) => (
                <React.Fragment key={tx.id}>
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
                            {showStatus && tx.status && tx.status !== 'completed' && (
                                <Badge variant={tx.status === 'pending' ? 'outline' : 'destructive'} className="mt-1 flex items-center gap-1 capitalize">
                                    {tx.status === 'pending' && <Clock className="h-3 w-3" />}
                                    {tx.status}
                                </Badge>
                            )}
                        </div>
                    </div>
                    {index < transactions.length - 1 && <Separator />}
                </React.Fragment>
            ))}
        </div>
    );
}

export default function WalletPage() {
  const { user, transactions, addTransaction, updateBalance } = useUser();
  const { toast } = useToast();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'bank'>('upi');
  
  const [upiIdInput, setUpiIdInput] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  const [addAmount, setAddAmount] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const quickAmounts = [50, 100, 200, 500, 1000];

  const handleWithdraw = () => {
    if (!user) return;
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: "Invalid Amount", description: "Please enter a valid amount to withdraw." });
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
  };

  const handleAddMoney = () => {
    if(!user) return;
    const amount = parseFloat(addAmount);
     if (isNaN(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: "Invalid Amount", description: "Please enter a valid amount to add." });
      return;
    }
    if (!upiRef) {
       toast({ variant: 'destructive', title: "Missing Reference Number", description: "Please enter the UPI transaction reference number." });
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

    toast({ title: "Deposit Request Submitted", description: `Your request to add ₹${amount.toLocaleString()} is pending approval.` });
    setAddAmount('');
    setUpiRef('');
  }

  const upiId = 'arenaace@upi';
  const payeeName = 'Arena Ace';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${upiId}&pn=${payeeName}${addAmount ? `&am=${addAmount}` : ''}&cu=INR`;


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
  
  const completedTransactions = transactions.filter(tx => tx.status === 'completed' || tx.status === 'declined');
  const creditTransactions = completedTransactions.filter(tx => tx.type === 'credit');
  const debitTransactions = completedTransactions.filter(tx => tx.type === 'debit');
  const pendingTransactions = transactions.filter(tx => tx.status === 'pending');
  const allSortedTransactions = [...transactions].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold">My Wallet</h1>

      <Card>
        <CardHeader className="text-center">
          <CardDescription>Current Balance</CardDescription>
          <CardTitle className="font-headline text-5xl text-primary">
            ₹{user.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Money Column */}
          <div className="space-y-4 rounded-lg border bg-card p-4">
             <h3 className="font-headline text-xl font-semibold">Add Money</h3>
              <div className="space-y-2">
                <Label>Scan and Pay</Label>
                 <div className="flex flex-col items-center gap-2 p-2 bg-white rounded-lg">
                   <Image src={qrCodeUrl} alt="UPI QR Code" width={160} height={160} />
                   <p className="font-mono text-xs text-black">{upiId}</p>
                 </div>
              </div>
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
                      {quickAmounts.map(amount => (
                          <Button 
                              key={amount} 
                              variant="outline" 
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
                  onChange={(e) => setUpiRef(e.target.value)}
                />
              </div>
              <Button onClick={handleAddMoney} className="w-full">Submit Deposit Request</Button>
          </div>

          {/* Withdraw Column */}
          <div className="space-y-4 rounded-lg border bg-card p-4">
              <h3 className="font-headline text-xl font-semibold">Withdraw Funds</h3>
               <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  placeholder="e.g., 500" 
                  value={withdrawAmount} 
                  onChange={(e) => setWithdrawAmount(e.target.value)} 
                />
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
               <Button variant="secondary" onClick={handleWithdraw} className="w-full">Submit Withdrawal Request</Button>
          </div>
        </CardContent>
      </Card>
      
      <div>
        <h2 className="font-headline text-2xl font-semibold mb-4">Transaction History</h2>
         <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="credit">Credit</TabsTrigger>
                <TabsTrigger value="debit">Debit</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
}

    
    

    