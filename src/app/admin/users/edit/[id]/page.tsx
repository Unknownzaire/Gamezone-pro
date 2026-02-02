
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { User, Transaction } from '@/lib/types';
import { mockTransactions, mockUsers } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EditUserPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);

  useEffect(() => {
    if (!id) return;
    const storedUsers = localStorage.getItem('allUsers');
    const allUsers: User[] = storedUsers ? JSON.parse(storedUsers) : mockUsers;
    const userToEdit = allUsers.find(u => u.id === id);

    if (userToEdit) {
      setUser(userToEdit);
      setFormData(userToEdit);

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
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedUsersJSON = localStorage.getItem('allUsers');
    let allUsers: User[] = storedUsersJSON ? JSON.parse(storedUsersJSON) : [];

    const updatedUsers = allUsers.map(u => {
      if (u.id === id) {
        return { 
          ...u, 
          ...formData, 
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
  };

  if (!user) {
    return <div>Loading...</div>; // Or a skeleton loader
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
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" value={formData.username || ''} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" value={formData.password || ''} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile</Label>
              <Input id="mobile" name="mobile" value={formData.mobile || ''} onChange={handleChange} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="walletBalance">Wallet Balance (₹)</Label>
                <Input id="walletBalance" name="walletBalance" type="number" value={formData.walletBalance || 0} onChange={handleChange} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="totalDeposits">Total Deposits (₹)</Label>
                <Input id="totalDeposits" name="totalDeposits" type="number" value={totalDeposits} onChange={(e) => setTotalDeposits(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="primaryGame">Primary Game</Label>
                <Select name="primaryGame" value={formData.primaryGame} onValueChange={(value) => handleSelectChange('primaryGame', value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a game" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="BGMI">BGMI</SelectItem>
                        <SelectItem value="FREE FIRE">FREE FIRE</SelectItem>
                        <SelectItem value="COD">COD</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inGameUsername">In-Game Username</Label>
              <Input id="inGameUsername" name="inGameUsername" value={formData.inGameUsername || ''} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inGameId">In-Game ID</Label>
              <Input id="inGameId" name="inGameId" value={formData.inGameId || ''} onChange={handleChange} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="referralCode">Referral Code</Label>
                <Input id="referralCode" name="referralCode" value={formData.referralCode || ''} onChange={handleChange} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="totalReferrals">Total Referrals</Label>
                <Input id="totalReferrals" name="totalReferrals" type="number" value={totalReferrals} onChange={(e) => setTotalReferrals(Number(e.target.value))} />
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
