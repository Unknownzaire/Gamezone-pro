'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Tournament, PrizeDistribution } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Trash2, Loader2, Plus, Pencil } from 'lucide-react';
import Link from 'next/link';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { compressImage } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// FIREBASE IMPORTS
import { useFirebase } from '@/firebase';
import { doc, onSnapshot, updateDoc, Timestamp, setDoc } from 'firebase/firestore';

export default function EditTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const [formData, setFormData] = useState<Partial<Tournament>>({});
  const [matchTime, setMatchTime] = useState<Date | undefined>(undefined);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [prizeDistributions, setPrizeDistributions] = useState<PrizeDistribution[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameList, setGameList] = useState<string[]>([]);

  useEffect(() => {
    if (!firestore || !id) return;

    const unsubTournament = onSnapshot(doc(firestore, 'tournaments', id), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Tournament;
        setFormData(data);
        setMatchTime(data.matchTime instanceof Timestamp ? data.matchTime.toDate() : new Date(data.matchTime));
        setPrizeDistributions(data.prizeDistribution || []);
      }
    });

    const unsubGames = onSnapshot(doc(firestore, 'settings', 'games'), (snap) => {
      if (snap.exists()) {
        setGameList(snap.data().list || []);
      }
    });

    return () => {
        unsubTournament();
        unsubGames();
    };
  }, [firestore, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const handlePrizeChange = (index: number, field: keyof PrizeDistribution, value: string | number) => {
    const newDist = [...prizeDistributions];
    newDist[index] = { ...newDist[index], [field]: field === 'percentage' ? Number(value) : value };
    setPrizeDistributions(newDist);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !id) return;

    setIsSubmitting(true);
    try {
        let finalImageUrl = formData.imageUrl;
        if (imageFile) {
            finalImageUrl = await compressImage(imageFile, { maxWidth: 800, maxHeight: 450, quality: 0.6 });
        }

        await updateDoc(doc(firestore, 'tournaments', id), {
            ...formData,
            matchTime: matchTime ? Timestamp.fromDate(matchTime) : formData.matchTime,
            imageUrl: finalImageUrl,
            prizeDistribution: prizeDistributions,
        });

        toast({ title: "Tournament Updated" });
        router.push('/admin/tournaments');
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Update Failed' });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!formData.title) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tournaments"><Button variant="outline" size="icon" disabled={isSubmitting}><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="font-headline text-3xl font-bold">Edit Tournament</h1>
          <p className="text-muted-foreground">Changes reflect in real-time across the platform.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-5">
           <div className="lg:col-span-3 space-y-6">
                <Card>
                    <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                    <CardContent className="pt-6 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Title</Label>
                        <Input name="title" value={formData.title ?? ''} onChange={handleChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Game</Label>
                        <Select value={formData.gameName ?? ''} onValueChange={(v) => setFormData(p => ({...p, gameName: v}))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {gameList.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                            </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Match Time</Label>
                        <DateTimePicker date={matchTime} setDate={setMatchTime} />
                      </div>
                      <div className="space-y-2">
                        <Label>Entry Fee (₹)</Label>
                        <Input name="entryFee" type="number" value={formData.entryFee ?? 0} onChange={handleChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Prize Pool (₹)</Label>
                        <Input name="prizePool" type="number" value={formData.prizePool ?? 0} onChange={handleChange} required />
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
                                <Input value={dist.rank} onChange={(e) => handlePrizeChange(index, 'rank', e.target.value)} />
                                <Input type="number" value={dist.percentage} onChange={(e) => handlePrizeChange(index, 'percentage', e.target.value)} />
                                <Button variant="ghost" size="icon" onClick={() => setPrizeDistributions(p => p.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => setPrizeDistributions(p => [...p, { rank: '', percentage: 0 }])}>Add Tier</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
        <div className="mt-6 flex justify-end">
            <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
        </div>
      </form>
    </div>
  );
}
