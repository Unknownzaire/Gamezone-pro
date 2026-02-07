
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PromotionalAd, Tournament } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/use-user.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { compressImage } from '@/lib/utils';

export default function EditPromotionalAdPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const { promotionalAds, setPromotionalAds, tournaments } = useUser();

  const [ad, setAd] = useState<PromotionalAd | null>(null);
  const [formData, setFormData] = useState<Partial<PromotionalAd>>({
    title: '',
    link: '',
    imageUrl: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const adToEdit = promotionalAds.find(a => a.id === id);

    if (adToEdit) {
      setAd(adToEdit);
      setFormData(adToEdit);
    } else {
      // We check this after a small delay to allow promotionalAds to load
      setTimeout(() => {
        const adToEdit = promotionalAds.find(a => a.id === id);
        if (!adToEdit) {
            router.push('/admin/promotional-ads');
        }
      }, 1000);
    }
  }, [id, promotionalAds, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };
  
  const handleTournamentLinkSelect = (tournamentId: string) => {
    const selectedTournament = tournaments.find(t => t.id === tournamentId);
    if (selectedTournament) {
      setFormData(prev => ({
        ...prev,
        title: selectedTournament.title,
        link: `/tournaments/${selectedTournament.id}`
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let finalImageUrl = formData.imageUrl;
      
      if (imageFile) {
        finalImageUrl = await compressImage(imageFile, { maxWidth: 1280, maxHeight: 720, quality: 0.7 });
      }

      const updatedAd: PromotionalAd = {
        ...(ad as PromotionalAd),
        ...formData,
        imageUrl: finalImageUrl!,
      };

      setPromotionalAds(prevAds => prevAds.map(a => a.id === id ? updatedAd : a));

      toast({
        title: "Promotional Ad Updated",
        description: `The ad "${formData.title}" has been updated.`,
      });
      router.push('/admin/promotional-ads');
    } catch (error) {
        console.error("Ad update error:", error);
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not process the image.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!ad) {
    return <div>Loading...</div>; // Or a skeleton loader
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/promotional-ads">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-headline text-3xl font-bold">Edit Promotional Ad</h1>
          <p className="text-muted-foreground">Editing ad: {ad.title}</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Ad Details</CardTitle>
            <CardDescription>Update the information for your promotional ad.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Ad Title</Label>
              <Input id="title" name="title" value={formData.title} onChange={handleChange} required disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ad-link-select">Link to Tournament</Label>
              <Select onValueChange={handleTournamentLinkSelect} disabled={isSubmitting}>
                <SelectTrigger id="ad-link-select">
                  <SelectValue placeholder="show only live and upcoming" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.filter(t => t.status !== 'Completed').map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="link"
                name="link"
                value={formData.link}
                onChange={handleChange}
                placeholder="Or enter a custom URL"
                className="mt-2"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageFile">Ad Image</Label>
              <Input id="imageFile" type="file" accept="image/*" onChange={handleFileChange} disabled={isSubmitting} />
              <p className="text-xs text-muted-foreground">Current image is set. Upload a new file to replace it.</p>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
