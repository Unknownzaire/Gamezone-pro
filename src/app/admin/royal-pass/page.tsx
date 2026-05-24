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
import { ArrowLeft, Gift, Sparkles, Trophy, Users, Star, RefreshCw, Trash2, Clock, Pencil, Search, Plus, Video, PlayCircle, XCircle } from "lucide-react";
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
import { Switch } from '@/components/ui/switch';

interface Giveaway {
    id: string;
    jackpotName: string;
    jackpotAmount: number;
    entryFee: number;
    isActive: boolean;
    requiresReel: boolean;
}

export default function AdminRoyalPassPage() {
    const { allUsers, allTransactions = [], addNotification, reload } = useUser();
    const { toast } = useToast();

    const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
    const [isCreateDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
    const [editingGiveaway, setEditingGiveaway] = useState<Giveaway | null>(null);
    
    const [newName, setNewName] = useState("");
    const [newAmount, setNewAmount] = useState(1000);
    const [newFee, setNewFee] = useState(10);
    const [newRequiresReel, setNewRequiresReel] = useState(true);

    const [recentWinners, setRecentWinners] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [entryToDelete, setEntryToDelete] = useState<Transaction | null>(null);
    const [viewingReelUrl, setViewingReelUrl] = useState<string | null>(null);

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
        } else {
            const defaultGiveaway = [{
                id: 'default',
                jackpotName: 'Daily Lucky Draw',
                jackpotAmount: 5000,
                entryFee: 10,
                isActive: true,
                requiresReel: true
            }];
            setGiveaways(defaultGiveaway);
            localStorage.setItem('luckyDrawSettingsList', JSON.stringify(defaultGiveaway));
        }

        const storedWinners = localStorage.getItem('luckyDrawWinners');
        if (storedWinners) {
            setRecentWinners(JSON.parse(storedWinners));
        } else {
            const initialWinners = [
                { id: 'w1', name: "SkyKiller99", amount: 2500, date: "Feb 26", jackpot: "Daily Lucky Draw" },
                { id: 'w2', name: "BGMI_Pro_Z", amount: 1000, date: "Feb 25", jackpot: "Mini Draw" },
                { id: 'w3', name: "Legend_Zaire", amount: 5000, date: "Feb 24", jackpot: "Mega Jackpot" },
            ];
            setRecentWinners(initialWinners);
            localStorage.setItem('luckyDrawWinners', JSON.stringify(initialWinners));
        }
    }, []);

    const saveGiveaways = (list: Giveaway[]) => {
        setGiveaways(list);
        localStorage.setItem('luckyDrawSettingsList', JSON.stringify(list));
    };

    const handleCreateGiveaway = () => {
        if (!newName.trim()) return;
        const newGiveaway: Giveaway = {
            id: `g-${Date.now()}`,
            jackpotName: newName,
            jackpotAmount: newAmount,
            entryFee: newFee,
            isActive: true,
            requiresReel: newRequiresReel
        };
        saveGiveaways([...giveaways, newGiveaway]);
        setIsAddDialogOpen(false);
        setNewName("");
        setNewAmount(1000);
        setNewFee(10);
        setNewRequiresReel(true);
        toast({ title: "Giveaway created successfully" });
    };

    const handleUpdateGiveaway = () => {
        if (!editingGiveaway) return;
        const updated = giveaways.map(g => g.id === editingGiveaway.id ? editingGiveaway : g);
        saveGiveaways(updated);
        setIsConfigDialogOpen(false);
        setEditingGiveaway(null);
        toast({ title: "Giveaway updated successfully" });
    };

    const handleDeleteGiveaway = (id: string) => {
        const updated = giveaways.filter(g => g.id !== id);
        saveGiveaways(updated);
        toast({ title: "Giveaway deleted" });
    };

    const handleToggleStatus = (id: string, status: boolean) => {
        const updated = giveaways.map(g => g.id === id ? { ...g, isActive: status } : g);
        saveGiveaways(updated);
        toast({ title: status ? "Giveaway Activated" : "Giveaway Deactivated" });
    };

    const dailyEntries = allTransactions.filter(tx => 
        tx.description.startsWith(`Joined Lucky Draw:`) && 
        tx.status === 'completed'
    );

    const filteredEntries = dailyEntries.filter(entry => {
        const user = allUsers.find(u => u.id === entry.userId);
        return user?.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
               user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
               entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleDeleteEntry = (transactionId: string) => {
        const localAllTransactions = JSON.parse(localStorage.getItem('allTransactions') || '[]').map((t: any) => ({...t, createdAt: new Date(t.createdAt)}));
        const updatedTransactions = localAllTransactions.filter((tx: any) => tx.id !== transactionId);
        localStorage.setItem('allTransactions', JSON.stringify(updatedTransactions));
        toast({ title: "Entry deleted successfully" });
        setEntryToDelete(null);
        reload();
    };

    const handlePickWinner = (giveaway: Giveaway, manualWinnerId?: string) => {
        const poolEntries = dailyEntries.filter(tx => tx.description === `Joined Lucky Draw: ${giveaway.jackpotName}`);
        
        if (poolEntries.length === 0) {
            toast({
                variant: 'destructive',
                title: "No Entries",
                description: `There are no entries for ${giveaway.jackpotName} yet.`,
            });
            return;
        }

        let winner;
        let winningTx;
        if (manualWinnerId) {
            winningTx = poolEntries.find(tx => tx.userId === manualWinnerId);
            winner = allUsers.find(u => u.id === manualWinnerId);
        } else {
            winningTx = poolEntries[Math.floor(Math.random() * poolEntries.length)];
            winner = allUsers.find(u => u.id === winningTx.userId);
        }

        if (!winner || !winningTx) return;

        const localAllUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
        const userIndex = localAllUsers.findIndex((u: any) => u.id === winner.id);
        if (userIndex !== -1) {
            localAllUsers[userIndex].walletBalance += giveaway.jackpotAmount;
            localStorage.setItem('allUsers', JSON.stringify(localAllUsers));
        }

        const localAllTransactions = JSON.parse(localStorage.getItem('allTransactions') || '[]').map((t: any) => ({...t, createdAt: new Date(t.createdAt)}));
        
        const remainingTransactions = localAllTransactions.filter((tx: any) => {
            return tx.description !== `Joined Lucky Draw: ${giveaway.jackpotName}` || tx.status !== 'completed';
        });

        const prizeTx: Transaction = {
            id: `tx-win-${Date.now()}`,
            userId: winner.id,
            amount: giveaway.jackpotAmount,
            type: 'credit',
            description: `Won ${giveaway.jackpotName} Giveaway!`,
            createdAt: new Date(),
            status: 'completed'
        };
        
        localStorage.setItem('allTransactions', JSON.stringify([prizeTx, ...remainingTransactions]));

        const newWinnerRecord = {
            id: `hall-${Date.now()}`,
            name: winner.username,
            amount: giveaway.jackpotAmount,
            date: format(new Date(), "MMM d"),
            jackpot: giveaway.jackpotName,
            reel: winningTx.paymentDetails?.reelUrl
        };
        const updatedWinners = [newWinnerRecord, ...recentWinners];
        setRecentWinners(updatedWinners);
        localStorage.setItem('luckyDrawWinners', JSON.stringify(updatedWinners));

        addNotification({
            userId: winner.id,
            title: '🎉 GIVEAWAY WINNER!',
            description: `Congratulations! You won the ${giveaway.jackpotName} of ₹${giveaway.jackpotAmount.toLocaleString()}!`,
            type: 'general'
        });

        toast({
            title: "Winner Declared!",
            description: `${winner.username} has been awarded ₹${giveaway.jackpotAmount.toLocaleString()} and entries for ${giveaway.jackpotName} have been reset.`,
        });
        
        reload();
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
                        <h1 className="font-headline text-3xl font-bold">Royal Pass & Giveaway</h1>
                        <p className="text-muted-foreground">Manage prizes, winners, and pass holders.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => reload()}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh Data
                    </Button>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Giveaway
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Giveaway</DialogTitle>
                                <DialogDescription>Configure a new prize pool for users to join.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="createName">Giveaway Name</Label>
                                    <Input id="createName" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Weekly Pro Jackpot" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="createAmount">Prize Amount (₹)</Label>
                                    <Input id="createAmount" type="number" value={newAmount} onChange={(e) => setNewAmount(Number(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="createFee">Entry Fee (₹)</Label>
                                    <Input id="createFee" type="number" value={newFee} onChange={(e) => setNewFee(Number(e.target.value))} />
                                </div>
                                <div className="flex items-center justify-between py-2 border-t mt-2">
                                    <div className="space-y-0.5">
                                        <Label>Requires Video Reel</Label>
                                        <p className="text-xs text-muted-foreground">Users must upload a video to join</p>
                                    </div>
                                    <Switch checked={newRequiresReel} onCheckedChange={setNewRequiresReel} />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                <Button onClick={handleCreateGiveaway}>Create</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Entries</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dailyEntries.length}</div>
                        <p className="text-xs text-muted-foreground">Total entries across all draws</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Giveaways</CardTitle>
                        <Gift className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{giveaways.filter(g => g.isActive).length}</div>
                        <p className="text-xs text-muted-foreground">Online prize pools</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Passes</CardTitle>
                        <Star className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{allUsers.filter(u => u.hasRoyalPass).length}</div>
                        <p className="text-xs text-muted-foreground">Total users with premium</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                    {giveaways.map((giveaway) => (
                        <Card key={giveaway.id} className="relative overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="flex-1">
                                    <CardTitle className="font-headline text-xl flex items-center gap-2">
                                        <Sparkles className={`h-5 w-5 ${giveaway.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                        {giveaway.jackpotName}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 mt-1">
                                        <CardDescription>Adjust prize and costs.</CardDescription>
                                        <Badge variant="outline" className="text-[10px] h-4">
                                            {giveaway.requiresReel ? 'Video Entry' : 'Direct Entry'}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch 
                                        checked={giveaway.isActive} 
                                        onCheckedChange={(val) => handleToggleStatus(giveaway.id, val)} 
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => { setEditingGiveaway(giveaway); setIsConfigDialogOpen(true); }}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogTitle>Delete Giveaway?</AlertDialogTitle>
                                            <AlertDialogDescription>This will permanently remove {giveaway.jackpotName}.</AlertDialogDescription>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteGiveaway(giveaway.id)} className="bg-destructive">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-lg border bg-muted/30 p-3">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Entry Fee</p>
                                        <p className="text-lg font-black">₹{giveaway.entryFee}</p>
                                    </div>
                                    <div className="rounded-lg border bg-muted/30 p-3">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Prize Pool</p>
                                        <p className="text-lg font-black text-primary">₹{giveaway.jackpotAmount.toLocaleString()}</p>
                                    </div>
                                </div>
                                
                                <div className="pt-2">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" className="w-full font-bold" disabled={dailyEntries.filter(tx => tx.description === `Joined Lucky Draw: ${giveaway.jackpotName}`).length === 0}>
                                                <Trophy className="mr-2 h-4 w-4" />
                                                RANDOM PICK WINNER
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Award prize for {giveaway.jackpotName}?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will randomly select a winner from the entries for this specific draw and reset its pool.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handlePickWinner(giveaway)}>
                                                    Confirm & Pick
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Hall of Fame</CardTitle>
                        <CardDescription>Recent lucky draw winners.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        <ScrollArea className="h-[400px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Jackpot</TableHead>
                                        <TableHead>Reel</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentWinners.map((winner) => (
                                        <TableRow key={winner.id}>
                                            <TableCell className="font-medium text-xs">{winner.name}</TableCell>
                                            <TableCell className="text-xs text-primary font-semibold">{winner.jackpot}</TableCell>
                                            <TableCell>
                                                {winner.reel ? (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-7 w-7 text-primary" 
                                                        onClick={() => setViewingReelUrl(winner.reel)}
                                                    >
                                                        <Video className="h-3 w-3" />
                                                    </Button>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground italic">None</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs font-bold">₹{winner.amount.toLocaleString()}</TableCell>
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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="font-headline text-xl flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Current Draw Entries ({dailyEntries.length})
                            </CardTitle>
                            <CardDescription>
                                Manage participants for all active draws.
                            </CardDescription>
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search entries or jackpot..." 
                                className="pl-8" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-96">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Jackpot</TableHead>
                                    <TableHead className="text-center">Reel</TableHead>
                                    <TableHead>Joined At</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEntries.map((entry) => {
                                    const entryUser = getUserById(entry.userId);
                                    const jackpotName = entry.description.replace('Joined Lucky Draw: ', '');
                                    const giveaway = giveaways.find(g => g.jackpotName === jackpotName);
                                    const reelUrl = entry.paymentDetails?.reelUrl;
                                    
                                    return (
                                        <TableRow key={entry.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={entryUser?.avatarUrl} alt={entryUser?.username} />
                                                        <AvatarFallback>{entryUser?.username?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold text-xs">{entryUser?.username || 'Unknown'}</p>
                                                        <p className="text-[10px] text-muted-foreground">{entryUser?.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">
                                                    {jackpotName}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {reelUrl ? (
                                                    <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setViewingReelUrl(reelUrl)}>
                                                        <Video className="h-3 w-3" />
                                                        View Reel
                                                    </Button>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground italic">No reel</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-[10px]">
                                                {format(new Date(entry.createdAt), "hh:mm a, MMM d")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {giveaway && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="outline" size="sm" className="h-7 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary border-primary/20">
                                                                    Pick Winner
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogTitle>Select {entryUser?.username} as winner for {jackpotName}?</AlertDialogTitle>
                                                                <AlertDialogDescription>This will award the prize and reset this giveaway's entries.</AlertDialogDescription>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handlePickWinner(giveaway, entryUser?.id)}>Confirm</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-7 w-7 text-destructive"
                                                        onClick={() => setEntryToDelete(entry)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Dialog open={isConfigDialogOpen} onOpenChange={(open) => { if(!open) setEditingGiveaway(null); setIsConfigDialogOpen(open); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Giveaway</DialogTitle>
                    </DialogHeader>
                    {editingGiveaway && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="editName">Giveaway Name</Label>
                                <Input id="editName" value={editingGiveaway.jackpotName} onChange={(e) => setEditingGiveaway({...editingGiveaway, jackpotName: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editAmount">Prize Amount (₹)</Label>
                                <Input id="editAmount" type="number" value={editingGiveaway.jackpotAmount} onChange={(e) => setEditingGiveaway({...editingGiveaway, jackpotAmount: Number(e.target.value)})} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editFee">Entry Fee (₹)</Label>
                                <Input id="editFee" type="number" value={editingGiveaway.entryFee} onChange={(e) => setEditingGiveaway({...editingGiveaway, entryFee: Number(e.target.value)})} />
                            </div>
                            <div className="flex items-center justify-between py-2 border-t mt-2">
                                <div className="space-y-0.5">
                                    <Label>Requires Video Reel</Label>
                                    <p className="text-xs text-muted-foreground">Users must upload a video to join</p>
                                </div>
                                <Switch 
                                    checked={editingGiveaway.requiresReel} 
                                    onCheckedChange={(val) => setEditingGiveaway({...editingGiveaway, requiresReel: val})} 
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleUpdateGiveaway}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!entryToDelete} onOpenChange={(open) => !open && setEntryToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Lucky Draw Entry?</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to remove this entry?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => entryToDelete && handleDeleteEntry(entryToDelete.id)} className="bg-destructive">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
