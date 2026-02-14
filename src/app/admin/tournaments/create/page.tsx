'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, Loader2, Pencil, Plus } from "lucide-react";
import React, { useState, useEffect } from "react";
import type { Tournament, PrizeDistribution, User } from "@/lib/types";
import { mockTournaments as initialMockTournaments, mockUsers } from "@/lib/mock-data";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { compressImage } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function CreateTournamentPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [prizePool, setPrizePool] = useState(5000);
    const [matchTime, setMatchTime] = useState<Date | undefined>(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gameName, setGameName] = useState('');
    const [prizeDistributions, setPrizeDistributions] = useState<PrizeDistribution[]>([
        { rank: '1', percentage: 50 },
        { rank: '2', percentage: 25 },
        { rank: '3', percentage: 15 },
        { rank: '4-10', percentage: 10 },
    ]);
    
    const [gameList, setGameList] = useState(['BGMI', 'FREE FIRE', 'COD', 'OTHER']);
    const [isAddGameDialogOpen, setIsAddGameDialogOpen] = useState(false);
    const [newGameName, setNewGameName] = useState('');
    const [isEditGameDialogOpen, setIsEditGameDialogOpen] = useState(false);
    const [tempGameList, setTempGameList] = useState<string[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const storedGames = localStorage.getItem('gameList');
        if (storedGames) {
            setGameList(JSON.parse(storedGames));
        } else {
            localStorage.setItem('gameList', JSON.stringify(gameList));
        }
        const storedUsers = localStorage.getItem('allUsers');
        if (storedUsers) {
            setUsers(JSON.parse(storedUsers));
        } else {
            setUsers(mockUsers);
        }
    }, []);

    const totalPercentage = prizeDistributions.reduce((sum, item) => sum + (item.percentage || 0), 0);

    const handlePrizeChange = (index: number, field: keyof PrizeDistribution | 'amount', value: string | number) => {
        const newDistributions = [...prizeDistributions];
        const dist = { ...newDistributions[index] };
        
        let currentTotal = prizeDistributions.reduce((sum, item, i) => i === index ? sum : sum + (item.percentage || 0), 0);
        
        if (field === 'rank') {
            const isDuplicate = newDistributions.some((d, i) => i !== index && d.rank === value);
            if (isDuplicate) {
                toast({
                    variant: 'destructive',
                    title: "Duplicate Rank",
                    description: `The rank "${value}" is already defined. Ranks must be unique.`
                });
                return;
            }
            dist.rank = value as string;
        } else if (field === 'percentage') {
            const newPercentage = typeof value === 'string' ? parseFloat(value) || 0 : value;
            if (currentTotal + newPercentage > 100) {
                toast({
                    variant: 'destructive',
                    title: "Exceeds 100%",
                    description: `Cannot set percentage to ${newPercentage} as it would exceed the 100% total.`
                });
                return;
            }
            dist.percentage = newPercentage;
        } else if (field === 'amount') {
            const amount = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) || 0 : value;
            const newPercentage = prizePool > 0 ? parseFloat(((amount / prizePool) * 100).toPrecision(4)) : 0;
             if (currentTotal + newPercentage > 100) {
                toast({
                    variant: 'destructive',
                    title: "Exceeds 100%",
                    description: `Amount translates to ${newPercentage.toFixed(2)}%, which would exceed the 100% total.`
                });
                return;
            }
            dist.percentage = newPercentage;
        }

        newDistributions[index] = dist;
        setPrizeDistributions(newDistributions);
    };

    const addPrizeRow = () => {
        if (totalPercentage >= 100) {
            toast({ variant: 'destructive', title: "Distribution at 100%", description: "Cannot add more prize tiers as the total is already 100%." });
            return;
        }
        setPrizeDistributions([...prizeDistributions, { rank: '', percentage: 0 }]);
    };

    const removePrizeRow = (index: number) => {
        const newDistributions = prizeDistributions.filter((_, i) => i !== index);
        setPrizeDistributions(newDistributions);
    };

    const handleAddNewGame = () => {
        if (newGameName.trim() === '') {
            toast({ variant: 'destructive', title: 'Game name cannot be empty.' });
            return;
        }
        if (gameList.some(game => game.toLowerCase() === newGameName.trim().toLowerCase())) {
            toast({ variant: 'destructive', title: 'Game already exists.' });
            return;
        }
        const updatedGameList = [...gameList, newGameName.trim()];
        setGameList(updatedGameList);
        localStorage.setItem('gameList', JSON.stringify(updatedGameList));
        setGameName(newGameName.trim()); // also select the new game
        toast({ title: 'Game added successfully.' });
        setNewGameName('');
        setIsAddGameDialogOpen(false);
    };

    const handleSaveGameList = () => {
        const trimmedList = tempGameList.map(g => g.trim());
        if (trimmedList.some(g => g === '')) {
            toast({ variant: 'destructive', title: 'Invalid Name', description: 'Game names cannot be empty.' });
            return;
        }
        const lowercasedSet = new Set(trimmedList.map(g => g.toLowerCase()));
        if (lowercasedSet.size !== trimmedList.length) {
            toast({ variant: 'destructive', title: 'Duplicate Names', description: 'Game names must be unique.' });
            return;
        }
    
        if (gameName && !trimmedList.includes(gameName)) {
            setGameName('');
        }
        
        setGameList(trimmedList);
        localStorage.setItem('gameList', JSON.stringify(trimmedList));
        toast({ title: 'Game List Updated' });
        setIsEditGameDialogOpen(false);
    };
    
    const getUserCountForGame = (gameName: string) => {
        return users.filter(user => user.primaryGame === gameName).length;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        if (!matchTime) {
            toast({ variant: 'destructive', title: "Match Time Required", description: "Please select a match time." });
            return;
        }

        const gameNameFromForm = formData.get('game') as string;
        if (!gameNameFromForm) {
            toast({ variant: 'destructive', title: "Game Required", description: "Please select a game." });
            return;
        }
        
        const entryFee = Number(formData.get('entry-fee'));
        if (entryFee < 0) {
            toast({ variant: 'destructive', title: "Invalid Entry Fee", description: "Entry fee cannot be negative." });
            return;
        }
        
        if (prizePool < 0) {
            toast({ variant: 'destructive', title: "Invalid Prize Pool", description: "Prize pool cannot be negative." });
            return;
        }

        const finalTotalPercentage = prizeDistributions.reduce((sum, item) => sum + (item.percentage || 0), 0);
        if (Math.abs(finalTotalPercentage - 100) > 0.01) {
            toast({
                variant: 'destructive',
                title: "Invalid Prize Distribution",
                description: `Total prize percentage must be exactly 100%. Current total: ${finalTotalPercentage.toFixed(2)}%`
            });
            return;
        }

        setIsSubmitting(true);
        try {
            let imageUrl = `https://picsum.photos/seed/${Math.random()}/600/400`;
            if (imageFile) {
                imageUrl = await compressImage(imageFile, { maxWidth: 800, maxHeight: 450, quality: 0.6 });
            }

            const newTournament: Tournament = {
                id: `t-${Date.now()}`,
                title: formData.get('title') as string,
                gameName: gameNameFromForm,
                matchTime: matchTime,
                entryFee: entryFee,
                prizePool: prizePool,
                commissionPercentage: Number(formData.get('commission')),
                liveStreamLink: formData.get('liveStreamLink') as string,
                imageUrl,
                imageHint: formData.get('imageHint') as string,
                status: 'Upcoming',
                participants: [],
                prizeDistribution: prizeDistributions,
            };

            let allTournaments: Tournament[];
            try {
                const storedTournaments = localStorage.getItem('allTournaments');
                allTournaments = storedTournaments ? JSON.parse(storedTournaments) : initialMockTournaments;
            } catch (error) {
                console.error("Failed to parse tournaments from localStorage", error);
                allTournaments = initialMockTournaments;
            }
            
            localStorage.setItem('allTournaments', JSON.stringify([newTournament, ...allTournaments]));

            toast({
                title: "Tournament Created",
                description: "The new tournament has been successfully created."
            });
            router.push('/admin/tournaments');
        } catch (error) {
            console.error("Tournament creation error:", error);
            toast({ variant: 'destructive', title: 'Creation Failed', description: 'An error occurred while saving the tournament details.' });
        } finally {
            setIsSubmitting(false);
        }
    }

     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };
    
    const getPrizeAmount = (percentage: number) => {
        if(!prizePool || !percentage) return 0;
        const amount = (prizePool * percentage) / 100;
        return Number(amount.toFixed(2));
    }


    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/tournaments">
                    <Button variant="outline" size="icon" disabled={isSubmitting}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="font-headline text-3xl font-bold">Create New Tournament</h1>
                    <p className="text-muted-foreground">Fill in the details to set up a new event.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 lg:grid-cols-5">
                    <div className="lg:col-span-3 space-y-6">
                        <Card>
                             <CardHeader>
                                <CardTitle>Tournament Details</CardTitle>
                             </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="title">Tournament Title</Label>
                                    <Input id="title" name="title" placeholder="e.g., Summer Showdown" defaultValue="Summer Showdown" required disabled={isSubmitting} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="game">Game Name</Label>
                                    <div className="flex items-center gap-2">
                                        <input type="hidden" name="game" value={gameName} />
                                        <Select value={gameName} onValueChange={setGameName} disabled={isSubmitting}>
                                            <SelectTrigger id="game">
                                                <SelectValue placeholder="Select a game" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {gameList.map(game => (
                                                    <SelectItem key={game} value={game}>{game}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Dialog open={isEditGameDialogOpen} onOpenChange={(isOpen) => {
                                            if (isOpen) setTempGameList(gameList);
                                            setIsEditGameDialogOpen(isOpen);
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="icon" type="button" disabled={isSubmitting}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Manage Games</DialogTitle>
                                                    <DialogDescription>
                                                        Edit or delete game names from the list. Deletion is blocked if users have the game selected.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <ScrollArea className="h-72">
                                                    <div className="space-y-2 pr-4">
                                                        {tempGameList.map((game, index) => (
                                                            <div key={index} className="flex items-center gap-2">
                                                                <Input
                                                                    value={game}
                                                                    onChange={(e) => {
                                                                        const newList = [...tempGameList];
                                                                        newList[index] = e.target.value;
                                                                        setTempGameList(newList);
                                                                    }}
                                                                />
                                                                <Badge variant="secondary" className="whitespace-nowrap">{getUserCountForGame(game)} users</Badge>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const gameToDelete = tempGameList[index];
                                                                        const userCount = getUserCountForGame(gameToDelete);
                                                                        if (userCount > 0) {
                                                                            toast({
                                                                                variant: 'destructive',
                                                                                title: 'Cannot Delete Game',
                                                                                description: `"${gameToDelete}" cannot be deleted as ${userCount} user(s) have it as their primary game.`,
                                                                            });
                                                                        } else {
                                                                            const newList = tempGameList.filter((_, i) => i !== index);
                                                                            setTempGameList(newList);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button variant="outline" type="button">Cancel</Button>
                                                    </DialogClose>
                                                    <Button onClick={handleSaveGameList} type="button">Save Changes</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                        <Dialog open={isAddGameDialogOpen} onOpenChange={setIsAddGameDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="icon" type="button" disabled={isSubmitting}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Add a New Game</DialogTitle>
                                                    <DialogDescription>
                                                        Enter the name of the new game to add it to the list.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-2">
                                                    <Label htmlFor="new-game-name">Game Name</Label>
                                                    <Input id="new-game-name" value={newGameName} onChange={(e) => setNewGameName(e.target.value)} />
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button variant="outline">Cancel</Button>
                                                    </DialogClose>
                                                    <Button onClick={handleAddNewGame}>Add Game</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="match-time">Match Time</Label>
                                    <DateTimePicker date={matchTime} setDate={setMatchTime} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="entry-fee">Entry Fee (₹)</Label>
                                    <Input id="entry-fee" name="entry-fee" type="number" placeholder="50" defaultValue={50} required min="0" disabled={isSubmitting} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="prize-pool">Prize Pool (₹)</Label>
                                    <Input id="prize-pool" name="prize-pool" type="number" placeholder="5000" required value={prizePool} onChange={(e) => setPrizePool(Number(e.target.value))} min="0" disabled={isSubmitting} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="commission">Commission (%)</Label>
                                    <Input id="commission" name="commission" type="number" placeholder="10" defaultValue={10} required min="0" disabled={isSubmitting} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="liveStreamLink">Live Stream URL (Optional)</Label>
                                    <Input id="liveStreamLink" name="liveStreamLink" placeholder="https://youtube.com/live/..." disabled={isSubmitting} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="imageHint">Image Hint</Label>
                                    <Input id="imageHint" name="imageHint" placeholder="e.g., epic battle" disabled={isSubmitting} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="imageFile">Tournament Image</Label>
                                    <Input id="imageFile" type="file" accept="image/*" onChange={handleFileChange} disabled={isSubmitting} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Prize Distribution</CardTitle>
                                <CardDescription>Define how the prize pool is distributed.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {prizeDistributions.map((dist, index) => (
                                    <div key={index} className="flex items-end gap-2">
                                        <div className="grid w-full grid-cols-3 gap-2">
                                            <div className="space-y-1">
                                                <Label htmlFor={`rank-${index}`} className="text-xs">Rank(s)</Label>
                                                <Input 
                                                    id={`rank-${index}`}
                                                    placeholder="e.g., 1 or 4-10" 
                                                    value={dist.rank}
                                                    onChange={(e) => handlePrizeChange(index, 'rank', e.target.value)}
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor={`percentage-${index}`} className="text-xs">Percentage</Label>
                                                <Input 
                                                    id={`percentage-${index}`}
                                                    type="number" 
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="e.g., 50"
                                                    value={dist.percentage}
                                                    onChange={(e) => handlePrizeChange(index, 'percentage', e.target.value)}
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor={`amount-${index}`} className="text-xs">Amount</Label>
                                                <Input
                                                    id={`amount-${index}`}
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="e.g., 2500"
                                                    value={getPrizeAmount(dist.percentage)} 
                                                    onChange={(e) => handlePrizeChange(index, 'amount', e.target.value)}
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => removePrizeRow(index)}
                                            type="button"
                                            disabled={prizeDistributions.length <= 1 || isSubmitting}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={addPrizeRow} type="button" disabled={totalPercentage >= 100 || isSubmitting}>Add Prize Tier</Button>
                                <p className="text-xs text-muted-foreground pt-2">
                                    Total percentage distributed: {totalPercentage.toFixed(2)}%
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                 <div className="mt-6 flex justify-end">
                    <Button type="submit" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isSubmitting ? 'Creating...' : 'Create Tournament'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

    