'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Transaction } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

// FIREBASE IMPORTS
import { useFirebase } from '@/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  runTransaction, 
  Timestamp, 
  query, 
  orderBy 
} from 'firebase/firestore';

export default function AdminPromotionsPage() {
  const { firestore } = useFirebase();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();
  const [isUserSelectorOpen, setIsUserSelectorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!firestore) return;

    // Listen for users in Firestore to populate the selector
    const unsubUsers = onSnapshot(query(collection(firestore, 'users'), orderBy('username', 'asc')), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
    });

    return () => unsubUsers();
  }, [firestore]);

  const handleGrantBonus = async () => {
    if (!selectedUserId || !amount || !description || !firestore) {
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

    setIsSubmitting(true);

    try {
      const userRef = doc(firestore, 'users', selectedUserId);
      const userTxRef = doc(collection(firestore, 'users', selectedUserId, 'transactions'));
      const promoRef = doc(collection(firestore, 'promotions'));

      await runTransaction(firestore, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User does not exist!");

        const currentBalance = userSnap.data().walletBalance || 0;
        
        // 1. Update user wallet balance
        transaction.update(userRef, { walletBalance: currentBalance + bonusAmount });

        const timestamp = Timestamp.now();
        const promoData = {
          userId: selectedUserId,
          amount: bonusAmount,
          type: 'credit',
          description: `Promotion: ${description}`,
          createdAt: timestamp,
          status: 'completed',
        };

        // 2. Add to user's private transaction history
        transaction.set(userTxRef, promoData);

        // 3. Add to global promotions record
        transaction.set(promoRef, {
          ...promoData,
          id: promoRef.id,
        });
      });

      toast({
        title: 'Bonus Granted!',
        description: `₹${bonusAmount.toLocaleString()} credited to ${users.find(u => u.id === selectedUserId)?.username}.`,
      });
      
      setSelectedUserId('');
      setAmount('');
      setDescription('');
    } catch (e: any) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: e.message || 'Failed to grant bonus. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setIsUserSelectorOpen(false);
  }

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Select a user and specify the bonus amount and reason. The amount will be instantly credited to their wallet in Cloud Firestore.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select User</Label>
            <Dialog open={isUserSelectorOpen} onOpenChange={(isOpen) => {
                setIsUserSelectorOpen(isOpen);
                if (!isOpen) {
                    setSearchTerm('');
                }
            }}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  disabled={isSubmitting}
                >
                  {selectedUserId
                    ? users.find((user) => user.id === selectedUserId)?.username
                    : "Select a user to credit..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Select a User</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <Input 
                        placeholder="Search by username or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <ScrollArea className="h-72">
                        <div className="space-y-2 pr-4">
                            {filteredUsers.map(user => (
                                <div key={user.id} className="flex items-center justify-between gap-2 rounded-md border p-3">
                                    <div>
                                        <p className="font-semibold">{user.username}</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                    <Button size="sm" onClick={() => handleUserSelect(user.id)}>Select</Button>
                                </div>
                            ))}
                            {filteredUsers.length === 0 && (
                              <p className="text-center text-muted-foreground py-8">No users found.</p>
                            )}
                        </div>
                    </ScrollArea>
                </div>
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
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bonus-description">Description / Reason</Label>
            <Textarea
              id="bonus-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Welcome bonus, Special event reward, etc."
              disabled={isSubmitting}
            />
          </div>
          <Button onClick={handleGrantBonus} className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Grant Bonus'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
