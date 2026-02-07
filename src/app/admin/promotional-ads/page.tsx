
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
import { ArrowLeft, PlusCircle, Trash2, Pencil } from 'lucide-react';
import { useUser } from '@/hooks/use-user.tsx';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { compressImage } from '@/lib/utils';

export default function AdminPromotionalAdsPage() {
  const { promotionalAds, setPromotionalAds, tournaments } = useUser();
  const [adToDelete, setAdToDelete] = useState<PromotionalAd | null>(null);
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [imageFile, setimageFile] = useState<File | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isFormVisible) {
      setTitle('');
      setLink('');
      setimageFile(null);
    }
  }, [isFormVisible]);


  const handleCreateAd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
        // Use conservative compression for localStorage
        const imageUrl = await compressImage(imageFile, { maxWidth: 800, maxHeight: 450, quality: 0.6 });
        const newAd: PromotionalAd = {
            id: `ad-${Date.now()}`,
            title,
            imageUrl,
            link,
            status: 'active',
        };
        setPromotionalAds(prev => [...prev, newAd]);
        toast({ title: 'Promotional Ad Created', description: `The ad "${title}" is now live.` });
        setIsFormVisible(false);
    } catch (error) {
        console.error("Ad creation error:", error);
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not process the image.' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleDeleteAd = () => {
    if (!adToDelete) return;
    setPromotionalAds(prev => prev.filter(ad => ad.id !== adToDelete.id));
    toast({ title: 'Ad Deleted', description: `The ad "${adToDelete.title}" has been removed.` });
    setAdToDelete(null);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setimageFile(e.target.files[0]);
    }
  };
  
  const handleToggleStatus = (ad: PromotionalAd) => {
    setPromotionalAds(prev => prev.map(a => 
      a.id === ad.id ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' } : a
    ));
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
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ad-link-select">Link to Tournament</Label>
                         <Select onValueChange={handleTournamentLinkSelect} >
                            <SelectTrigger id="ad-link-select">
                                <SelectValue placeholder="Select a tournament to auto-fill fields" />
                            </SelectTrigger>
                            <SelectContent>
                                {tournaments.map(t => (
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
                        />
                         <p className="text-xs text-muted-foreground">Smaller images help improve performance.</p>
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Ad'}
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
                                    <Image src={ad.imageUrl} alt={ad.title} width={128} height={72} className="rounded-md object-cover aspect-video" />
                                </TableCell>
                                <TableCell className="font-medium">{ad.title}</TableCell>
                                <TableCell>
                                    <Badge variant={ad.status === 'active' ? 'default' : 'secondary'}>{ad.status}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Link href={ad.link} target="_blank" className="text-primary hover:underline text-xs truncate">
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
                                                        This will permanently delete the ad "{ad.title}". This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel onClick={() => setAdToDelete(null)}>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteAd()} className="bg-destructive hover:bg-destructive/90">after tap this button delete ads</AlertDialogAction>
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
