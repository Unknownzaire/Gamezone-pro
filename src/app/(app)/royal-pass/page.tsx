'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Gift, Sparkles, Trophy, Star, AlertTriangle, XCircle, Lock } from "lucide-react";
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

export default function RoyalPassPage() {
    const { user, updateUser, addTransaction, transactions, tournaments } = useUser();
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        jackpotName: 'Daily Lucky Draw',
        jackpotAmount: 5000,
        entryFee: 10,
        isActive: true,
        maxEntries: 1
    });
    const [winners, setWinners] = useState<any[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('luckyDrawSettings');
        if (stored) {
            try {
                setSettings(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse luckyDrawSettings", e);
            }
        }

        const loadWinners = () => {
            const storedWinners = localStorage.getItem('luckyDrawWinners');
            if (storedWinners) {
                setWinners(JSON.parse(storedWinners));
            } else {
                const initialWinners = [
                    { id: 'w1', name: "SkyKiller99", amount: 2500, date: "Feb 26", color: "text-primary" },
                    { id: 'w2', name: "BGMI_Pro_Z", amount: 1000, date: "Feb 25", color: "text-muted-foreground" },
                    { id: 'w3', name: "Legend_Zaire", amount: 5000, date: "Feb 24", color: "text-yellow-400" },
                ];
                setWinners(initialWinners);
            }
        };

        loadWinners();
        window.addEventListener('storage', loadWinners);
        return () => window.removeEventListener('storage', loadWinners);
    }, []);

    // Calculate if user has joined ANY tournament
    const hasJoinedAnyTournament = (tournaments || []).some(t => 
        t.participants.some(p => p.user.id === user?.id)
    );

    // Calculate entries for the current user for this draw
    const currentEntriesCount = (transactions || []).filter(tx => 
        tx.description.startsWith(`Joined Lucky Draw:`) && 
        tx.status === 'completed'
    ).length;

    const handleJoinDraw = () => {
        if (!user) {
            toast({
                variant: 'destructive',
                title: "Not Logged In",
                description: "Please log in to join the lucky draw.",
            });
            return;
        }

        if (!settings.isActive) {
            toast({
                variant: 'destructive',
                title: "Draw Closed",
                description: "This lucky draw is currently not accepting entries.",
            });
            return;
        }

        if (!hasJoinedAnyTournament) {
            toast({
                variant: 'destructive',
                title: "Entry Locked",
                description: "You must join at least one tournament match to unlock the lucky draw.",
            });
            return;
        }

        if (currentEntriesCount >= 1) {
            toast({
                variant: 'destructive',
                title: "Limit Reached",
                description: "You have already joined this lucky draw. Only 1 entry per player is allowed.",
            });
            return;
        }

        if (user.walletBalance < settings.entryFee) {
            toast({
                variant: 'destructive',
                title: "Insufficient Balance",
                description: `You need at least ₹${settings.entryFee} to join the lucky draw.`,
            });
            return;
        }

        updateUser({ walletBalance: user.walletBalance - settings.entryFee });

        addTransaction({
            amount: settings.entryFee,
            type: 'debit',
            description: `Joined Lucky Draw: ${settings.jackpotName}`,
            status: 'completed',
        });

        toast({
            title: "Joined Successfully!",
            description: `You have been entered into ${settings.jackpotName}.`,
        });
    };

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
                    <p className="text-muted-foreground text-sm">Try your luck to win rewards!</p>
                </div>
            </div>

            {/* Lucky Draw Section */}
            <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/20 via-background to-accent/10 shadow-xl shadow-primary/5">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                            <Sparkles className={`h-6 w-6 ${settings.isActive ? 'text-yellow-400 animate-pulse' : 'text-muted-foreground'}`} />
                            {settings.jackpotName}
                        </CardTitle>
                        <Badge className={`${settings.isActive ? 'bg-accent hover:bg-accent/90' : 'bg-muted text-muted-foreground'} text-white font-bold`}>
                            {settings.isActive ? 'LIVE' : 'CLOSED'}
                        </Badge>
                    </div>
                    <CardDescription className="text-white/70">
                        {settings.isActive ? 'Win big rewards every single week!' : 'This draw is currently closed. Stay tuned for the next one!'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="relative group">
                        {settings.isActive && <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>}
                        <div className={`relative rounded-xl ${settings.isActive ? 'bg-card/80 border-white/10' : 'bg-muted/50 border-dashed'} border p-6 text-center space-y-2`}>
                            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-black">Prize Pool</p>
                            <p className={`text-5xl font-black ${settings.isActive ? 'text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-accent' : 'text-muted-foreground'} drop-shadow-sm`}>
                                ₹{settings.jackpotAmount.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-medium uppercase text-muted-foreground">
                            <span>Status</span>
                            <span>
                                {!hasJoinedAnyTournament ? 'JOIN A MATCH TO UNLOCK' : (currentEntriesCount >= 1 ? 'ALREADY JOINED' : (settings.isActive ? 'NOT ENTERED' : 'DRAW CLOSED'))}
                            </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden border border-white/5">
                            <div 
                                className={`h-full ${settings.isActive && hasJoinedAnyTournament ? 'bg-gradient-to-r from-primary to-accent' : 'bg-muted'} transition-all duration-500`} 
                                style={{ width: currentEntriesCount >= 1 ? '100%' : '0%' }} 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    className={`w-full h-14 text-lg font-black shadow-lg transition-transform active:scale-95 group ${settings.isActive && hasJoinedAnyTournament ? 'shadow-primary/20 bg-primary hover:bg-primary/90' : ''}`}
                                    disabled={currentEntriesCount >= 1 || !settings.isActive || !hasJoinedAnyTournament}
                                    variant={settings.isActive && hasJoinedAnyTournament ? "default" : "secondary"}
                                >
                                    {!settings.isActive ? (
                                        <>
                                            <XCircle className="mr-2 h-6 w-6" />
                                            DRAW CLOSED
                                        </>
                                    ) : !hasJoinedAnyTournament ? (
                                        <>
                                            <Lock className="mr-2 h-6 w-6" />
                                            ENTRY LOCKED
                                        </>
                                    ) : (
                                        <>
                                            <Gift className="mr-2 h-6 w-6 group-hover:rotate-12 transition-transform" />
                                            {currentEntriesCount >= 1 ? 'ALREADY JOINED' : `JOIN DRAW (₹${settings.entryFee})`}
                                        </>
                                    )}
                                </Button>
                            </AlertDialogTrigger>
                            {hasJoinedAnyTournament && settings.isActive && currentEntriesCount < 1 && (
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-primary" />
                                            Confirm Entry
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to join {settings.jackpotName}? ₹{settings.entryFee} will be deducted from your wallet balance. Only 1 entry per player is allowed.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleJoinDraw}>
                                            Confirm & Join
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            )}
                        </AlertDialog>
                        {!hasJoinedAnyTournament && settings.isActive && (
                            <p className="text-xs text-center text-primary font-bold animate-pulse">
                                Please join any tournament match first to unlock this draw!
                            </p>
                        )}
                        <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider font-semibold">
                            Winner announced every Sunday
                        </p>
                    </div>
                </CardContent>
            </Card>

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
                                        <p className="text-[10px] text-muted-foreground">{winner.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-black text-lg ${winner.color || 'text-primary'}`}>₹{winner.amount.toLocaleString()}</p>
                                    <p className="text-[8px] text-muted-foreground uppercase font-bold">Winner</p>
                                </div>
                            </div>
                        ))}
                        {winners.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                No winners declared yet. Be the first!
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}