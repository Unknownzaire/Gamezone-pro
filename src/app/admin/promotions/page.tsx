

'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Transaction } from '@/lib/types';
import { mockUsers, mockTransactions } from '@/lib/mock-data';
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
import { ArrowLeft } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function AdminPromotionsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const loadUsers = useCallback(() => {
    const storedUsers = localStorage.getItem('allUsers');
    setUsers(storedUsers ? JSON.parse(storedUsers) : mockUsers);
  }, []);

  useEffect(() => {
    loadUsers();
    window.addEventListener('storage', loadUsers);
    return () => {
      window.removeEventListener('storage', loadUsers);
    };
  }, [loadUsers]);

  const handleGrantBonus = () => {
    if (!selectedUserId || !amount || !description) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a user and fill in all fields.',
      });
      return;
    }

    const bonusAmount = parseFloat(amount);
    if (isNaN(bonusAmount) || bonusAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid positive amount.',
      });
      return;
    }

    const storedTransactions = localStorage.getItem('allTransactions');
    const allTransactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions) : mockTransactions;

    const newTransaction: Transaction = {
      id: `tx-promo-${Date.now()}-${Math.random()}`,
      userId: selectedUserId,
      amount: bonusAmount,
      type: 'credit',
      description: `Promotion: ${description}`,
      createdAt: new Date(),
      status: 'completed',
    };
    
    const updatedTransactions = [newTransaction, ...allTransactions];
    localStorage.setItem('allTransactions', JSON.stringify(updatedTransactions));
    
    const updatedUsers = users.map(u => 
      u.id === selectedUserId ? { ...u, walletBalance: u.walletBalance + bonusAmount } : u
    );
    localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);

    toast({
      title: 'Bonus Granted!',
      description: `₹${bonusAmount.toLocaleString()} credited to ${users.find(u => u.id === selectedUserId)?.username}.`,
    });
    
    setSelectedUserId('');
    setAmount('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard">
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
        </Link>
        <div>
          <h1 className="font-headline text-3xl font-bold">Promotions</h1>
          <p className="text-muted-foreground">Grant bonuses and promotional credits to users.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grant a Bonus</CardTitle>
          <CardDescription>
            Select a user and specify the bonus amount and reason. The amount will be instantly credited to their wallet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-select">Select User</Label>
            <Select onValueChange={setSelectedUserId} value={selectedUserId}>
              <SelectTrigger id="user-select">
                <SelectValue placeholder="Select a user to credit" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bonus-amount">Bonus Amount (₹)</Label>
            <Input
              id="bonus-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bonus-description">Description / Reason</Label>
            <Textarea
              id="bonus-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Welcome bonus, Special event reward, etc."
            />
          </div>
          <Button onClick={handleGrantBonus} className="w-full">
            Grant Bonus
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
