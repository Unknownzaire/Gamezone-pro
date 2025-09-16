
'use client';

import { mockUsers, mockTournaments as initialMockTournaments } from '@/lib/mock-data';
import { notFound, useParams } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Clock, DollarSign, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WinnerSuggestion } from './components/WinnerSuggestion';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Tournament } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';


export default function ManageTournamentPage() {
  const { toast } = useToast();
  const { id } = useParams() as { id: string };
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournament, setTournament] = useState<Tournament | undefined>(undefined);

  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  
  useEffect(() => {
    const storedTournaments = localStorage.getItem('allTournaments');
    const allTournaments: Tournament[] = storedTournaments ? JSON.parse(storedTournaments).map((t: any) => ({...t, matchTime: new Date(t.matchTime)})) : initialMockTournaments;
    setTournaments(allTournaments);
    
    const currentTournament = allTournaments.find(t => t.id === id);
    setTournament(currentTournament);

    if (currentTournament) {
        setRoomId(currentTournament.roomId || '');
        setRoomPassword(currentTournament.roomPassword || '');
    } else {
        notFound();
    }
  }, [id]);


  if (!tournament) {
    return <div>Loading...</div>; // Or notFound() if you prefer
  }

  const updateAndSaveTournaments = (updatedTournaments: Tournament[]) => {
      setTournaments(updatedTournaments);
      localStorage.setItem('allTournaments', JSON.stringify(updatedTournaments));
  }
  
  const handleUpdateAndGoLive = () => {
    if (!roomId || !roomPassword) {
      toast({
        variant: 'destructive',
        title: 'Missing Details',
        description: 'Please provide both a Room ID and a Password.',
      });
      return;
    }
    
    const updatedTournaments = tournaments.map(t => 
        t.id === tournament.id 
          ? { ...t, status: 'Live' as const, roomId, roomPassword } 
          : t
      );
    
    updateAndSaveTournaments(updatedTournaments);
    setTournament(updatedTournaments.find(t => t.id === id));


    toast({
      title: 'Tournament is Live!',
      description: 'Room details have been updated and status is set to Live.',
    });
  };
  
  const handleWinnerDeclaration = (updatedTournament: Tournament) => {
    const updatedTournaments = tournaments.map(t => t.id === updatedTournament.id ? updatedTournament : t);
    updateAndSaveTournaments(updatedTournaments);
    setTournament(updatedTournament);
  };

  const statCards = [
    { title: "Status", value: tournament.status, icon: Clock },
    { title: "Prize Pool", value: `₹${tournament.prizePool.toLocaleString()}`, icon: Trophy },
    { title: "Entry Fee", value: `₹${tournament.entryFee}`, icon: DollarSign },
    { title: "Participants", value: `${tournament.participants.length} / 100`, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tournaments">
            <Button variant="outline" size="icon" className="h-7 w-7">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
        </Link>
        <div>
            <h1 className="font-headline text-3xl font-bold">{tournament.title}</h1>
            <p className="text-muted-foreground">Manage details for this tournament.</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
            <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
            </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Room Details</CardTitle>
                <CardDescription>Update match room info. This will set the tournament status to 'Live'.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="room-id">Room ID</Label>
                    <Input id="room-id" value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={tournament.status !== 'Upcoming'} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="room-password">Room Password</Label>
                    <Input id="room-password" value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} disabled={tournament.status !== 'Upcoming'}/>
                </div>
                <Button onClick={handleUpdateAndGoLive} disabled={tournament.status !== 'Upcoming'}>
                    {tournament.status === 'Upcoming' ? 'Update & Go Live' : `Already ${tournament.status}`}
                </Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Participants</CardTitle>
                 <CardDescription>List of all players who joined this tournament.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>BGMI ID</TableHead>
                            <TableHead>Result</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tournament.participants.map(p => (
                            <TableRow key={p.id}>
                                <TableCell>{p.user.username}</TableCell>
                                <TableCell>{p.user.bgmiId}</TableCell>
                                <TableCell>
                                    <Badge variant={p.result === 'Winner' ? 'default' : 'outline'}>
                                        {p.result ?? 'N/A'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
        </Card>
      </div>

       <Separator />
      
       <WinnerSuggestion tournament={tournament} onWinnerDeclare={handleWinnerDeclaration} />

    </div>
  );
}
