'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Gift, Sparkles, Trophy, Star, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/use-user.tsx";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
    const { user, updateUser, addTransaction, transactions } = useUser();
    const { toast } = useToast();

    // Calculate today's entries for the current user
    const todayEntriesCount = (transactions || []).filter(tx => 
        tx.description === 'Joined Daily Lucky Draw' && 
        tx.status === 'completed' &&
        new Date(tx.createdAt).toDateString() === new Date().toDateString()
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

        if (todayEntriesCount >= 5) {
            toast({
                variant: 'destructive',
                title: "Limit Reached",
                description: "You can only join the lucky draw 5 times per day.",
            });
            return;
        }

        if (user.walletBalance < 10) {
            toast({
                variant: 'destructive',
                title: "Insufficient Balance",
                description: "You need at least ₹10 to join the lucky draw.",
            });
            return;
        }

        // Deduct balance
        updateUser({ walletBalance: user.walletBalance - 10 });

        // Add transaction
        addTransaction({
            amount: 10,
            type: 'debit',
            description: 'Joined Daily Lucky Draw',
            status: 'completed',
        });

        toast({
            title: "Joined Successfully!",
            description: "You have been entered into today's lucky draw.",
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
                    <p className="text-muted-foreground text-sm">Unlock exclusive rewards & perks.</p>
                </div>
            </div>

            {/* Lucky Draw Section */}
            <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/20 via-background to-accent/10 shadow-xl shadow-primary/5">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                            <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
                            Daily Lucky Draw
                        </CardTitle>
                        <Badge className="bg-accent hover:bg-accent/90 text-white font-bold">LIVE</Badge>
                    </div>
                    <CardDescription className="text-white/70">Win the jackpot every single day!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative rounded-xl bg-card/80 border border-white/10 p-6 text-center space-y-2">
                            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-black">Current Jackpot</p>
                            <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-accent drop-shadow-sm">
                                ₹5,000
                            </p>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-medium uppercase text-muted-foreground">
                            <span>Your Entries Today</span>
                            <span>{todayEntriesCount} / 5</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden border border-white/5">
                            <div 
                                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500" 
                                style={{ width: `${(todayEntriesCount / 5) * 100}%` }} 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    className="w-full h-14 text-lg font-black shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-transform active:scale-95 group"
                                    disabled={todayEntriesCount >= 5}
                                >
                                    <Gift className="mr-2 h-6 w-6 group-hover:rotate-12 transition-transform" />
                                    {todayEntriesCount >= 5 ? 'LIMIT REACHED' : `JOIN DRAW (₹10)`}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-primary" />
                                        Confirm Entry
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to join today's lucky draw? ₹10 will be deducted from your wallet balance. You have joined {todayEntriesCount} times today (Max 5).
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleJoinDraw}>
                                        Confirm & Join
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider font-semibold">
                            Winners announced daily at 9:00 PM IST • Max 5 entries per user
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
                        {[
                            { name: "SkyKiller99", amount: 2500, date: "Feb 26", color: "text-primary" },
                            { name: "BGMI_Pro_Z", amount: 1000, date: "Feb 25", color: "text-muted-foreground" },
                            { name: "Legend_Zaire", amount: 5000, date: "Feb 24", color: "text-yellow-400" },
                        ].map((winner, i) => (
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
                                    <p className={`font-black text-lg ${winner.color}`}>₹{winner.amount.toLocaleString()}</p>
                                    <p className="text-[8px] text-muted-foreground uppercase font-bold">Winner</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Royal Pass Info */}
            <Card className="border-white/5 bg-card/30">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Star className="h-5 w-5 text-accent fill-accent" />
                        <CardTitle className="text-xl font-headline">Coming Soon!</CardTitle>
                    </div>
                    <CardDescription>
                        The elite Royal Pass experience is under heavy development.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            Double Jackpot Entry Chances
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            Zero-Commission Private Rooms
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            Premium "Royal" Badge on Leaderboards
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            Exclusive Weekly Tournaments
                        </li>
                    </ul>
                    <div className="mt-6 p-4 rounded-lg bg-accent/10 border border-accent/20">
                        <p className="text-xs text-accent-foreground font-medium text-center italic">
                            "Stay tuned for exciting new ways to earn rewards and enhance your gaming experience!"
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}