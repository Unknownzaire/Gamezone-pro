
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser } from "@/hooks/use-user.tsx";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Copy, Share2, CheckCircle, Gift } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReferralSettings } from "@/app/admin/settings/page";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Transaction } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

function TransactionList({ transactions, showStatus = false }: { transactions: Transaction[], showStatus?: boolean }) {
    if (transactions.length === 0) {
        return <p className="text-muted-foreground text-center p-8">No transactions in this category.</p>;
    }
    
    const sortedTransactions = [...transactions].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="space-y-4">
            {sortedTransactions.map((tx, index) => (
                <div key={tx.id}>
                  <div className="flex items-center p-4">
                      <div className="flex-1">
                          <p className="font-semibold">{tx.description}</p>
                          <p className="text-sm text-muted-foreground">{format(new Date(tx.createdAt), 'PPp')}</p>
                      </div>
                      <div className="flex flex-col items-end">
                          <p className={`font-bold text-green-500`}>
                              +₹{tx.amount.toLocaleString()}
                          </p>
                      </div>
                  </div>
                  {index < sortedTransactions.length - 1 && <Separator />}
                </div>
            ))}
        </div>
    );
}

export default function ReferEarnPage() {
  const { user, referredUsers, hasUserJoinedTournament, transactions, moveReferralBonusToWallet } = useUser();
  const { toast } = useToast();
  const [referralSettings, setReferralSettings] = useState<ReferralSettings>({
    referralBonus: 25,
    newUserBonus: 25,
  });

  useEffect(() => {
    const storedSettings = localStorage.getItem('referralSettings');
    if (storedSettings) {
      setReferralSettings(JSON.parse(storedSettings));
    }
  }, []);
  
  const referralCode = user?.referralCode || 'LOGIN-TO-REFER';
  const referralUrl = typeof window !== 'undefined' ? `${window.location.origin}/login?ref=${referralCode}` : '';


  const handleCopy = () => {
    if (referralUrl) {
      navigator.clipboard.writeText(referralUrl);
      toast({
        title: "Copied to clipboard!",
        description: "Your referral link has been copied.",
      });
    }
  };

  const handleShare = () => {
    if (navigator.share && referralUrl) {
      navigator.share({
        title: 'Join me on Arena Ace!',
        text: `Join me on Arena Ace and start competing in BGMI tournaments. Use my referral link to get started!`,
        url: referralUrl,
      }).catch((error) => console.log('Error sharing', error));
    } else {
        // Fallback for browsers that don't support navigator.share
        handleCopy();
        toast({
            title: "Share not supported",
            description: "Your browser does not support native sharing. The referral link has been copied to your clipboard instead.",
        });
    }
  };
  
  const sortedReferredUsers = referredUsers.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const referralTransactions = transactions
    .filter(tx => {
        const description = tx.description.toLowerCase();
        return tx.status === 'completed' && description.startsWith('referral bonus for');
    });

  const handleMoveToWallet = () => {
    moveReferralBonusToWallet();
    toast({ title: "Funds Moved!", description: "Your referral bonus has been moved to your main wallet." });
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold">Refer &amp; Earn</h1>

       <Dialog>
        <DialogTrigger asChild>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Referral Earnings</CardTitle>
                    <CardDescription>Total bonuses earned from inviting friends.</CardDescription>
                </div>
                <Gift className="h-8 w-8 text-primary" />
                </CardHeader>
                <CardContent>
                <p className="text-3xl font-bold text-primary">
                    ₹{(user.referralBalance || 0).toFixed(2)}
                </p>
                </CardContent>
            </Card>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Referral Bonus History</DialogTitle>
                <DialogDescription>
                    These are all the bonuses you've received from referrals.
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-72">
                <div className="pr-4">
                {referralTransactions.length > 0 ? (
                    <TransactionList transactions={referralTransactions} />
                ) : (
                    <p className="text-muted-foreground text-center p-8">You haven't earned any referral bonuses yet.</p>
                )}
                </div>
            </ScrollArea>
             <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={handleMoveToWallet} disabled={!user.referralBalance || user.referralBalance <= 0}>
                    Move to Wallet
                  </Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>


      <Card className="text-center">
        <CardHeader>
          <CardTitle>Invite Your Friends</CardTitle>
          <CardDescription>
            Share your referral link with friends. When they sign up and join their first tournament, you both get a bonus!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">Your Unique Referral Code</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <p className="text-2xl font-bold font-mono tracking-widest text-primary border-2 border-dashed border-primary p-3 rounded-lg">
                {referralCode}
              </p>
            </div>
             <button onClick={handleCopy} className="mt-2 text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mx-auto">
                <Copy className="h-3 w-3" />
                Copy Link
             </button>
          </div>
          <Button className="w-full" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share Your Link
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
           <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</div>
              <p>Share your unique referral link with your friends.</p>
           </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</div>
              <p>Your friend signs up using your link and gets a <span className="font-bold text-primary">₹{referralSettings.newUserBonus}</span> bonus instantly.</p>
           </div>
           <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</div>
              <p>When your friend joins their first paid tournament, you receive a <span className="font-bold text-primary">₹{referralSettings.referralBonus}</span> bonus in your wallet!</p>
           </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedReferredUsers.length > 0 ? (
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Joined On</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedReferredUsers.map(refUser => {
                    const bonusUnlocked = hasUserJoinedTournament(refUser.id);
                    return (
                       <TableRow key={refUser.id}>
                        <TableCell>
                           <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={refUser.avatarUrl} alt={refUser.username} />
                                <AvatarFallback>{refUser.username.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{refUser.username}</span>
                            </div>
                        </TableCell>
                        <TableCell>{format(new Date(refUser.createdAt), 'PP')}</TableCell>
                        <TableCell className="text-right">
                          {bonusUnlocked ? (
                            <Badge className="bg-green-500 hover:bg-green-600 text-white">
                               <CheckCircle className="mr-1 h-3 w-3" />
                               Bonus Unlocked
                            </Badge>
                          ) : (
                            <Badge variant="outline">Joined</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
             </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">You haven't referred any friends yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
