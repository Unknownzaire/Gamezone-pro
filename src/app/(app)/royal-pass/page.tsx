'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Gift, Sparkles, Trophy, Star, AlertTriangle, XCircle, Lock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Giveaway {
    id: string;
    jackpotName: string;
    jackpotAmount: number;
    entryFee: number;
    isActive: boolean;
}

export default function RoyalPassPage() {
    const { user, updateUser, addTransaction, transactions, tournaments } = useUser();
    const { toast } = useToast();
    const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
    const [winners, setWinners] = useState<any[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('luckyDrawSettingsList');
        if (stored) {
            try {
                setGiveaways(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse luckyDrawSettingsList", e);
            }
        }

        const loadWinners = () => {
            const storedWinners = localStorage.getItem('luckyDrawWinners');
            if (storedWinners) {
                setWinners(JSON.parse(storedWinners));
            } else {
                const initialWinners = [
                    { id: 'w1', name: "SkyKiller99", amount: 2500, date: "Feb 26", jackpot: "Daily Lucky Draw" },
                    { id: 'w2', name: "BGMI_Pro_Z", amount: 1000, date: "Feb 25", jackpot: "Mini Draw" },
                    { id: 'w3', name: "Legend_Zaire", amount: 5000, date: "Feb 24", jackpot: "Mega Jackpot" },
                ];
                setWinners(initialWinners);
            }
        };

        loadWinners();
        window.addEventListener('storage', loadWinners);
        return () => window.removeEventListener('storage', loadWinners);
    }, []);

    const hasJoinedAnyTournament = (tournaments || []).some(t => 
        t.participants.some(p => p.user.id === user?.id)
    );

    const handleJoinDraw = (giveaway: Giveaway) => {
        if (!user) {
            toast({ variant: 'destructive', title: "Not Logged In" });
            return;
        }

        const currentEntriesCount = (transactions || []).filter(tx => 
            tx.description === `Joined Lucky Draw: ${giveaway.jackpotName}` && 
            tx.status === 'completed'
        ).length;

        if (currentEntriesCount >= 1) {
            toast({
                variant: 'destructive',
                title: "Limit Reached",
                description: "You have already joined this lucky draw.",
            });
            return;
        }

        if (user.walletBalance < giveaway.entryFee) {
            toast({
                variant: 'destructive',
                title: "Insufficient Balance",
                description: `You need at least ₹${giveaway.entryFee} to join.`,
            });
            return;
        }

        updateUser({ walletBalance: user.walletBalance - giveaway.entryFee });

        addTransaction({
            amount: giveaway.entryFee,
            type: 'debit',
            description: `Joined Lucky Draw: ${giveaway.jackpotName}`,
            status: 'completed',
        });

        toast({
            title: "Joined Successfully!",
            description: `You have been entered into ${giveaway.jackpotName}.`,
        });
    };

    const activeGiveaways = giveaways.filter(g => g.isActive);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/home">
                    <Button variant="outline" size="icon" className="h-7 w-7">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                </Link>
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">Royal Pass</h1>
                    <p className="text-muted-foreground text-sm">Join giveaways to win big rewards!</p>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="font-headline text-xl font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-400" />
                    Active Giveaways
                </h2>
                {activeGiveaways.length > 0 ? (
                    <div className="grid gap-6">
                        {activeGiveaways.map((giveaway) => {
                            const isJoined = (transactions || []).some(tx => 
                                tx.description === `Joined Lucky Draw: ${giveaway.jackpotName}` && 
                                tx.status === 'completed'
                            );

                            return (
                                <Card key={giveaway.id} className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-accent/5 shadow-xl shadow-primary/5">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="font-headline text-xl">{giveaway.jackpotName}</CardTitle>
                                            <Badge className="bg-accent text-white font-bold">LIVE</Badge>
                                        </div>
                                        <CardDescription className="text-white/70">Win big rewards from this pool!</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="relative rounded-xl bg-card/50 border border-white/10 p-4 text-center">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Prize Pool</p>
                                            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">
                                                ₹{giveaway.jackpotAmount.toLocaleString()}
                                            </p>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-medium uppercase text-muted-foreground">
                                                <span>Progress</span>
                                                <span>{isJoined ? 'ALREADY JOINED' : (hasJoinedAnyTournament ? 'AVAILABLE' : 'JOIN A MATCH TO UNLOCK')}</span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
                                                <div 
                                                    className={`h-full ${isJoined ? 'bg-primary' : 'bg-muted'}`} 
                                                    style={{ width: isJoined ? '100%' : '0%' }} 
                                                />
                                            </div>
                                        </div>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button 
                                                    className={`w-full h-12 font-bold ${!isJoined && hasJoinedAnyTournament ? 'bg-primary hover:bg-primary/90' : ''}`}
                                                    disabled={isJoined || !hasJoinedAnyTournament}
                                                    variant={isJoined || !hasJoinedAnyTournament ? "secondary" : "default"}
                                                >
                                                    {!hasJoinedAnyTournament ? (
                                                        <><Lock className="mr-2 h-4 w-4" /> ENTRY LOCKED</>
                                                    ) : isJoined ? (
                                                        <><Star className="mr-2 h-4 w-4 fill-primary" /> ALREADY JOINED</>
                                                    ) : (
                                                        <><Gift className="mr-2 h-4 w-4" /> JOIN DRAW (₹{giveaway.entryFee})</>
                                                    )}
                                                </Button>
                                            </AlertDialogTrigger>
                                            {!isJoined && hasJoinedAnyTournament && (
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Enter {giveaway.jackpotName}?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            ₹{giveaway.entryFee} will be deducted from your wallet balance.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleJoinDraw(giveaway)}>Confirm & Join</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            )}
                                        </AlertDialog>
                                        {!hasJoinedAnyTournament && (
                                            <p className="text-[10px] text-center text-primary font-bold animate-pulse">
                                                Join any tournament match first to unlock!
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="p-8 text-center border-dashed">
                        <p className="text-muted-foreground text-sm">No giveaways are currently live. Check back soon!</p>
                    </Card>
                )}
            </div>

            {/* Recent Winners */}
            <Card className="border-white/5 bg-card/50">
                <CardHeader className="py-4">
                    <CardTitle className="flex items-center gap-2 text-lg font-headline">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Hall of Fame
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-white/5">
                        {winners.slice(0, 5).map((winner, i) => (
                            <div key={i} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-xs">
                                        {winner.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{winner.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{winner.date} • {winner.jackpot}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-primary">₹{winner.amount.toLocaleString()}</p>
                                    <p className="text-[8px] text-muted-foreground uppercase font-bold">Winner</p>
                                </div>
                            </div>
                        ))}
                        {winners.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                No winners declared yet.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
