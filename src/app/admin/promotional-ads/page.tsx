
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
import { ArrowLeft, PlusCircle, Trash2 } from 'lucide-react';
import { useUser } from '@/hooks/use-user.tsx';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function AdminPromotionalAdsPage() {
  const { promotionalAds, setPromotionalAds, tournaments } = useUser();
  const [adToDelete, setAdToDelete] = useState<PromotionalAd | null>(null);
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  useEffect(() => {
    if (isFormVisible && tournaments.length > 0) {
      // Pre-fill the form with the first tournament's data
      const firstTournament = tournaments[0];
      handleTournamentLinkSelect(firstTournament.id);
    } else {
      // Reset form when it's hidden
      setTitle('');
      setLink('');
      setImageFile(null);
    }
  }, [isFormVisible, tournaments]);


  const handleCreateAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !link || !imageFile) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all fields and select an image.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        const newAd: PromotionalAd = {
            id: `ad-${Date.now()}`,
            title,
            imageUrl,
            link,
            status: 'active',
        };
        setPromotionalAds(prev => [...prev, newAd]);
        toast({ title: 'Promotional Ad Created', description: `The ad "${title}" is now live.` });
        
        // Reset form
        setTitle('');
        setLink('');
        setImageFile(null);
        setIsFormVisible(false);
    };
    reader.readAsDataURL(imageFile);
  };
  
  const handleDeleteAd = () => {
    if (!adToDelete) return;
    setPromotionalAds(prev => prev.filter(ad => ad.id !== adToDelete.id));
    toast({ title: 'Ad Deleted', description: `The ad "${adToDelete.title}" has been removed.` });
    setAdToDelete(null);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
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
         <Button onClick={() => setIsFormVisible(!isFormVisible)}>
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
                                <SelectValue placeholder="Select a tournament to auto-fill link" />
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
                         <p className="text-xs text-muted-foreground">Recommended aspect ratio: 16:9 (e.g., 1280x720).</p>
                    </div>
                    <Button type="submit" className="w-full">
                        Create Ad
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
                                        <Button variant="ghost" size="icon" onClick={() => setAdToDelete(ad)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
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

        <AlertDialog open={!!adToDelete} onOpenChange={() => setAdToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the ad "{adToDelete?.title}". This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAd} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
