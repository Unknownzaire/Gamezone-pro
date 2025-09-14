
'use client';

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
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

function TransactionList({ transactions }: { transactions: Transaction[] }) {
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
                        <p className={`font-bold ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                            {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                        </p>
                    </div>
                    {index < transactions.length - 1 && <Separator />}
                </React.Fragment>
            ))}
        </div>
    );
}

export default function WalletPage() {
  const { user, transactions } = useUser();
  const { toast } = useToast();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('upi');

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
    // In a real app, this would trigger a server action
    toast({ title: "Withdrawal Request Submitted", description: `Your request to withdraw ₹${amount.toLocaleString()} has been submitted.` });
    setWithdrawAmount('');
  };

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
  
  const creditTransactions = transactions.filter(tx => tx.type === 'credit');
  const debitTransactions = transactions.filter(tx => tx.type === 'debit');

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold">My Wallet</h1>

      <Card className="text-center">
        <CardHeader>
          <CardDescription>Current Balance</CardDescription>
          <CardTitle className="font-headline text-5xl text-primary">
            ₹{user.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Button className="w-full">Add Money</Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" className="w-full">Withdraw</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Withdrawal</DialogTitle>
                <DialogDescription>
                  Enter the amount and select a method for withdrawal. Requests are processed within 2-3 business days.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
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
                  <RadioGroup defaultValue="upi" onValueChange={setWithdrawMethod}>
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
                    <Input id="upi-id" placeholder="yourname@bank" />
                  </div>
                )}
                 {withdrawMethod === 'bank' && (
                  <div className="space-y-4 rounded-md border p-4">
                     <p className="text-sm font-medium">Bank Account Details</p>
                     <div className="space-y-2">
                        <Label htmlFor="acc-number">Account Number</Label>
                        <Input id="acc-number" />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="ifsc">IFSC Code</Label>
                        <Input id="ifsc" />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="acc-holder">Account Holder Name</Label>
                        <Input id="acc-holder" />
                     </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                    <Button type="submit" onClick={handleWithdraw}>Submit Request</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
      
      <div>
        <h2 className="font-headline text-2xl font-semibold mb-4">Transaction History</h2>
         <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="credit">Credit</TabsTrigger>
                <TabsTrigger value="debit">Debit</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
                <Card>
                    <CardContent className="p-0">
                       <TransactionList transactions={transactions} />
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
        </Tabs>
      </div>
    </div>
  );
}
