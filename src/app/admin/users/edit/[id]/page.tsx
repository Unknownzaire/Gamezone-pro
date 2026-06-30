'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { compressImage } from '@/lib/utils';

// FIREBASE IMPORTS
import { useFirebase } from '@/firebase';
import { doc, onSnapshot, updateDoc, Timestamp, collection, query, orderBy } from 'firebase/firestore';

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<User>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameList, setGameList] = useState<string[]>([]);

  useEffect(() => {
    if (!firestore || !id) return;

    // Games settings listener
    const unsubGames = onSnapshot(doc(firestore, 'settings', 'games'), (snap) => {
        if (snap.exists()) setGameList(snap.data().list || []);
    });

    // User profile listener
    const unsubUser = onSnapshot(doc(firestore, 'users', id), (snap) => {
      if (snap.exists()) setFormData(snap.data());
      else router.push('/admin/users');
    });

    return () => {
        unsubGames();
        unsubUser();
    };
  }, [firestore, id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };
  
  const handleGameProfileChange = (game: string, field: 'inGameUsername' | 'inGameId', value: string) => {
    setFormData(prev => {
      const newProfiles = { ...(prev.gameProfiles || {}) };
      newProfiles[game] = { ...(newProfiles[game] || { inGameUsername: '', inGameId: '' }), [field]: value };
      return { ...prev, gameProfiles: newProfiles };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !id) return;

    setIsSubmitting(true);
    try {
      let avatarUrl = formData.avatarUrl;
      if (avatarFile) avatarUrl = await compressImage(avatarFile, { maxWidth: 200, maxHeight: 200 });

      let coverImageUrl = formData.coverImageUrl;
      if (coverImageFile) coverImageUrl = await compressImage(coverImageFile, { maxWidth: 1000, maxHeight: 400 });

      await updateDoc(doc(firestore, 'users', id), {
        ...formData,
        avatarUrl,
        coverImageUrl,
      });

      toast({ title: "User Updated" });
      router.push('/admin/users');
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Update Failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!formData.username) return <div className="p-8 text-center">Loading user profile...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="font-headline text-3xl font-bold">Edit User</h1>
          <p className="text-muted-foreground">{formData.username}</p>
        </div>
      </div>

      <Card>
        <div className="relative h-32 bg-muted/50">
            {formData.coverImageUrl && <Image src={formData.coverImageUrl} alt="Banner" fill className="object-cover rounded-t-lg" />}
        </div>
        <div className="-mt-12 flex justify-center">
             <Avatar className="h-24 w-24 border-4 border-card">
                <AvatarImage src={formData.avatarUrl} alt={formData.username} />
                <AvatarFallback>{formData.username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
        </div>
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Username</Label>
                    <Input name="username" value={formData.username ?? ''} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input name="email" type="email" value={formData.email ?? ''} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label>Mobile</Label>
                    <Input name="mobile" value={formData.mobile ?? ''} onChange={handleChange} />
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Wallet Balance (₹)</Label>
                    <Input name="walletBalance" type="number" value={formData.walletBalance ?? 0} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label>Referral Code</Label>
                    <Input name="referralCode" value={formData.referralCode ?? ''} onChange={handleChange} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>New Avatar</Label>
                        <Input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} disabled={isSubmitting} />
                    </div>
                    <div className="space-y-2">
                        <Label>New Banner</Label>
                        <Input type="file" accept="image/*" onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)} disabled={isSubmitting} />
                    </div>
                </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <h3 className="font-bold border-b pb-2">Game Profiles</h3>
              <div className="grid gap-4 md:grid-cols-2">
                  {gameList.map(game => (
                    <div key={game} className="p-3 border rounded-md space-y-2">
                      <p className="text-xs font-bold text-primary">{game}</p>
                      <Input placeholder="In-Game Name" value={formData.gameProfiles?.[game]?.inGameUsername ?? ''} onChange={(e) => handleGameProfileChange(game, 'inGameUsername', e.target.value)} />
                      <Input placeholder="In-Game ID" value={formData.gameProfiles?.[game]?.inGameId ?? ''} onChange={(e) => handleGameProfileChange(game, 'inGameId', e.target.value)} />
                    </div>
                  ))}
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Profile'}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
