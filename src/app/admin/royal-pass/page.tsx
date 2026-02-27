
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user.tsx";
import { ArrowLeft, Gift, Sparkles, Trophy, Users, Star, RefreshCw, Trash2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Transaction, User } from '@/lib/types';
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
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminRoyalPassPage() {
    const { allUsers, allTransactions, addNotification, updateUser, addTransaction, reload } = useUser();
    const { toast } = useToast();

    const [jackpotAmount, setJackpotAmount] = useState(5000);
    const [entryFee, setEntryFee] = useState(10);
    const [recentWinners, setRecentWinners] = useState([
        { id: 'w1', name: "SkyKiller99", amount: 2500, date: "2026-02-26" },
        { id: 'w2', name: "BGMI_Pro_Z", amount: 1000, date: "2026-02-25" },
        { id: 'w3', name: "Legend_Zaire", amount: 5000, date: "2026-02-24" },
    ]);

    // Calculate daily entries from transactions
    const dailyEntries = allTransactions.filter(tx => 
        tx.description === 'Joined Daily Lucky Draw' && 
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

        // In a real app, you'd update the database here.
        // For this prototype, we'll simulate the win.
        
        // 1. Credit the winner's wallet
        const updatedBalance = winner.walletBalance + jackpotAmount;
        // Note: updateUser only works for 'currentUser' in the current hook implementation
        // We'll simulate finding the user in 'allUsers' and updating them via localStorage
        const localAllUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
        const userIndex = localAllUsers.findIndex((u: any) => u.id === winner.id);
        if (userIndex !== -1) {
            localAllUsers[userIndex].walletBalance += jackpotAmount;
            localStorage.setItem('allUsers', JSON.stringify(localAllUsers));
        }

        // 2. Record the winning transaction
        const prizeTx: Transaction = {
            id: `tx-win-${Date.now()}`,
            userId: winner.id,
            amount: jackpotAmount,
            type: 'credit',
            description: 'Won Daily Lucky Draw Jackpot!',
            createdAt: new Date(),
            status: 'completed'
        };
        const localAllTransactions = JSON.parse(localStorage.getItem('allTransactions') || '[]');
        localStorage.setItem('allTransactions', JSON.stringify([prizeTx, ...localAllTransactions]));

        // 3. Add to hall of fame
        const newWinnerRecord = {
            id: `hall-${Date.now()}`,
            name: winner.username,
            amount: jackpotAmount,
            date: new Date().toISOString().split('T')[0]
        };
        setRecentWinners([newWinnerRecord, ...recentWinners]);

        // 4. Send notification
        addNotification({
            userId: winner.id,
            title: '🎉 JACKPOT WINNER!',
            description: `Congratulations! You won the Daily Lucky Draw Jackpot of ₹${jackpotAmount.toLocaleString()}!`,
            type: 'general'
        });

        toast({
            title: "Winner Declared!",
            description: `${winner.username} has been awarded ₹${jackpotAmount.toLocaleString()}.`,
        });
        
        reload();
    };

    const handleUpdateSettings = () => {
        toast({
            title: "Settings Saved",
            description: "Lucky Draw configuration has been updated.",
        });
    };

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
                {/* Stats Cards */}
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
                        <p className="text-xs text-muted-foreground">Admin set value</p>
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
                {/* Configuration Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-xl flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Jackpot Configuration
                        </CardTitle>
                        <CardDescription>Adjust the prize and entry costs.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
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
                        </div>
                        <Button className="w-full" onClick={handleUpdateSettings}>Save Settings</Button>
                        
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
                                            This will randomly select one user from today's {dailyEntries.length} entries and award them ₹{jackpotAmount.toLocaleString()}. This action is permanent and will notify the user.
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

                {/* Hall of Fame Management */}
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Hall of Fame Management</CardTitle>
                        <CardDescription>Past winners displayed on the mobile app.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
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
                                        <TableCell>{format(new Date(winner.date), "MMM d")}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => setRecentWinners(recentWinners.filter(w => w.id !== winner.id))}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Royal Pass Users */}
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
