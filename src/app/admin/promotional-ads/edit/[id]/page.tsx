'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { PromotionalAd } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { compressImage } from '@/lib/utils';

// FIREBASE IMPORTS
import { useFirebase } from '@/firebase';
import { doc, onSnapshot, updateDoc, collection } from 'firebase/firestore';

export default function EditPromotionalAdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const [formData, setFormData] = useState<Partial<PromotionalAd>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tournaments, setTournaments] = useState<any[]>([]);

  useEffect(() => {
    if (!firestore || !id) return;

    // Ad data listener
    const unsubAd = onSnapshot(doc(firestore, 'promotional_ads', id), (snap) => {
      if (snap.exists()) setFormData(snap.data());
      else router.push('/admin/promotional-ads');
    });

    // Tournaments listener for link selection
    const unsubTournaments = onSnapshot(collection(firestore, 'tournaments'), (snapshot) => {
      setTournaments(snapshot.docs.map(snap => ({ id: snap.id, ...snap.data() })));
    });

    return () => {
        unsubAd();
        unsubTournaments();
    };
  }, [firestore, id, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
  };
  
  const handleTournamentLinkSelect = (tournamentId: string) => {
    const t = tournaments.find(t => t.id === tournamentId);
    if (t) setFormData(prev => ({ ...prev, title: t.title, link: `/tournaments/${t.id}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !id) return;

    setIsSubmitting(true);
    try {
      let imageUrl = formData.imageUrl;
      if (imageFile) imageUrl = await compressImage(imageFile, { maxWidth: 1280, maxHeight: 720, quality: 0.7 });

      await updateDoc(doc(firestore, 'promotional_ads', id), { ...formData, imageUrl });

      toast({ title: "Ad Updated" });
      router.push('/admin/promotional-ads');
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Update Failed' });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!formData.title) return <div className="p-8 text-center">Loading ad data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/promotional-ads"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="font-headline text-3xl font-bold">Edit Promotional Ad</h1>
          <p className="text-muted-foreground">{formData.title}</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader><CardTitle>Ad Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={formData.title ?? ''} onChange={(e) => setFormData(p => ({...p, title: e.target.value}))} required />
            </div>
            <div className="space-y-2">
              <Label>Link to Tournament</Label>
              <Select onValueChange={handleTournamentLinkSelect}>
                <SelectTrigger><SelectValue placeholder="Quick link match" /></SelectTrigger>
                <SelectContent>
                  {tournaments.filter(t => t.status !== 'Completed').map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input value={formData.link ?? ''} onChange={(e) => setFormData(p => ({...p, link: e.target.value}))} placeholder="URL" className="mt-2" required />
            </div>
            <div className="space-y-2">
              <Label>Replace Image</Label>
              <Input type="file" accept="image/*" onChange={handleFileChange} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
