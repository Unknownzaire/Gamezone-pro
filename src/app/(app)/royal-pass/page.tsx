'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Gift, Sparkles, Trophy, Star, AlertTriangle, XCircle, Lock, ChevronRight, Video, Loader2, Users, PlayCircle, ShieldCheck, Zap, Heart } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
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

interface Giveaway {
    id: string;
    jackpotName: string;
    jackpotAmount: number;
    entryFee: number;
    isActive: boolean;
    requiresReel: boolean;
}

export default function RoyalPassPage() {
    const { user, updateUser, addTransaction, transactions, allTransactions, tournaments, allUsers } = useUser();
    const { toast } = useToast();
    const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
    const [winners, setWinners] = useState<any[]>([]);
    
    const [selectedReel, setSelectedReel] = useState<File | null>(null);
    const [isJoining, setIsJoining] = useState(false);
    const [joiningGiveaway, setJoiningGiveaway] = useState<Giveaway | null>(null);
    const [viewingReelUrl, setViewingReelUrl] = useState<string | null>(null);
    const reelInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const stored = localStorage.getItem('luckyDrawSettingsList');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const migrated = parsed.map((g: any) => ({
                    ...g,
                    requiresReel: g.requiresReel !== undefined ? g.requiresReel : true
                }));
                setGiveaways(migrated);
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 20 * 1024 * 1024) {
                toast({ variant: 'destructive', title: "File too large", description: "Please upload a video under 20MB." });
                return;
            }
            setSelectedReel(file);
        }
    };

    const handleJoinDraw = async () => {
        if (!user || !joiningGiveaway) return;
        
        // Strict check: One entry per user
        const alreadyEntered = (transactions || []).some(tx => 
            tx.description === `Joined Lucky Draw: ${joiningGiveaway.jackpotName}` && 
            (tx.status === 'completed' || tx.status === 'pending')
        );

        if (alreadyEntered) {
            toast({ variant: 'destructive', title: "Already Entered", description: "You can only enter this draw once." });
            setJoiningGiveaway(null);
            return;
        }

        if (joiningGiveaway.requiresReel && !selectedReel) {
            toast({ variant: 'destructive', title: "Reel Required", description: "Please upload a video reel to join this giveaway." });
            return;
        }

        if (user.walletBalance < joiningGiveaway.entryFee) {
            toast({ variant: 'destructive', title: "Insufficient Balance", description: "You don't have enough funds to join this draw." });
            return;
        }

        setIsJoining(true);

        try {
            let reelUrl = "";
            if (selectedReel) {
                const reader = new FileReader();
                const reelDataPromise = new Promise<string>((resolve, reject) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(selectedReel);
                });
                reelUrl = await reelDataPromise;
            }

            updateUser({ walletBalance: user.walletBalance - joiningGiveaway.entryFee });

            addTransaction({
                amount: joiningGiveaway.entryFee,
                type: 'debit',
                description: `Joined Lucky Draw: ${joiningGiveaway.jackpotName}`,
                status: 'completed',
                paymentDetails: {
                    method: 'giveaway',
                    reelUrl: reelUrl || undefined
                }
            });

            toast({
                title: "Joined Successfully!",
                description: joiningGiveaway.requiresReel 
                    ? `Your reel has been submitted for ${joiningGiveaway.jackpotName}.`
                    : `You have successfully joined ${joiningGiveaway.jackpotName}.`,
            });

            setJoiningGiveaway(null);
            setSelectedReel(null);
        } catch (error) {
            console.error("Join error:", error);
            toast({ variant: 'destructive', title: "Join Failed", description: "An error occurred while processing your request." });
        } finally {
            setIsJoining(false);
        }
    };

    const getGiveawayEntries = (jackpotName: string) => (allTransactions || []).filter(tx => 
        tx.description === `Joined Lucky Draw: ${jackpotName}` && 
        tx.status === 'completed'
    );

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
                    <h1 className="font-headline text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">Royal Pass</h1>
                    <p className="text-muted-foreground text-sm">Elevate your game with premium perks!</p>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="font-headline text-xl font-bold flex items-center gap-2 px-1">
                    <Sparkles className="h-5 w-5 text-yellow-400" />
                    Active Giveaways
                </h2>
                {activeGiveaways.length > 0 ? (
                    <div className="grid gap-6">
                        {activeGiveaways.map((giveaway) => {
                            const isJoined = (transactions || []).some(tx => 
                                tx.description === `Joined Lucky Draw: ${giveaway.jackpotName}` && 
                                (tx.status === 'completed' || tx.status === 'pending') &&
                                tx.userId === user?.id
                            );

                            const entries = getGiveawayEntries(giveaway.jackpotName);

                            return (
                                <Card key={giveaway.id} className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-accent/5 shadow-xl shadow-primary/5">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="font-headline text-xl">{giveaway.jackpotName}</CardTitle>
                                            <Badge className="bg-accent text-white font-bold">LIVE</Badge>
                                        </div>
                                        <CardDescription className="text-white/70">
                                            {giveaway.requiresReel 
                                                ? "Upload your best BGMI reel to win!" 
                                                : "Join directly for a chance to win!"}
                                        </CardDescription>
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
                                                <span>Status</span>
                                                <span>{isJoined ? 'ALREADY JOINED' : (hasJoinedAnyTournament ? 'AVAILABLE' : 'JOIN A MATCH TO UNLOCK')}</span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
                                                <div 
                                                    className={`h-full ${isJoined ? 'bg-primary' : 'bg-muted'}`} 
                                                    style={{ width: isJoined ? '100%' : '0%' }} 
                                                />
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="link" size="sm" className="h-auto p-0 text-[10px] text-primary/70 hover:text-primary">
                                                            View All {entries.length} Entries & Reels
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
                                                        <DialogHeader>
                                                            <DialogTitle>Entries for {giveaway.jackpotName}</DialogTitle>
                                                            <DialogDescription>Watch submissions from other players.</DialogDescription>
                                                        </DialogHeader>
                                                        <ScrollArea className="flex-1 pr-4">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>User</TableHead>
                                                                        <TableHead className="text-right">Reel</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {entries.map(entry => {
                                                                        const entryUser = allUsers.find(u => u.id === entry.userId);
                                                                        return (
                                                                            <TableRow key={entry.id}>
                                                                                <TableCell>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Avatar className="h-6 w-6">
                                                                                            <AvatarImage src={entryUser?.avatarUrl} />
                                                                                            <AvatarFallback>{entryUser?.username.charAt(0)}</AvatarFallback>
                                                                                        </Avatar>
                                                                                        <span className="text-xs font-medium">{entryUser?.username || 'Unknown'}</span>
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="text-right">
                                                                                    {entry.paymentDetails?.reelUrl ? (
                                                                                        <Button 
                                                                                            size="icon" 
                                                                                            variant="ghost" 
                                                                                            className="h-8 w-8 text-primary" 
                                                                                            onClick={() => setViewingReelUrl(entry.paymentDetails!.reelUrl!)}
                                                                                        >
                                                                                            <Video className="h-4 w-4" />
                                                                                        </Button>
                                                                                    ) : (
                                                                                        <span className="text-[10px] text-muted-foreground italic">No reel</span>
                                                                                    )}
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        );
                                                                    })}
                                                                    {entries.length === 0 && (
                                                                        <TableRow>
                                                                            <TableCell colSpan={2} className="text-center py-8 text-muted-foreground text-xs italic">
                                                                                No entries yet. Be the first to join!
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )}
                                                                </TableBody>
                                                            </Table>
                                                        </ScrollArea>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>

                                        <Dialog open={joiningGiveaway?.id === giveaway.id} onOpenChange={(open) => {
                                            if (!open) {
                                                setJoiningGiveaway(null);
                                                setSelectedReel(null);
                                            } else {
                                                setJoiningGiveaway(giveaway);
                                            }
                                        }}>
                                            <DialogTrigger asChild>
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
                                            </DialogTrigger>
                                            {joiningGiveaway && (
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Join {joiningGiveaway.jackpotName}</DialogTitle>
                                                        <DialogDescription>
                                                            Entry fee: ₹{joiningGiveaway.entryFee} will be deducted from your wallet.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        {joiningGiveaway.requiresReel ? (
                                                            <div className="space-y-2">
                                                                <Label htmlFor="reel">Upload Video Reel (Max 20MB)</Label>
                                                                <div 
                                                                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                                                    onClick={() => reelInputRef.current?.click()}
                                                                >
                                                                    {selectedReel ? (
                                                                        <div className="flex flex-col items-center gap-2">
                                                                            <Video className="h-10 w-10 text-primary" />
                                                                            <p className="text-sm font-medium">{selectedReel.name}</p>
                                                                            <p className="text-xs text-muted-foreground">Click to change video</p>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex flex-col items-center gap-2">
                                                                            <Video className="h-10 w-10 text-muted-foreground" />
                                                                            <p className="text-sm font-medium">Select Video Clip</p>
                                                                            <p className="text-xs text-muted-foreground">MP4, MOV supported</p>
                                                                        </div>
                                                                    )}
                                                                    <Input 
                                                                        id="reel" 
                                                                        type="file" 
                                                                        accept="video/*" 
                                                                        className="hidden" 
                                                                        onChange={handleFileChange} 
                                                                        ref={reelInputRef}
                                                                    />
                                                                </div>
                                                                <div className="text-[10px] text-muted-foreground italic mt-2">
                                                                    * Note: Please upload game-related reels only. By submitting, you agree to our 
                                                                    <Dialog>
                                                                        <DialogTrigger asChild>
                                                                            <button className="underline ml-1 hover:text-primary transition-colors">Terms and Conditions</button>
                                                                        </DialogTrigger>
                                                                        <DialogContent>
                                                                            <DialogHeader>
                                                                                <DialogTitle>Giveaway Terms & Conditions</DialogTitle>
                                                                            </DialogHeader>
                                                                            <ScrollArea className="h-60 mt-4 pr-4">
                                                                                <div className="space-y-4 text-xs leading-relaxed">
                                                                                    <p>1. <strong>Eligibility:</strong> Only registered users of Gamezone Pro who have participated in at least one paid tournament match are eligible to join these draws.</p>
                                                                                    <p>2. <strong>Submission Rules:</strong> For video-entry draws, users must upload an original gameplay reel. Plagiarized, copyrighted, or offensive content will lead to immediate disqualification without refund.</p>
                                                                                    <p>3. <strong>Entry Fee:</strong> The entry fee specified for each draw is non-refundable once the user has successfully joined, regardless of the draw outcome or account status.</p>
                                                                                    <p>4. <strong>Winner Selection:</strong> Winners are selected either randomly via our algorithm (for direct draws) or based on administrator review of submission quality (for video contests). The administrator's decision is final and binding.</p>
                                                                                    <p>5. <strong>Prize Distribution:</strong> Prize money will be credited directly to the winner's app wallet within 24-48 hours after the winner is officially declared.</p>
                                                                                    <p>6. <strong>Fair Play:</strong> Any attempt to manipulate entries, use bots, or create duplicate accounts to enter will result in a permanent ban and forfeiture of all balances.</p>
                                                                                </div>
                                                                            </ScrollArea>
                                                                            <DialogFooter>
                                                                                <DialogClose asChild>
                                                                                    <Button variant="outline">I Understand</Button>
                                                                                </DialogClose>
                                                                            </DialogFooter>
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="p-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
                                                                <Gift className="h-12 w-12 text-primary mx-auto mb-4" />
                                                                <p className="font-semibold">Direct Entry Enabled</p>
                                                                <p className="text-sm text-muted-foreground">No video upload required for this draw.</p>
                                                            </div>
                                                        )}
                                                        
                                                        <div className="bg-muted/50 p-4 rounded-lg flex items-center gap-3">
                                                            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                                                            <p className="text-xs text-muted-foreground">Confirming will deduct ₹{joiningGiveaway.entryFee} from your balance.</p>
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                                        <Button onClick={handleJoinDraw} disabled={(joiningGiveaway.requiresReel && !selectedReel) || isJoining}>
                                                            {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
                                                            {isJoining ? 'Processing...' : 'Confirm Entry'}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            )}
                                        </Dialog>
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
                        <Trophy className="h-5 w-5 text-yellow-400" />
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
                                <div className="flex items-center gap-4">
                                    {winner.reel && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-primary" 
                                            onClick={() => setViewingReelUrl(winner.reel)}
                                            title="Watch Winning Reel"
                                        >
                                            <PlayCircle className="h-5 w-5" />
                                        </Button>
                                    )}
                                    <div className="text-right">
                                        <p className="font-black text-primary">₹{winner.amount.toLocaleString()}</p>
                                        <p className="text-[8px] text-muted-foreground uppercase font-bold">Winner</p>
                                    </div>
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

            <Dialog open={!!viewingReelUrl} onOpenChange={(open) => !open && setViewingReelUrl(null)}>
                <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-black border-none">
                    <div className="aspect-[9/16] relative flex items-center justify-center">
                        {viewingReelUrl && (
                            <video 
                                src={viewingReelUrl} 
                                controls 
                                autoPlay 
                                className="h-full w-full object-contain"
                            />
                        )}
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 text-white bg-black/40 hover:bg-black/60 rounded-full"
                        onClick={() => setViewingReelUrl(null)}
                    >
                        <XCircle className="h-6 w-6" />
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
