
'use client';

import { mockUsers, mockTournaments as initialMockTournaments } from '@/lib/mock-data';
import { useRouter, useParams } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Clock, DollarSign, Trophy, Users, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WinnerSuggestion } from './components/WinnerSuggestion';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Tournament, Participant, User, Transaction } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function ManageTournamentPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournament, setTournament] = useState<Tournament | undefined>(undefined);

  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [liveStreamLink, setLiveStreamLink] = useState('');
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantToRemove, setParticipantToRemove] = useState<Participant | null>(null);
  
  useEffect(() => {
    let allTournaments: Tournament[];
    try {
        const storedTournaments = localStorage.getItem('allTournaments');
        allTournaments = storedTournaments ? JSON.parse(storedTournaments).map((t: any) => ({...t, matchTime: new Date(t.matchTime)})) : initialMockTournaments;
    } catch (error) {
        console.error("Failed to parse tournaments from localStorage", error);
        allTournaments = initialMockTournaments;
        localStorage.setItem('allTournaments', JSON.stringify(initialMockTournaments));
    }
    setTournaments(allTournaments);
    
    const currentTournament = allTournaments.find(t => t.id === id);
    setTournament(currentTournament);

    if (currentTournament) {
        setRoomId(currentTournament.roomId || '');
        setRoomPassword(currentTournament.roomPassword || '');
        setLiveStreamLink(currentTournament.liveStreamLink || '');
    } else {
        router.push('/admin/tournaments');
    }
  }, [id, router]);


  if (!tournament) {
    return <div>Loading...</div>; // Or a skeleton loader
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
          ? { ...t, status: 'Live' as const, roomId, roomPassword, liveStreamLink } 
          : t
      );
    
    updateAndSaveTournaments(updatedTournaments);
    setTournament(updatedTournaments.find(t => t.id === id));


    toast({
      title: 'Tournament is Live!',
      description: 'Room details have been updated and status is set to Live.',
    });
  };

  const handleCompleteTournament = () => {
     const updatedTournaments = tournaments.map(t => 
        t.id === tournament.id 
          ? { ...t, status: 'Completed' as const } 
          : t
      );
    
    updateAndSaveTournaments(updatedTournaments);
    setTournament(updatedTournaments.find(t => t.id === id));

    toast({
      title: 'Tournament Completed',
      description: 'The tournament status has been manually set to Completed.',
    });
  };
  
  const handleWinnerDeclaration = (updatedTournament: Tournament) => {
    const updatedTournaments = tournaments.map(t => t.id === updatedTournament.id ? updatedTournament : t);
    updateAndSaveTournaments(updatedTournaments);
    setTournament(updatedTournament);
  };

  const handleRemoveParticipant = () => {
    if (!participantToRemove || !tournament) return;

    let allUsers: User[] = JSON.parse(localStorage.getItem('allUsers') || '[]');
    let allTransactions: Transaction[] = JSON.parse(localStorage.getItem('allTransactions') || '[]');
    let allTournaments: Tournament[] = JSON.parse(localStorage.getItem('allTournaments') || '[]');

    // 1. Refund the user
    const userIndex = allUsers.findIndex(u => u.id === participantToRemove.user.id);
    if (userIndex !== -1) {
        allUsers[userIndex].walletBalance += tournament.entryFee;
        
        // 2. Add refund transaction
        const refundTx: Transaction = {
            id: `tx-refund-${Date.now()}`,
            userId: participantToRemove.user.id,
            amount: tournament.entryFee,
            type: 'credit',
            description: `Refund for removal from tournament: ${tournament.title}`,
            createdAt: new Date(),
            status: 'completed',
        };
        allTransactions.unshift(refundTx);
    }

    // 3. Remove from tournament
    const updatedTournaments = allTournaments.map(t => {
        if (t.id === tournament.id) {
            return {
                ...t,
                participants: t.participants.filter(p => p.id !== participantToRemove.id)
            };
        }
        return t;
    });

    localStorage.setItem('allUsers', JSON.stringify(allUsers));
    localStorage.setItem('allTransactions', JSON.stringify(allTransactions));
    localStorage.setItem('allTournaments', JSON.stringify(updatedTournaments));

    setTournaments(updatedTournaments);
    setTournament(updatedTournaments.find(t => t.id === tournament.id));
    
    toast({
        title: "Participant Removed",
        description: `${participantToRemove.user.username} has been removed and refunded ₹${tournament.entryFee}.`,
    });
    
    setParticipantToRemove(null);
  };

  const statCards = [
    { title: "Status", value: tournament.status, icon: Clock },
    { title: "Prize Pool", value: `₹${tournament.prizePool.toLocaleString()}`, icon: Trophy },
    { title: "Entry Fee", value: `₹${tournament.entryFee.toLocaleString()}`, icon: DollarSign },
    { title: "Participants", value: `${tournament.participants.length} / 100`, icon: Users },
  ];

  const filteredParticipants = tournament.participants.filter(p => {
    const searchLower = participantSearch.toLowerCase();
    return p.user.username.toLowerCase().includes(searchLower) || 
           (p.user.inGameUsername && p.user.inGameUsername.toLowerCase().includes(searchLower)) ||
           (p.user.inGameId && p.user.inGameId.toLowerCase().includes(searchLower));
  });

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
                <CardTitle className="font-headline">Match Controls</CardTitle>
                <CardDescription>Update room info or manually complete the tournament.</CardDescription>
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
                <div className="space-y-2">
                    <Label htmlFor="live-stream">Live Stream URL (Optional)</Label>
                    <Input id="live-stream" value={liveStreamLink} onChange={(e) => setLiveStreamLink(e.target.value)} placeholder="https://..." disabled={tournament.status === 'Completed'} />
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleUpdateAndGoLive} disabled={tournament.status !== 'Upcoming'} className="w-full">
                        {tournament.status === 'Upcoming' ? 'Update & Go Live' : `Already ${tournament.status}`}
                    </Button>
                    <Button onClick={handleCompleteTournament} variant="destructive" disabled={tournament.status !== 'Live'} className="w-full">
                        Complete Tournament
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1.5">
                    <CardTitle className="font-headline">Participants</CardTitle>
                    <CardDescription>List of all players who joined this tournament.</CardDescription>
                </div>
                <div className="relative w-full max-w-[200px]">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search user..." 
                        className="pl-8 h-8 text-xs" 
                        value={participantSearch}
                        onChange={(e) => setParticipantSearch(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>App Username</TableHead>
                            <TableHead>Game Username</TableHead>
                            <TableHead>Game ID</TableHead>
                            <TableHead>Result</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredParticipants.map(p => (
                            <TableRow key={p.id}>
                                <TableCell>{p.user.username}</TableCell>
                                <TableCell>{p.user.inGameUsername || 'N/A'}</TableCell>
                                <TableCell>{p.user.inGameId || 'N/A'}</TableCell>
                                <TableCell>
                                    <Badge variant={p.result === 'Winner' ? 'default' : 'outline'}>
                                        {p.result ?? 'N/A'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-destructive h-8 w-8"
                                        onClick={() => setParticipantToRemove(p)}
                                        disabled={tournament.status === 'Completed'}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Remove participant</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {filteredParticipants.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No matching participants found.</p>
                )}
              </ScrollArea>
            </CardContent>
        </Card>
      </div>

       <Separator />
      
       <WinnerSuggestion tournament={tournament} onWinnerDeclare={handleWinnerDeclaration} />

       <AlertDialog open={!!participantToRemove} onOpenChange={(open) => !open && setParticipantToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Participant?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{participantToRemove?.user.username}</strong> from this tournament?
              <br /><br />
              The entry fee of <strong>₹{tournament.entryFee}</strong> will be refunded to their wallet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveParticipant} className="bg-destructive hover:bg-destructive/90">
              Confirm & Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
