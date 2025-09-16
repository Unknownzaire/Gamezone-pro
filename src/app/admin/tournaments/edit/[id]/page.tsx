
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, notFound } from 'next/navigation';
import { Tournament } from '@/lib/types';
import { mockTournaments } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

// Helper to format date for datetime-local input
const toDateTimeLocal = (date: Date): string => {
    if (!date) return '';
    const ten = (i: number) => (i < 10 ? '0' : '') + i;
    const YYYY = date.getFullYear();
    const MM = ten(date.getMonth() + 1);
    const DD = ten(date.getDate());
    const HH = ten(date.getHours());
    const mm = ten(date.getMinutes());
    return `${YYYY}-${MM}-${DD}T${HH}:${mm}`;
};

export default function EditTournamentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [formData, setFormData] = useState<Partial<Tournament> & { matchTime: string }>({
    title: '',
    gameName: '',
    matchTime: '',
    entryFee: 0,
    prizePool: 0,
    commissionPercentage: 0,
    imageUrl: '',
    imageHint: '',
  });

  useEffect(() => {
    if (!id) return;
    const tournamentToEdit = mockTournaments.find(t => t.id === id);
    if (tournamentToEdit) {
      setTournament(tournamentToEdit);
      setFormData({
        ...tournamentToEdit,
        matchTime: toDateTimeLocal(new Date(tournamentToEdit.matchTime)),
      });
    } else {
      notFound();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would be a server action to update the database
    console.log("Updated tournament data:", {
        ...formData,
        matchTime: new Date(formData.matchTime)
    });
    toast({
      title: "Tournament Updated",
      description: `Details for ${formData.title} have been updated.`,
    });
    router.push('/admin/tournaments');
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

      <Card>
        <form onSubmit={handleSubmit}>
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
              <Input id="matchTime" name="matchTime" type="datetime-local" value={formData.matchTime} onChange={handleChange} required />
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
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit">Save Changes</Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
