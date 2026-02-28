
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user.tsx";
import { ArrowLeft, Gift, Sparkles, Trophy, Users, Star, RefreshCw, Trash2, Clock, Pencil } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Transaction } from '@/lib/types';
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
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminRoyalPassPage() {
    const { allUsers, allTransactions = [], addNotification, reload } = useUser();
    const { toast } = useToast();

    const [jackpotName, setJackpotName] = useState("Daily Lucky Draw");
    const [jackpotAmount, setJackpotAmount] = useState(5000);
    const [entryFee, setEntryFee] = useState(10);
    const [maxEntries, setMaxEntries] = useState(1);
    const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
    
    const [recentWinners, setRecentWinners] = useState<any[]>([]);

    useEffect(() => {
        const settings = localStorage.getItem('luckyDrawSettings');
        if (settings) {
            try {
                const parsed = JSON.parse(settings);
                setJackpotName(parsed.jackpotName || "Daily Lucky Draw");
                setJackpotAmount(parsed.jackpotAmount || 5000);
                setEntryFee(parsed.entryFee || 10);
                setMaxEntries(parsed.maxEntries || 1);
            } catch (e) {
                console.error("Failed to parse luckyDrawSettings", e);
            }
        }

        const storedWinners = localStorage.getItem('luckyDrawWinners');
        if (storedWinners) {
            setRecentWinners(JSON.parse(storedWinners));
        } else {
            const initialWinners = [
                { id: 'w1', name: "SkyKiller99", amount: 2500, date: "Feb 26" },
                { id: 'w2', name: "BGMI_Pro_Z", amount: 1000, date: "Feb 25" },
                { id: 'w3', name: "Legend_Zaire", amount: 5000, date: "Feb 24" },
            ];
            setRecentWinners(initialWinners);
            localStorage.setItem('luckyDrawWinners', JSON.stringify(initialWinners));
        }
    }, []);

    // Calculate daily entries from transactions (checking for "Joined Lucky Draw")
    const dailyEntries = allTransactions.filter(tx => 
        tx.description.startsWith('Joined Lucky Draw') && 
        tx.status === 'completed' &&
        new Date(tx.createdAt).toDateString() === new Date().toDateString()
    );

    const royalPassUsers = allUsers.filter(u => u.hasRoyalPass);

    const handlePickWinner = () => {
        if (dailyEntries.length === 0) {
            toast({
                variant: 'destructive',
                title: "No Entries",
                description: "There are no entries for today's lucky draw yet.",
            });
            return;
        }

        // Pick a random transaction from daily entries
        const winningTx = dailyEntries[Math.floor(Math.random() * dailyEntries.length)];
        const winner = allUsers.find(u => u.id === winningTx.userId);

        if (!winner) return;

        // 1. Credit the winner's wallet
        const localAllUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
        const userIndex = localAllUsers.findIndex((u: any) => u.id === winner.id);
        if (userIndex !== -1) {
            localAllUsers[userIndex].walletBalance += jackpotAmount;
            localStorage.setItem('allUsers', JSON.stringify(localAllUsers));
        }

        // 2. Record the winning transaction AND Reset all daily entries
        const localAllTransactions = JSON.parse(localStorage.getItem('allTransactions') || '[]').map((t: any) => ({...t, createdAt: new Date(t.createdAt)}));
        
        // Reset descriptions of today's entries so they don't count for the next draw
        const updatedTransactions = localAllTransactions.map((tx: any) => {
            const isTodayDraw = tx.description.startsWith('Joined Lucky Draw') && 
                               tx.status === 'completed' &&
                               new Date(tx.createdAt).toDateString() === new Date().toDateString();
            if (isTodayDraw) {
                return { ...tx, description: `${tx.description} (Draw Completed)` };
            }
            return tx;
        });

        const prizeTx: Transaction = {
            id: `tx-win-${Date.now()}`,
            userId: winner.id,
            amount: jackpotAmount,
            type: 'credit',
            description: `Won ${jackpotName} Jackpot!`,
            createdAt: new Date(),
            status: 'completed'
        };
        
        localStorage.setItem('allTransactions', JSON.stringify([prizeTx, ...updatedTransactions]));

        // 3. Add to hall of fame
        const newWinnerRecord = {
            id: `hall-${Date.now()}`,
            name: winner.username,
            amount: jackpotAmount,
            date: format(new Date(), "MMM d")
        };
        const updatedWinners = [newWinnerRecord, ...recentWinners];
        setRecentWinners(updatedWinners);
        localStorage.setItem('luckyDrawWinners', JSON.stringify(updatedWinners));

        // 4. Send notification
        addNotification({
            userId: winner.id,
            title: '🎉 JACKPOT WINNER!',
            description: `Congratulations! You won the ${jackpotName} of ₹${jackpotAmount.toLocaleString()}!`,
            type: 'general'
        });

        toast({
            title: "Winner Declared!",
            description: `${winner.username} has been awarded ₹${jackpotAmount.toLocaleString()} and entries have been reset.`,
        });
        
        reload();
    };

    const handleUpdateSettings = () => {
        localStorage.setItem('luckyDrawSettings', JSON.stringify({
            jackpotName,
            jackpotAmount,
            entryFee,
            maxEntries
        }));
        toast({
            title: "Settings Saved",
            description: "Lucky Draw configuration has been updated.",
        });
        setIsConfigDialogOpen(false);
    };

    const handleDeleteWinner = (winnerId: string) => {
        const updatedWinners = recentWinners.filter(w => w.id !== winnerId);
        setRecentWinners(updatedWinners);
        localStorage.setItem('luckyDrawWinners', JSON.stringify(updatedWinners));
        toast({ title: "Winner removed from Hall of Fame" });
    };

    const getUserById = (userId: string) => allUsers.find(u => u.id === userId);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/dashboard">
                        <Button variant="outline" size="icon" className="h-7 w-7">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h1 className="font-headline text-3xl font-bold">Royal Pass & Lucky Draw</h1>
                        <p className="text-muted-foreground">Manage prizes, winners, and pass holders.</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => reload()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Data
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Daily Entries</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dailyEntries.length}</div>
                        <p className="text-xs text-muted-foreground">Today's pool: ₹{(dailyEntries.length * entryFee).toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Jackpot</CardTitle>
                        <Gift className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{jackpotAmount.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">{jackpotName}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Passes</CardTitle>
                        <Star className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{royalPassUsers.length}</div>
                        <p className="text-xs text-muted-foreground">Total users with premium</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="font-headline text-xl flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Jackpot Configuration
                            </CardTitle>
                            <CardDescription>Adjust the prize and entry costs.</CardDescription>
                        </div>
                        <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Edit Jackpot Settings</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Jackpot Configuration</DialogTitle>
                                    <DialogDescription>Update the daily jackpot name, amount, entry fee, and entry limits.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="jackpotName">Jackpot Name</Label>
                                        <Input 
                                            id="jackpotName" 
                                            value={jackpotName} 
                                            onChange={(e) => setJackpotName(e.target.value)} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="jackpot">Jackpot Amount (₹)</Label>
                                        <Input 
                                            id="jackpot" 
                                            type="number" 
                                            value={jackpotAmount} 
                                            onChange={(e) => setJackpotAmount(Number(e.target.value))} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fee">Entry Fee (₹)</Label>
                                        <Input 
                                            id="fee" 
                                            type="number" 
                                            value={entryFee} 
                                            onChange={(e) => setEntryFee(Number(e.target.value))} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxEntries">Max Entries Per User</Label>
                                        <Input 
                                            id="maxEntries" 
                                            type="number" 
                                            value={maxEntries} 
                                            onChange={(e) => setMaxEntries(Number(e.target.value))} 
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button onClick={handleUpdateSettings}>Save Changes</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="col-span-2 rounded-lg border bg-muted/30 p-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Active Jackpot</p>
                                <p className="text-xl font-black">{jackpotName}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-lg border bg-muted/30 p-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Entry Fee</p>
                                <p className="text-xl font-black">₹{entryFee}</p>
                            </div>
                            <div className="rounded-lg border bg-muted/30 p-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Prize Pool</p>
                                <p className="text-xl font-black text-primary">₹{jackpotAmount.toLocaleString()}</p>
                            </div>
                            <div className="rounded-lg border bg-muted/30 p-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Max/User</p>
                                <p className="text-xl font-black">{maxEntries}</p>
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full h-12 text-lg font-bold">
                                        <Trophy className="mr-2 h-5 w-5" />
                                        PICK TODAY'S WINNER
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will randomly select one user from today's {dailyEntries.length} entries and award them ₹{jackpotAmount.toLocaleString()}. 
                                            <br/><br/>
                                            <strong>Note: This will reset all current entries for a fresh draw.</strong>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handlePickWinner}>
                                            Confirm & Pick
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Hall of Fame Management</CardTitle>
                        <CardDescription>Past winners displayed on the mobile app.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-64">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentWinners.map((winner) => (
                                        <TableRow key={winner.id}>
                                            <TableCell className="font-medium">{winner.name}</TableCell>
                                            <TableCell>₹{winner.amount.toLocaleString()}</TableCell>
                                            <TableCell>{winner.date}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteWinner(winner.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-xl flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Today's Lucky Draw Entries
                    </CardTitle>
                    <CardDescription>
                        List of all users who have joined today's draw. Total: {dailyEntries.length}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-96">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Joined At</TableHead>
                                    <TableHead>Balance</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dailyEntries.map((entry) => {
                                    const entryUser = getUserById(entry.userId);
                                    return (
                                        <TableRow key={entry.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={entryUser?.avatarUrl} alt={entryUser?.username} />
                                                        <AvatarFallback>{entryUser?.username?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold">{entryUser?.username || 'Unknown'}</p>
                                                        <p className="text-xs text-muted-foreground">{entryUser?.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{format(new Date(entry.createdAt), "hh:mm a")}</span>
                                                    <span className="text-[10px] text-muted-foreground">{format(new Date(entry.createdAt), "MMM d, yyyy")}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                ₹{entryUser?.walletBalance?.toLocaleString() || 0}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/admin/users/edit/${entryUser?.id}`}>
                                                    <Button variant="outline" size="sm">Manage</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {dailyEntries.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No entries for today's lucky draw yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-xl">Royal Pass Holders</CardTitle>
                    <CardDescription>Users currently enjoying premium benefits.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Primary Game</TableHead>
                                <TableHead>Balance</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {royalPassUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatarUrl} alt={user.username} />
                                                <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold">{user.username}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.primaryGame}</TableCell>
                                    <TableCell>₹{user.walletBalance.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/admin/users/edit/${user.id}`}>
                                            <Button variant="outline" size="sm">Manage Profile</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {royalPassUsers.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                            No users have purchased a Royal Pass yet.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
