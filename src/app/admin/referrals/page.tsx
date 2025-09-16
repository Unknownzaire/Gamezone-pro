
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockUsers as initialUsers, mockTransactions, mockTournaments } from "@/lib/mock-data";
import { ArrowLeft, RefreshCw, Search } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { User, Transaction, Tournament } from "@/lib/types";
import Link from "next/link";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

interface ReferrerStats {
  user: User;
  totalReferrals: number;
  totalEarnings: number;
}

export default function AdminReferralsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [referrerStats, setReferrerStats] = useState<ReferrerStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const loadData = useCallback(() => {
    let allUsers: User[] = [];
    let allTransactions: Transaction[] = [];
    let allTournaments: Tournament[] = [];

    try {
        const storedUsers = localStorage.getItem('allUsers');
        allUsers = storedUsers ? JSON.parse(storedUsers).map((u: any) => ({...u, createdAt: u.createdAt ? new Date(u.createdAt) : new Date() })) : initialUsers;

        const storedTransactions = localStorage.getItem('allTransactions');
        allTransactions = storedTransactions ? JSON.parse(storedTransactions).map((t: any) => ({...t, createdAt: new Date(t.createdAt) })) : mockTransactions;
        
        const storedTournaments = localStorage.getItem('allTournaments');
        allTournaments = storedTournaments ? JSON.parse(storedTournaments).map((t: any) => ({...t, matchTime: new Date(t.matchTime) })) : mockTournaments;

    } catch (e) {
        console.error("Failed to load data from localStorage", e);
    }
    
    setUsers(allUsers);
    setTransactions(allTransactions);
    setTournaments(allTournaments);

    // Calculate referrer stats for all users
    const stats: ReferrerStats[] = allUsers.map(user => {
        let totalReferrals = 0;
        let totalEarnings = 0;

        const referredUsers = allUsers.filter(u => u.referredBy === user.id || u.referredBy === user.bgmiId);
        totalReferrals = referredUsers.length;
        
        const hasUserJoinedTournament = (userId: string): boolean => {
            return allTournaments.some(t => t.participants.some(p => p.user.id === userId));
        };
        
        referredUsers.forEach(referredUser => {
            if(hasUserJoinedTournament(referredUser.id)){
                totalEarnings += 25;
            }
        });

        return { user, totalReferrals, totalEarnings };
    });

    const sortedStats = stats.sort((a,b) => b.totalReferrals - a.totalReferrals);
    setReferrerStats(sortedStats);

  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    return () => {
      window.removeEventListener('focus', loadData);
    };
  }, [loadData]);
  
  const filteredReferrerStats = referrerStats.filter(stat => 
    stat.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stat.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (stat.user.bgmiUsername && stat.user.bgmiUsername.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        <Button variant="outline" size="icon" onClick={() => loadData()}>
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh referrals</span>
        </Button>
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
