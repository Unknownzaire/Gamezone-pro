
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function ReferEarnPage() {
  const { user, referredUsers, hasUserJoinedTournament, transactions, referralSettings, moveReferralBonusToWallet } = useUser();
  const { toast } = useToast();
  
  const referralCode = user?.referralCode || 'LOGIN-TO-REFER';
  const referralUrl = typeof window !== 'undefined' ? `${window.location.origin}/login?ref=${referralCode}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    toast({ title: "Copied to clipboard!" });
  };

  const referralTransactions = transactions.filter(tx => tx.description.toLowerCase().includes('referral bonus'));

  if (!user) return <div className="p-8 text-center">Loading referral data...</div>;

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold">Refer &amp; Earn</h1>

       <Dialog>
        <DialogTrigger asChild>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Referral Earnings</CardTitle>
                    <CardDescription>Total bonuses earned.</CardDescription>
                </div>
                <Gift className="h-8 w-8 text-primary" />
                </CardHeader>
                <CardContent>
                <p className="text-3xl font-bold text-primary">₹{(user.referralBalance || 0).toFixed(2)}</p>
                </CardContent>
            </Card>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader><DialogTitle>Referral History</DialogTitle></DialogHeader>
            <ScrollArea className="h-72">
                <div className="space-y-4">
                    {referralTransactions.map((tx, idx) => (
                        <div key={tx.id}>
                            <div className="flex justify-between p-2">
                                <div><p className="font-semibold">{tx.description}</p><p className="text-xs text-muted-foreground">{format(new Date(tx.createdAt), 'PP')}</p></div>
                                <p className="text-green-500 font-bold">+₹{tx.amount}</p>
                            </div>
                            {idx < referralTransactions.length - 1 && <Separator />}
                        </div>
                    ))}
                </div>
            </ScrollArea>
             <DialogFooter>
                <DialogClose asChild><Button onClick={moveReferralBonusToWallet} disabled={!user.referralBalance}>Move to Wallet</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="text-center">
        <CardHeader><CardTitle>Invite Your Friends</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <p className="text-2xl font-bold font-mono tracking-widest text-primary border-2 border-dashed border-primary p-3 rounded-lg">{referralCode}</p>
          <Button className="w-full" onClick={handleCopy}><Share2 className="mr-2 h-4 w-4" />Copy & Share Link</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>How It Works</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
           <div className="flex gap-4"><div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div><p>Share link.</p></div>
           <div className="flex gap-4"><div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div><p>Friend gets ₹{referralSettings?.newUserBonus || 0} bonus.</p></div>
           <div className="flex gap-4"><div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div><p>You get ₹{referralSettings?.referralBonus || 0} after their first match.</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Your Referrals</CardTitle></CardHeader>
        <CardContent>
          {referredUsers.length > 0 ? (
             <Table>
                <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Joined</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {referredUsers.map(refUser => (
                       <TableRow key={refUser.id}>
                        <TableCell><Avatar className="h-8 w-8 inline-block mr-2"><AvatarImage src={refUser.avatarUrl}/></Avatar>{refUser.username}</TableCell>
                        <TableCell>{format(new Date(refUser.createdAt), 'PP')}</TableCell>
                        <TableCell className="text-right">{hasUserJoinedTournament(refUser.id) ? <Badge className="bg-green-500">Bonus Unlocked</Badge> : <Badge variant="outline">Joined</Badge>}</TableCell>
                      </TableRow>
                  ))}
                </TableBody>
             </Table>
          ) : <p className="text-center py-8 text-muted-foreground">No referrals yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
