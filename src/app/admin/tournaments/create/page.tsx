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
import type { Tournament, PrizeDistribution } from "@/lib/types";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { compressImage } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// FIREBASE IMPORTS
import { useFirebase } from '@/firebase';
import { collection, addDoc, doc, onSnapshot, setDoc, Timestamp } from 'firebase/firestore';

export default function CreateTournamentPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { firestore } = useFirebase();

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [prizePool, setPrizePool] = useState(5000);
    const [matchTime, setMatchTime] = useState<Date | undefined>(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gameName, setGameName] = useState('');
    const [matchType, setMatchType] = useState<'Solo' | 'Duo' | 'Squad'>('Solo');
    const [slots, setSlots] = useState(100);
    const [prizeDistributions, setPrizeDistributions] = useState<PrizeDistribution[]>([
        { rank: '1', percentage: 50 },
        { rank: '2', percentage: 25 },
        { rank: '3', percentage: 15 },
        { rank: '4-10', percentage: 10 },
    ]);
    
    const [gameList, setGameList] = useState<string[]>([]);
    const [isAddGameDialogOpen, setIsAddGameDialogOpen] = useState(false);
    const [newGameName, setNewGameName] = useState('');
    const [isEditGameDialogOpen, setIsEditGameDialogOpen] = useState(false);
    const [tempGameList, setTempGameList] = useState<string[]>([]);

    useEffect(() => {
        if (!firestore) return;
        const unsub = onSnapshot(doc(firestore, 'settings', 'games'), (snap) => {
            if (snap.exists()) {
                setGameList(snap.data().list || []);
            } else {
                const defaults = ['BGMI', 'FREE FIRE', 'COD'];
                setDoc(doc(firestore, 'settings', 'games'), { list: defaults });
                setGameList(defaults);
            }
        });
        return () => unsub();
    }, [firestore]);

    const totalPercentage = prizeDistributions.reduce((sum, item) => sum + (item.percentage || 0), 0);

    const handlePrizeChange = (index: number, field: keyof PrizeDistribution | 'amount', value: string | number) => {
        const newDistributions = [...prizeDistributions];
        const dist = { ...newDistributions[index] };
        let currentTotal = prizeDistributions.reduce((sum, item, i) => i === index ? sum : sum + (item.percentage || 0), 0);
        
        if (field === 'rank') {
            dist.rank = value as string;
        } else if (field === 'percentage') {
            const newPercentage = typeof value === 'string' ? parseFloat(value) || 0 : value;
            if (currentTotal + newPercentage > 100) return;
            dist.percentage = newPercentage;
        } else if (field === 'amount') {
            const amount = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) || 0 : value;
            const newPercentage = prizePool > 0 ? parseFloat(((amount / prizePool) * 100).toPrecision(4)) : 0;
            if (currentTotal + newPercentage > 100) return;
            dist.percentage = newPercentage;
        }
        newDistributions[index] = dist;
        setPrizeDistributions(newDistributions);
    };

    const addPrizeRow = () => {
        if (totalPercentage >= 100) return;
        setPrizeDistributions([...prizeDistributions, { rank: '', percentage: 0 }]);
    };

    const removePrizeRow = (index: number) => {
        setPrizeDistributions(prizeDistributions.filter((_, i) => i !== index));
    };

    const handleAddNewGame = async () => {
        if (!newGameName.trim() || !firestore) return;
        const updated = [...gameList, newGameName.trim()];
        await setDoc(doc(firestore, 'settings', 'games'), { list: updated });
        setGameName(newGameName.trim());
        setNewGameName('');
        setIsAddGameDialogOpen(false);
    };

    const handleSaveGameList = async () => {
        if (!firestore) return;
        await setDoc(doc(firestore, 'settings', 'games'), { list: tempGameList });
        setIsEditGameDialogOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!matchTime || !gameName || !firestore) {
            toast({ variant: 'destructive', title: "Missing Information" });
            return;
        }

        const formData = new FormData(e.currentTarget);
        setIsSubmitting(true);
        try {
            let imageUrl = `https://picsum.photos/seed/${Math.random()}/600/400`;
            if (imageFile) {
                imageUrl = await compressImage(imageFile, { maxWidth: 800, maxHeight: 450, quality: 0.6 });
            }

            const newTournament = {
                title: formData.get('title') as string,
                gameName,
                matchType,
                matchTime: Timestamp.fromDate(matchTime),
                entryFee: Number(formData.get('entry-fee')),
                prizePool: prizePool,
                slots: slots,
                commissionPercentage: Number(formData.get('commission')),
                liveStreamLink: formData.get('liveStreamLink') as string,
                imageUrl,
                imageHint: formData.get('imageHint') as string,
                status: 'Upcoming',
                participants: [],
                prizeDistribution: prizeDistributions,
                createdAt: Timestamp.now()
            };

            await addDoc(collection(firestore, 'tournaments'), newTournament);
            toast({ title: "Tournament Created" });
            router.push('/admin/tournaments');
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Creation Failed' });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/tournaments"><Button variant="outline" size="icon" disabled={isSubmitting}><ArrowLeft className="h-4 w-4" /></Button></Link>
                <div>
                    <h1 className="font-headline text-3xl font-bold">Create New Tournament</h1>
                    <p className="text-muted-foreground">Store events directly in Firestore.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 lg:grid-cols-5">
                    <div className="lg:col-span-3 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Tournament Details</CardTitle></CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="title">Tournament Title</Label>
                                    <Input id="title" name="title" defaultValue="New Tournament" required disabled={isSubmitting} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Game Name</Label>
                                    <div className="flex items-center gap-2">
                                        <Select value={gameName} onValueChange={setGameName} disabled={isSubmitting}>
                                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>
                                                {gameList.map(game => <SelectItem key={game} value={game}>{game}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Button variant="outline" size="icon" type="button" onClick={() => setIsAddGameDialogOpen(true)} disabled={isSubmitting}><Plus className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Match Type</Label>
                                    <Select value={matchType} onValueChange={(v) => setMatchType(v as any)} disabled={isSubmitting}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Solo">Solo</SelectItem>
                                            <SelectItem value="Duo">Duo</SelectItem>
                                            <SelectItem value="Squad">Squad</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Match Time</Label>
                                    <DateTimePicker date={matchTime} setDate={setMatchTime} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="entry-fee">Entry Fee (₹)</Label>
                                    <Input id="entry-fee" name="entry-fee" type="number" defaultValue={50} required disabled={isSubmitting} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="prize-pool">Prize Pool (₹)</Label>
                                    <Input id="prize-pool" name="prize-pool" type="number" value={prizePool} onChange={(e) => setPrizePool(Number(e.target.value))} required disabled={isSubmitting} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slots">Entry Limit</Label>
                                    <Input id="slots" name="slots" type="number" value={slots} onChange={(e) => setSlots(Number(e.target.value))} required disabled={isSubmitting} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="commission">Commission (%)</Label>
                                    <Input id="commission" name="commission" type="number" defaultValue={10} required disabled={isSubmitting} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="imageFile">Tournament Image</Label>
                                    <Input id="imageFile" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} disabled={isSubmitting} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader><CardTitle>Prize Distribution</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {prizeDistributions.map((dist, index) => (
                                    <div key={index} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-end">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Rank</Label>
                                            <Input value={dist.rank} onChange={(e) => handlePrizeChange(index, 'rank', e.target.value)} disabled={isSubmitting} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">%</Label>
                                            <Input type="number" value={dist.percentage} onChange={(e) => handlePrizeChange(index, 'percentage', e.target.value)} disabled={isSubmitting} />
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => removePrizeRow(index)} disabled={isSubmitting}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={addPrizeRow} disabled={isSubmitting}>Add Prize Tier</Button>
                                <p className="text-[10px] text-muted-foreground pt-2">Total: {totalPercentage.toFixed(2)}%</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                 <div className="mt-6 flex justify-end">
                    <Button type="submit" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Tournament'}
                    </Button>
                </div>
            </form>

            <Dialog open={isAddGameDialogOpen} onOpenChange={setIsAddGameDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Game</DialogTitle></DialogHeader>
                    <Input value={newGameName} onChange={(e) => setNewGameName(e.target.value)} placeholder="Game Name" />
                    <DialogFooter><Button onClick={handleAddNewGame}>Add</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
