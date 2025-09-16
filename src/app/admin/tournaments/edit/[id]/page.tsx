
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, notFound } from 'next/navigation';
import { Tournament, PrizeDistribution } from '@/lib/types';
import { mockTournaments as initialMockTournaments } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { DateTimePicker } from '@/components/ui/datetime-picker';

export default function EditTournamentPage() {
  const router = useRouter();
  const { id } = useParams();
  const { toast } = useToast();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [formData, setFormData] = useState<Partial<Omit<Tournament, 'matchTime' | 'prizeDistribution'>>>({
    title: '',
    gameName: '',
    entryFee: 0,
    prizePool: 0,
    commissionPercentage: 0,
    imageUrl: '',
    imageHint: '',
  });
  const [matchTime, setMatchTime] = useState<Date | undefined>(undefined);
   const [imageFile, setImageFile] = useState<File | null>(null);
   const [prizeDistributions, setPrizeDistributions] = useState<PrizeDistribution[]>([]);
   
   const totalPercentage = prizeDistributions.reduce((sum, item) => sum + (item.percentage || 0), 0);

  useEffect(() => {
    if (!id) return;
    const storedTournaments = localStorage.getItem('allTournaments');
    const allTournaments: Tournament[] = storedTournaments ? JSON.parse(storedTournaments).map((t: any) => ({...t, matchTime: new Date(t.matchTime)})) : initialMockTournaments;
    
    const tournamentToEdit = allTournaments.find(t => t.id === id);
    if (tournamentToEdit) {
      setTournament(tournamentToEdit);
      const { matchTime, prizeDistribution, ...rest } = tournamentToEdit;
      setFormData(rest);
      setMatchTime(new Date(matchTime));
      setPrizeDistributions(prizeDistribution || [
          { rank: '1', percentage: 50 },
          { rank: '2', percentage: 25 },
          { rank: '3', percentage: 15 },
          { rank: '4-10', percentage: 10 },
      ]);
    } else {
      notFound();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseFloat(value) : value;
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setImageFile(e.target.files[0]);
    }
  };

  const handlePrizeChange = (index: number, field: keyof PrizeDistribution | 'amount', value: string | number) => {
    const newDistributions = [...prizeDistributions];
    const dist = { ...newDistributions[index] };
    const prizePool = formData.prizePool || 0;
    
    let currentTotal = prizeDistributions.reduce((sum, item, i) => i === index ? sum : sum + (item.percentage || 0), 0);
    let newPercentage = dist.percentage;

    if (field === 'amount') {
        const amount = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) || 0 : value;
        newPercentage = prizePool > 0 ? parseFloat(((amount / prizePool) * 100).toPrecision(4)) : 0;
    } else if (field === 'percentage') {
        newPercentage = typeof value === 'string' ? parseFloat(value) || 0 : value;
    } else { // 'rank'
        dist[field as 'rank'] = value as string;
        newDistributions[index] = dist;
        setPrizeDistributions(newDistributions);
        return;
    }

    if (currentTotal + newPercentage > 100) {
        toast({
            variant: 'destructive',
            title: "Exceeds 100%",
            description: `Cannot set percentage to ${newPercentage} as it would exceed the 100% total.`
        });
        return; // Do not update state if it exceeds 100%
    }
    
    dist.percentage = newPercentage;
    newDistributions[index] = dist;
    setPrizeDistributions(newDistributions);
};

  const addPrizeRow = () => {
      if (totalPercentage >= 100) {
          toast({ variant: 'destructive', title: "Distribution at 100%", description: "Cannot add more prize tiers." });
          return;
      }
      setPrizeDistributions([...prizeDistributions, { rank: '', percentage: 0 }]);
  };

  const removePrizeRow = (index: number) => {
      const newDistributions = prizeDistributions.filter((_, i) => i !== index);
      setPrizeDistributions(newDistributions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!matchTime) {
      toast({ variant: 'destructive', title: "Match Time Required", description: "Please select a match time." });
      return;
    }

    const finalTotalPercentage = prizeDistributions.reduce((sum, item) => sum + (item.percentage || 0), 0);
    if (Math.abs(finalTotalPercentage - 100) > 0.01) { // Allow for small floating point inaccuracies
        toast({
            variant: 'destructive',
            title: "Invalid Prize Distribution",
            description: `Total prize percentage must be exactly 100%. Current total: ${finalTotalPercentage.toFixed(2)}%`
        });
        return;
    }
    
    const processAndSubmit = (imageUrl?: string) => {
        const updatedData: Tournament = {
            ...(tournament as Tournament),
            ...formData,
            matchTime: matchTime,
            imageUrl: imageUrl ?? formData.imageUrl,
            prizeDistribution: prizeDistributions,
        };

        const storedTournaments = localStorage.getItem('allTournaments');
        let allTournaments: Tournament[] = storedTournaments ? JSON.parse(storedTournaments) : initialMockTournaments;
        
        allTournaments = allTournaments.map(t => t.id === id ? updatedData : t);
        localStorage.setItem('allTournaments', JSON.stringify(allTournaments));

        toast({
            title: "Tournament Updated",
            description: `Details for ${formData.title} have been updated.`,
        });
        router.push('/admin/tournaments');
    };

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const newImageUrl = event.target?.result as string;
            processAndSubmit(newImageUrl);
        };
        reader.readAsDataURL(imageFile);
    } else {
        processAndSubmit();
    }
  };

  const getPrizeAmount = (percentage: number) => {
      const prizePool = formData.prizePool || 0;
      if (!prizePool || !percentage) return 0;
      const amount = (prizePool * percentage) / 100;
      return Number(amount.toFixed(2));
  };

  if (!tournament) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tournaments">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-headline text-3xl font-bold">Edit Tournament</h1>
          <p className="text-muted-foreground">Editing details for {tournament.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-5">
           <div className="lg:col-span-3 space-y-6">
                <Card>
                     <CardHeader>
                        <CardTitle>Tournament Details</CardTitle>
                     </CardHeader>
                    <CardContent className="pt-6 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="title">Tournament Title</Label>
                        <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gameName">Game Name</Label>
                        <Input id="gameName" name="gameName" value={formData.gameName} onChange={handleChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="matchTime">Match Time</Label>
                        <DateTimePicker date={matchTime} setDate={setMatchTime} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="entryFee">Entry Fee (₹)</Label>
                        <Input id="entryFee" name="entryFee" type="number" value={formData.entryFee} onChange={handleChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prizePool">Prize Pool (₹)</Label>
                        <Input id="prizePool" name="prizePool" type="number" value={formData.prizePool} onChange={handleChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="commissionPercentage">Commission (%)</Label>
                        <Input id="commissionPercentage" name="commissionPercentage" type="number" value={formData.commissionPercentage} onChange={handleChange} required />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="imageHint">Image Hint</Label>
                          <Input id="imageHint" name="imageHint" value={formData.imageHint} onChange={handleChange} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="imageFile">Tournament Image</Label>
                          <Input id="imageFile" type="file" accept="image/*" onChange={handleFileChange} />
                          {formData.imageUrl && !imageFile && <p className="text-xs text-muted-foreground pt-1">Current image is set. Upload a new file to replace it.</p>}
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
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor={`percentage-${index}`} className="text-xs">Percentage</Label>
                                        <Input
                                            id={`percentage-${index}`}
                                            type="number"
                                            step="0.01"
                                            placeholder="e.g., 50"
                                            value={dist.percentage}
                                            onChange={(e) => handlePrizeChange(index, 'percentage', e.target.value)}
                                        />
                                    </div>
                                        <div className="space-y-1">
                                        <Label htmlFor={`amount-${index}`} className="text-xs">Amount</Label>
                                        <Input
                                            id={`amount-${index}`}
                                            type="text"
                                            placeholder="e.g., 2500"
                                            value={getPrizeAmount(dist.percentage)} 
                                            onChange={(e) => handlePrizeChange(index, 'amount', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => removePrizeRow(index)}
                                    type="button"
                                    disabled={prizeDistributions.length <= 1}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addPrizeRow} type="button" disabled={totalPercentage >= 100}>Add Prize Tier</Button>
                        <p className="text-xs text-muted-foreground pt-2">
                            Total percentage distributed: {totalPercentage.toFixed(2)}%
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
        <div className="mt-6 flex justify-end">
            <Button type="submit" size="lg">Save Changes</Button>
        </div>
      </form>
    </div>
  );
}

    