

'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Transaction } from '@/lib/types';
import { mockUsers, mockTransactions } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, Check, ChevronsUpDown } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';


const generateUniqueId = (prefix: string, userId: string) => `${prefix}-${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export default function AdminPromotionsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

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
      id: generateUniqueId('tx-promo', selectedUserId),
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
            <Label>Select User</Label>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                >
                  {selectedUserId
                    ? users.find((user) => user.id === selectedUserId)?.username
                    : "Select a user to credit..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0">
                <DialogTitle className="sr-only">Select User</DialogTitle>
                <Command>
                  <CommandInput placeholder="Search user..." />
                  <CommandList>
                    <CommandEmpty>No user found.</CommandEmpty>
                    <CommandGroup>
                      {users.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.username}
                          onSelect={() => {
                            setSelectedUserId(user.id);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedUserId === user.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {user.username} ({user.email})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </DialogContent>
            </Dialog>
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
