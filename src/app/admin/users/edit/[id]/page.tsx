
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { User, Transaction } from '@/lib/types';
import { mockTransactions, mockUsers } from '@/lib/mock-data';
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

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    username: '',
    email: '',
    password: '',
    mobile: '',
    walletBalance: 0,
    referralCode: '',
    primaryGame: '',
    gameProfiles: {},
  });
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameList, setGameList] = useState<string[]>([]);

  useEffect(() => {
    const storedGames = localStorage.getItem('gameList');
    if (storedGames) {
      setGameList(JSON.parse(storedGames));
    }

    if (!id) return;
    const storedUsers = localStorage.getItem('allUsers');
    const allUsers: User[] = storedUsers ? JSON.parse(storedUsers) : mockUsers;
    const userToEdit = allUsers.find(u => u.id === id);

    if (userToEdit) {
      setUser(userToEdit);
      setFormData(prev => ({ ...prev, ...userToEdit }));

      const storedTransactions = localStorage.getItem('allTransactions');
      const allTransactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions) : mockTransactions;
      
      const deposits = allTransactions
        .filter(tx => tx.userId === id && tx.type === 'credit' && tx.status === 'completed' && (tx.description.toLowerCase().includes('deposit') || tx.description.toLowerCase().includes('added to wallet')))
        .reduce((acc, tx) => acc + tx.amount, 0);
      setTotalDeposits(userToEdit.totalDeposits ?? deposits);
      
      const referrals = allUsers.filter(u => u.referredBy === userToEdit.id).length;
      setTotalReferrals(referrals);

    } else {
      router.push('/admin/users');
    }
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseFloat(value) : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };
  
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleCoverImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImageFile(e.target.files[0]);
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGameProfileChange = (game: string, field: 'inGameUsername' | 'inGameId', value: string) => {
    setFormData(prev => {
      const newGameProfiles = { ...(prev.gameProfiles || {}) };
      newGameProfiles[game] = {
        ...(newGameProfiles[game] || { inGameUsername: '', inGameId: '' }),
        [field]: value,
      };
      return {
        ...prev,
        gameProfiles: newGameProfiles,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let finalAvatarUrl = formData.avatarUrl;
      if (avatarFile) {
        finalAvatarUrl = await compressImage(avatarFile, { maxWidth: 200, maxHeight: 200, quality: 0.8 });
      }

      let finalCoverImageUrl = formData.coverImageUrl;
      if (coverImageFile) {
        finalCoverImageUrl = await compressImage(coverImageFile, { maxWidth: 1000, maxHeight: 400, quality: 0.7 });
      }

      const storedUsersJSON = localStorage.getItem('allUsers');
      let allUsers: User[] = storedUsersJSON ? JSON.parse(storedUsersJSON) : [];

      // Validate uniqueness for Team Name in Admin Edit
      if (formData.teamName && formData.teamName !== user?.teamName) {
          const isTeamNameTaken = allUsers.some(u => u.id !== id && u.teamName?.toLowerCase() === formData.teamName?.toLowerCase());
          if (isTeamNameTaken) {
              toast({
                  variant: 'destructive',
                  title: "Team Name Taken",
                  description: "This team name is already in use by another team."
              });
              setIsSubmitting(false);
              return;
          }
      }

      const updatedUsers = allUsers.map(u => {
        if (u.id === id) {
          return { 
            ...u, 
            ...formData, 
            avatarUrl: finalAvatarUrl,
            coverImageUrl: finalCoverImageUrl,
            totalDeposits: totalDeposits 
          };
        }
        return u;
      });

      localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
      
      toast({
        title: "User Updated",
        description: `Details for ${formData.username} have been updated.`,
      });
      router.push('/admin/users');
    } catch (error) {
      console.error("User update error:", error);
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not process an uploaded image.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-headline text-3xl font-bold">Edit User</h1>
          <p className="text-muted-foreground">Editing profile for {user.username}</p>
        </div>
      </div>

      <Card>
        <div className="relative h-32 bg-muted/50">
            {formData.coverImageUrl && (
                <Image src={formData.coverImageUrl} alt="Cover image" layout="fill" objectFit="cover" className="rounded-t-lg" />
            )}
        </div>
        <div className="-mt-12 flex justify-center">
             <Avatar className="h-24 w-24 border-4 border-card">
                <AvatarImage src={formData.avatarUrl} alt={formData.username || ''} />
                <AvatarFallback>{formData.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
        </div>
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
                <h3 className="font-bold text-lg border-b pb-2">Basic Info</h3>
                <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" name="username" value={formData.username ?? ''} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={formData.email ?? ''} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" value={formData.password ?? ''} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile</Label>
                    <Input id="mobile" name="mobile" value={formData.mobile ?? ''} onChange={handleChange} />
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-lg border-b pb-2">Wallet & Referrals</h3>
                <div className="space-y-2">
                    <Label htmlFor="walletBalance">Wallet Balance (₹)</Label>
                    <Input id="walletBalance" name="walletBalance" type="number" value={formData.walletBalance ?? 0} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="totalDeposits">Total Deposits (₹)</Label>
                    <Input id="totalDeposits" name="totalDeposits" type="number" value={totalDeposits} onChange={(e) => setTotalDeposits(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="referralCode">Referral Code</Label>
                    <Input id="referralCode" name="referralCode" value={formData.referralCode ?? ''} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="totalReferrals">Total Referrals</Label>
                    <Input id="totalReferrals" name="totalReferrals" type="number" value={totalReferrals} onChange={(e) => setTotalReferrals(Number(e.target.value))} />
                </div>
            </div>

            <div className="space-y-4 md:col-span-2">
                <h3 className="font-bold text-lg border-b pb-2">Profile Assets</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="avatarFile">Avatar Image</Label>
                        <Input id="avatarFile" type="file" accept="image/*" onChange={handleAvatarFileChange} disabled={isSubmitting} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="coverImageFile">Cover Image</Label>
                        <Input id="coverImageFile" type="file" accept="image/*" onChange={handleCoverImageFileChange} disabled={isSubmitting} />
                    </div>
                </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <h3 className="font-bold text-lg border-b pb-2">Game Profiles</h3>
              <div className="space-y-2">
                <Label htmlFor="primaryGame">Primary Game</Label>
                <Select name="primaryGame" value={formData.primaryGame ?? ''} onValueChange={(value) => handleSelectChange('primaryGame', value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a game" />
                    </SelectTrigger>
                    <SelectContent>
                        {gameList.map(game => (
                          <SelectItem key={game} value={game}>{game}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="mt-2 space-y-4 rounded-md border p-4">
                {gameList.filter(g => g.toUpperCase() !== 'OTHER').map(game => (
                  <div key={game} className="space-y-2">
                    <Label className="font-semibold">{game}</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor={`${game}-username`} className="text-xs">Username</Label>
                        <Input 
                          id={`${game}-username`} 
                          value={formData.gameProfiles?.[game]?.inGameUsername ?? ''}
                          onChange={(e) => handleGameProfileChange(game, 'inGameUsername', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`${game}-id`} className="text-xs">User ID</Label>
                        <Input 
                          id={`${game}-id`}
                          value={formData.gameProfiles?.[game]?.inGameId ?? ''}
                          onChange={(e) => handleGameProfileChange(game, 'inGameId', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
