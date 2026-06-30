'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, RefreshCw, Search, Settings, MoreHorizontal } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { User, Transaction } from "@/lib/types";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// FIREBASE IMPORTS
import { useFirebase } from '@/firebase';
import { collection, onSnapshot, query, collectionGroup, Timestamp } from 'firebase/firestore';

interface ReferrerStats {
  user: User;
  totalReferrals: number;
  totalEarnings: number;
}

export default function AdminReferralsPage() {
  const { firestore } = useFirebase();
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!firestore) return;

    // Listen for all users in real-time
    const unsubUsers = onSnapshot(collection(firestore, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date())
        } as User;
      });
      setUsers(usersData);
    });

    // Listen for referral bonus transactions using collectionGroup
    const unsubTransactions = onSnapshot(query(collectionGroup(firestore, 'transactions')), (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date())
        } as Transaction;
      });
      setTransactions(transactionsData);
    });

    return () => {
      unsubUsers();
      unsubTransactions();
    };
  }, [firestore]);

  // Calculate referrer statistics reactively
  const referrerStats = useMemo(() => {
    return users.map(user => {
      const referredUsers = users.filter(u => u.referredBy === user.id);
      const totalReferrals = referredUsers.length;
      
      const totalEarnings = transactions
        .filter(tx => tx.userId === user.id && tx.type === 'credit' && tx.description.toLowerCase().includes('referral bonus'))
        .reduce((acc, tx) => acc + tx.amount, 0);

      return { user, totalReferrals, totalEarnings };
    }).sort((a, b) => b.totalReferrals - a.totalReferrals);
  }, [users, transactions]);
  
  const filteredReferrerStats = referrerStats.filter(stat => 
    stat.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stat.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (stat.user.primaryGame && stat.user.gameProfiles?.[stat.user.primaryGame]?.inGameUsername?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRefresh = () => {
    // onSnapshot handles real-time updates automatically.
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="hidden md:block">
              <Button variant="outline" size="icon" className="h-7 w-7">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
              </Button>
          </Link>
          <div>
            <h1 className="font-headline text-3xl font-bold">Referrals</h1>
            <p className="text-muted-foreground">Summary of user referral performance.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Refresh referrals</span>
            </Button>
             <Link href="/admin/settings?show=referrals">
              <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Referral Settings</span>
              </Button>
            </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Referrer Leaderboard</CardTitle>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username, email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead className="text-center">Total Referrals</TableHead>
                <TableHead className="text-right">Total Referral Earning</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReferrerStats.map(({ user, totalReferrals, totalEarnings }) => (
                <TableRow key={user.id}>
                <TableCell>
                    <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={user.avatarUrl} alt={user.username} />
                        <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">
                        <p>{user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    </div>
                </TableCell>
                <TableCell className="text-center font-bold text-lg">{totalReferrals}</TableCell>
                <TableCell className="text-right font-semibold text-green-500">₹{totalEarnings.toLocaleString()}</TableCell>
                 <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                           <Link href={`/admin/users/edit/${user.id}`}>Edit User</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredReferrerStats.length === 0 && (
            <p className="text-center text-muted-foreground py-16">
              {searchTerm ? 'No referrers found for your search.' : 'No referral data available.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
