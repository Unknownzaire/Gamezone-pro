'use client';

import { useState, useEffect } from 'react';
import { PromotionalAd, Tournament } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, Trash2, Pencil, Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/use-user.tsx';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { compressImage } from '@/lib/utils';

// FIREBASE IMPORTS
import { useFirebase } from '@/firebase';
import { collection, onSnapshot, doc, addDoc, deleteDoc, updateDoc, query } from 'firebase/firestore';

export default function AdminPromotionalAdsPage() {
  const { firestore } = useFirebase();
  const { tournaments } = useUser();
  const [promotionalAds, setPromotionalAds] = useState<PromotionalAd[]>([]);
  const [adToDelete, setAdToDelete] = useState<PromotionalAd | null>(null);
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!firestore) return;

    // Listen for Promotional Ads in Firestore
    const unsubAds = onSnapshot(collection(firestore, 'promotional_ads'), (snapshot) => {
      const adsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PromotionalAd[];
      setPromotionalAds(adsData);
    });

    return () => unsubAds();
  }, [firestore]);

  useEffect(() => {
    if (!isFormVisible) {
      setTitle('');
      setLink('');
      setImageFile(null);
    }
  }, [isFormVisible]);

  const handleCreateAd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    if (!title || !link || !imageFile) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all fields and select an image.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
        const imageUrl = await compressImage(imageFile, { maxWidth: 1200, maxHeight: 600, quality: 0.7 });
        
        await addDoc(collection(firestore, 'promotional_ads'), {
            title,
            imageUrl,
            link,
            status: 'active',
        });

        toast({ title: 'Promotional Ad Created', description: `The ad "${title}" is now live.` });
        setIsFormVisible(false);
    } catch (error) {
        console.error("Ad creation error:", error);
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not process the image or save to Firestore.' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleDeleteAd = async () => {
    if (!adToDelete || !firestore) return;
    try {
      await deleteDoc(doc(firestore, 'promotional_ads', adToDelete.id));
      toast({ title: 'Ad Deleted', description: `The ad "${adToDelete.title}" has been removed.` });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete the ad.' });
    }
    setAdToDelete(null);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };
  
  const handleToggleStatus = async (ad: PromotionalAd) => {
    if (!firestore) return;
    try {
      const adRef = doc(firestore, 'promotional_ads', ad.id);
      await updateDoc(adRef, {
        status: ad.status === 'active' ? 'inactive' : 'active'
      });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update ad status.' });
    }
  };
  
  const handleTournamentLinkSelect = (tournamentId: string) => {
    const selectedTournament = tournaments.find(t => t.id === tournamentId);
    if(selectedTournament) {
        setTitle(selectedTournament.title);
        setLink(`/tournaments/${selectedTournament.id}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
            <Button variant="outline" size="icon" className="h-7 w-7">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            </Link>
            <div>
            <h1 className="font-headline text-3xl font-bold">Promotional Ads</h1>
            <p className="text-muted-foreground">Manage ads displayed on the user home page.</p>
            </div>
        </div>
         <Button onClick={() => setIsFormVisible(!isFormVisible)} disabled={isSubmitting}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {isFormVisible ? 'Cancel' : 'Create New Ad'}
          </Button>
      </div>

      {isFormVisible && (
        <Card>
            <CardHeader>
            <CardTitle>Create a New Promotional Ad</CardTitle>
            <CardDescription>
                This ad will be displayed in a carousel on the home page.
            </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateAd}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="ad-title">Ad Title</Label>
                        <Input
                        id="ad-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Grand Championship - Join Now!"
                        required
                        disabled={isSubmitting}
                        />
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
                            id="ad-link-input"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="Or enter a custom URL"
                            className="mt-2"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ad-image">Ad Image</Label>
                        <Input
                            id="ad-image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            required
                            disabled={isSubmitting}
                        />
                         <p className="text-xs text-muted-foreground">Recommended ratio: 2:1 (e.g., 1200x600).</p>
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Ad...
                          </>
                        ) : 'Create Ad'}
                    </Button>
                </CardContent>
            </form>
        </Card>
      )}

        <Card>
            <CardHeader>
                <CardTitle>Manage Ads</CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Link</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {promotionalAds.map(ad => (
                            <TableRow key={ad.id}>
                                <TableCell>
                                    <div className="relative w-32 h-16 rounded-md overflow-hidden border">
                                        <Image src={ad.imageUrl} alt={ad.title} fill className="object-cover" />
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{ad.title}</TableCell>
                                <TableCell>
                                    <Badge variant={ad.status === 'active' ? 'default' : 'secondary'}>{ad.status}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Link href={ad.link} target="_blank" className="text-primary hover:underline text-xs truncate max-w-[150px] block">
                                        {ad.link}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="outline" size="sm" onClick={() => handleToggleStatus(ad)}>
                                            {ad.status === 'active' ? 'Deactivate' : 'Activate'}
                                        </Button>
                                        <Link href={`/admin/promotional-ads/edit/${ad.id}`}>
                                          <Button variant="ghost" size="icon">
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                        </Link>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" onClick={() => setAdToDelete(ad)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete the ad "{ad.title}" from Firestore. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel onClick={() => setAdToDelete(null)}>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteAd()} className="bg-destructive hover:bg-destructive/90">Delete Ad</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
                 {promotionalAds.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No promotional ads have been created yet.</p>
                 )}
            </CardContent>
        </Card>
    </div>
  );
}
