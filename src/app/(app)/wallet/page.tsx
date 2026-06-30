
'use client';

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowDownLeft, ArrowUpRight, Clock, RefreshCw, XCircle, Tags, Loader2 } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";

function TransactionList({ transactions, showStatus = false }: { transactions: Transaction[], showStatus?: boolean }) {
    if (transactions.length === 0) {
        return <p className="text-muted-foreground text-center p-8">No transactions found.</p>;
    }
    
    return (
        <div className="space-y-4">
            {transactions.map((tx, index) => (
                <div key={tx.id}>
                    <div className="flex items-center p-4">
                        <div className="p-2 bg-muted rounded-full mr-4">
                            {tx.type === 'credit' ? <ArrowDownLeft className="h-5 w-5 text-green-500" /> : <ArrowUpRight className="h-5 w-5 text-red-500" />}
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
                                    {tx.status}
                                </Badge>
                            )}
                        </div>
                    </div>
                    {index < transactions.length - 1 && <Separator />}
                </div>
            ))}
        </div>
    );
}

export default function WalletPage() {
  const { user, transactions, addTransaction, updateUser, walletSettings, redeemCode } = useUser();
  const { toast } = useToast();
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'bank' | 'binance' | 'paypal'>('upi');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [binanceIdInput, setBinanceIdInput] = useState('');
  const [binanceNicknameInput, setBinanceNicknameInput] = useState('');
  const [paypalEmailInput, setPaypalEmailInput] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  const [addAmount, setAddAmount] = useState('500');
  const [addMethod, setAddMethod] = useState<'upi' | 'bank' | 'binance' | 'paypal'>('upi');
  const [transactionRef, setTransactionRef] = useState('');
  
  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];
  const quickAddAmounts = [50, 100, 200, 500, 1000];

  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [redeemInput, setRedeemInput] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleWithdraw = () => {
    if (!user || !walletSettings) return;
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < walletSettings.minWithdrawal || amount > walletSettings.maxWithdrawal || amount > user.walletBalance) {
      toast({ variant: 'destructive', title: "Invalid Amount" });
      return;
    }

    let paymentDetails: any;
    if (withdrawMethod === 'upi') paymentDetails = { method: 'upi', upiId: upiIdInput };
    else if (withdrawMethod === 'binance') paymentDetails = { method: 'binance', binanceId: binanceIdInput, binanceNickname: binanceNicknameInput };
    else if (withdrawMethod === 'paypal') paymentDetails = { method: 'paypal', paypalEmail: paypalEmailInput };
    else paymentDetails = { method: 'bank', accountNumber, ifscCode, accountHolderName };

    updateUser({ walletBalance: user.walletBalance - amount });
    addTransaction({ amount, type: 'debit', description: `Withdrawal via ${withdrawMethod.toUpperCase()}`, status: 'pending', paymentDetails });

    toast({ title: "Withdrawal Requested" });
    setIsWithdrawOpen(false);
  };

  const handleAddMoney = () => {
    if(!user) return;
    if (!transactionRef) {
       toast({ variant: 'destructive', title: "Missing Reference" });
      return;
    }

    addTransaction({ 
      amount: parseFloat(addAmount), 
      type: 'credit', 
      description: `Deposit via ${addMethod.toUpperCase()}`, 
      status: 'pending', 
      paymentDetails: { method: addMethod, upiId: transactionRef } 
    });

    toast({ title: "Deposit Requested" });
    setIsAddMoneyOpen(false);
  }

  const handleRedeem = async () => {
    if (!redeemInput.trim()) return;
    setIsRedeeming(true);
    const result = await redeemCode(redeemInput);
    if (result === 'success') {
        toast({ title: "Redeemed!" });
        setIsRedeemOpen(false);
    } else {
        toast({ variant: 'destructive', title: "Redeem Failed", description: result });
    }
    setIsRedeeming(false);
  };

  if (!user) return <div className="p-8 text-center">Loading wallet...</div>;
  
  const upiQrCodeUrl = walletSettings?.qrCodeImageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${walletSettings?.depositUpiId}&am=${addAmount}`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-bold">My Wallet</h1>
        <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setIsRedeemOpen(true)}><Tags className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon"><RefreshCw className="h-5 w-5" /></Button>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardDescription>Current Balance</CardDescription>
          <CardTitle className="font-headline text-5xl text-primary">₹{user.walletBalance.toFixed(2)}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
            <Button className="w-full" onClick={() => setIsAddMoneyOpen(true)}>Add Money</Button>
            <Button variant="secondary" className="w-full" onClick={() => setIsWithdrawOpen(true)}>Withdraw</Button>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="credit">Credit</TabsTrigger>
            <TabsTrigger value="debit">Debit</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4"><CardContent className="p-0"><TransactionList transactions={transactions} showStatus /></CardContent></TabsContent>
        <TabsContent value="credit" className="mt-4"><CardContent className="p-0"><TransactionList transactions={transactions.filter(t => t.type === 'credit')} showStatus /></CardContent></TabsContent>
        <TabsContent value="debit" className="mt-4"><CardContent className="p-0"><TransactionList transactions={transactions.filter(t => t.type === 'debit')} showStatus /></CardContent></TabsContent>
      </Tabs>

      {/* Modals for Add, Withdraw, Redeem */}
      <Dialog open={isAddMoneyOpen} onOpenChange={setIsAddMoneyOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Money</DialogTitle></DialogHeader>
            <Input type="number" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} />
            <div className="flex gap-2 flex-wrap">
                {quickAddAmounts.map(a => <Button key={a} variant="outline" size="sm" onClick={() => setAddAmount(a.toString())}>₹{a}</Button>)}
            </div>
            <div className="flex flex-col items-center gap-2 border p-4 rounded-lg">
                <Image src={upiQrCodeUrl} alt="QR" width={150} height={150} unoptimized />
                <p className="text-xs font-mono">{walletSettings?.depositUpiId}</p>
            </div>
            <Input placeholder="Transaction Ref / ID" value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} />
            <DialogFooter><Button onClick={handleAddMoney}>Submit Request</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Withdraw Funds</DialogTitle></DialogHeader>
            <Input type="number" placeholder="Amount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
            <RadioGroup defaultValue="upi" onValueChange={(v) => setWithdrawMethod(v as any)} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="upi" id="u" /><Label htmlFor="u">UPI</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="bank" id="b" /><Label htmlFor="b">Bank</Label></div>
            </RadioGroup>
            {withdrawMethod === 'upi' && <Input placeholder="UPI ID" value={upiIdInput} onChange={(e) => setUpiIdInput(e.target.value)} />}
            {withdrawMethod === 'bank' && <Input placeholder="A/C Number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />}
            <DialogFooter><Button onClick={handleWithdraw}>Withdraw</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRedeemOpen} onOpenChange={setIsRedeemOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Redeem Code</DialogTitle></DialogHeader>
            <Input placeholder="Enter Code" value={redeemInput} onChange={(e) => setRedeemInput(e.target.value.toUpperCase())} />
            <DialogFooter><Button onClick={handleRedeem} disabled={isRedeeming}>{isRedeeming ? 'Redeeming...' : 'Redeem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
