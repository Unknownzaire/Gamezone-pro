
'use client';

import { useParams, notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User, Tournament, Participant } from '@/lib/types';
import { mockTournaments, mockUsers } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type UserMatchHistory = {
  tournament: Tournament;
  participant: Participant;
};

export default function UserMatchHistoryPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [user, setUser] = useState<User | null>(null);
  const [matchHistory, setMatchHistory] = useState<UserMatchHistory[]>([]);
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
          <h1 className="font-headline text-3xl font-bold">Match History</h1>
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
            </CardContent>
        </Card>

    </div>
  );
}
