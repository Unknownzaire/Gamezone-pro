
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Gift, Sparkles, Trophy, Star, Video, Loader2, PlayCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, doc, updateDoc, Timestamp, addDoc } from "firebase/firestore";

export default function RoyalPassPage() {
    const { user, updateUser, hasUserJoinedTournament, allUsers } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    
    const giveawaysQuery = useMemoFirebase(() => query(collection(firestore, 'royal_pass'), where('docType', '==', 'giveaway'), where('isActive', '==', true)), [firestore]);
    const { data: giveaways = [] } = useCollection<any>(giveawaysQuery);

    const winnersQuery = useMemoFirebase(() => query(collection(firestore, 'royal_pass'), where('docType', '==', 'winner'), orderBy('createdAt', 'desc')), [firestore]);
    const { data: winners = [] } = useCollection<any>(winnersQuery);

    const [selectedReel, setSelectedReel] = useState<File | null>(null);
    const [isJoining, setIsJoining] = useState(false);
    const [joiningGiveaway, setJoiningGiveaway] = useState<any>(null);
    const [viewingReelUrl, setViewingReelUrl] = useState<string | null>(null);

    const handleJoinDraw = async () => {
        if (!user || !joiningGiveaway || !firestore) return;
        if (user.walletBalance < joiningGiveaway.entryFee) {
            toast({ variant: 'destructive', title: "Insufficient Balance" });
            return;
        }

        setIsJoining(true);
        try {
            let reelUrl = "";
            if (selectedReel) {
                const reader = new FileReader();
                reelUrl = await new Promise((res) => {
                    reader.onload = () => res(reader.result as string);
                    reader.readAsDataURL(selectedReel);
                });
            }

            await updateDoc(doc(firestore, 'users', user.id), { walletBalance: user.walletBalance - joiningGiveaway.entryFee });
            await addDoc(collection(firestore, 'users', user.id, 'transactions'), {
                amount: joiningGiveaway.entryFee,
                type: 'debit',
                description: `Joined Lucky Draw: ${joiningGiveaway.jackpotName}`,
                createdAt: Timestamp.now(),
                status: 'completed',
                paymentDetails: { method: 'giveaway', reelUrl: reelUrl || null }
            });

            toast({ title: "Joined Successfully!" });
            setJoiningGiveaway(null);
            setSelectedReel(null);
        } catch (e) {
            toast({ variant: 'destructive', title: "Failed to Join" });
        } finally {
            setIsJoining(false);
        }
    };

    if (!user) return <div className="p-8 text-center">Loading Royal Pass...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/home"><Button variant="outline" size="icon" className="h-7 w-7"><ArrowLeft className="h-4 w-4" /></Button></Link>
                <h1 className="font-headline text-3xl font-bold text-primary">Royal Pass</h1>
            </div>

            <div className="space-y-4">
                <h2 className="font-headline text-xl font-bold flex items-center gap-2"><Sparkles className="h-5 w-5 text-yellow-400" />Active Giveaways</h2>
                {giveaways.map((giveaway) => (
                    <Card key={giveaway.id} className="border-primary/30 bg-card">
                        <CardHeader>
                            <div className="flex justify-between"><CardTitle>{giveaway.jackpotName}</CardTitle><Badge className="bg-accent">LIVE</Badge></div>
                            <CardDescription>Prize: ₹{giveaway.jackpotAmount.toLocaleString()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full" disabled={!hasUserJoinedTournament(user.id)} onClick={() => setJoiningGiveaway(giveaway)}>
                                {hasUserJoinedTournament(user.id) ? `Join Draw (₹${giveaway.entryFee})` : 'Join a match to unlock'}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-400" />Hall of Fame</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {winners.map((winner, i) => (
                            <div key={i} className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <Avatar><AvatarFallback>{winner.name.charAt(0)}</AvatarFallback></Avatar>
                                    <div><p className="font-bold">{winner.name}</p><p className="text-xs text-muted-foreground">{winner.jackpot}</p></div>
                                </div>
                                <div className="text-right"><p className="font-black text-primary">₹{winner.amount.toLocaleString()}</p></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!joiningGiveaway} onOpenChange={(o) => !o && setJoiningGiveaway(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Join {joiningGiveaway?.jackpotName}</DialogTitle></DialogHeader>
                    {joiningGiveaway?.requiresReel && <Input type="file" accept="video/*" onChange={(e) => setSelectedReel(e.target.files?.[0] || null)} />}
                    <DialogFooter>
                        <Button onClick={handleJoinDraw} disabled={isJoining}>{isJoining ? <Loader2 className="animate-spin" /> : 'Confirm Entry'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
