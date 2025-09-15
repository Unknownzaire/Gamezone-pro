
'use client';

import { useParams, notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User, Tournament, Participant, Transaction } from '@/lib/types';
import { mockTournaments, mockUsers, mockTransactions } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

type UserMatchHistory = {
  tournament: Tournament;
  participant: Participant;
};

export default function UserHistoryPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [user, setUser] = useState<User | null>(null);
  const [matchHistory, setMatchHistory] = useState<UserMatchHistory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const storedUsers = localStorage.getItem('allUsers');
    const allUsers: User[] = storedUsers ? JSON.parse(storedUsers) : mockUsers;
    
    const foundUser = allUsers.find(u => u.id === userId);
    
    if (foundUser) {
      setUser(foundUser);
      
      const history: UserMatchHistory[] = [];
      mockTournaments.forEach(tournament => {
        const participantRecord = tournament.participants.find(p => p.user.id === userId);
        if (participantRecord) {
          history.push({ tournament, participant: participantRecord });
        }
      });
      setMatchHistory(history.sort((a,b) => new Date(b.tournament.matchTime).getTime() - new Date(a.tournament.matchTime).getTime()));

      const storedTransactions = localStorage.getItem('allTransactions');
      const allTransactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions).map((t: any) => ({...t, createdAt: new Date(t.createdAt)})) : mockTransactions;
      setTransactions(allTransactions.filter(tx => tx.userId === userId));

    }
    
    setLoading(false);
  }, [userId]);

  if (loading) {
    return <div>Loading...</div>; // Or a skeleton loader
  }

  if (!user) {
    notFound();
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
          <h1 className="font-headline text-3xl font-bold">User History</h1>
          <p className="text-muted-foreground">Viewing history for {user.username}</p>
        </div>
      </div>
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatarUrl} alt={user.username} />
                        <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle>{user.username}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="matches" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="matches">Match History</TabsTrigger>
                        <TabsTrigger value="transactions">Transaction History</TabsTrigger>
                    </TabsList>
                    <TabsContent value="matches" className="mt-4">
                        {matchHistory.length > 0 ? (
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Tournament</TableHead>
                                <TableHead>Result</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {matchHistory.map(({ tournament, participant }) => (
                                <TableRow key={tournament.id}>
                                <TableCell className="font-medium">{tournament.title}</TableCell>
                                <TableCell>
                                    <Badge variant={participant.result === 'Winner' ? 'default' : 'outline'}>
                                    {participant.result ?? 'Participated'}
                                    </Badge>
                                </TableCell>
                                <TableCell>{format(new Date(tournament.matchTime), 'PP')}</TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/admin/tournaments/edit/${tournament.id}`}>
                                        <Button variant="ghost" size="icon">
                                            <Edit className="h-4 w-4" />
                                            <span className="sr-only">Edit Tournament</span>
                                        </Button>
                                    </Link>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                        ) : (
                        <p className="text-center text-muted-foreground p-4">This user has not participated in any tournaments yet.</p>
                        )}
                    </TabsContent>
                    <TabsContent value="transactions" className="mt-4">
                       {transactions.length > 0 ? (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {transactions.map(tx => (
                                    <TableRow key={tx.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-muted rounded-full">
                                                  {tx.type === 'credit' ? (
                                                      <ArrowDownLeft className="h-4 w-4 text-green-500" />
                                                  ) : (
                                                      <ArrowUpRight className="h-4 w-4 text-red-500" />
                                                  )}
                                                </div>
                                                <span className="font-medium">{tx.description}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{format(new Date(tx.createdAt), 'PPp')}</TableCell>
                                        <TableCell>
                                            <Badge variant={tx.status === 'pending' ? 'outline' : tx.status === 'declined' ? 'destructive' : 'default'} className="capitalize">
                                                {tx.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={`text-right font-bold ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                                            {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                       ) : (
                         <p className="text-center text-muted-foreground p-4">This user has no transactions yet.</p>
                       )}
                    </TabsContent>
                </Tabs>

            </CardContent>
        </Card>

    </div>
  );
}
