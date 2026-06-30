'use client';

import { useRouter } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Clock, DollarSign, Trophy, Users, Search, Trash2, MoreHorizontal, UserMinus, Pencil } from "lucide-react";
import Link from "next/link";
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WinnerSuggestion } from './components/WinnerSuggestion';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect, use } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Tournament, Participant, User, Transaction } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

// FIREBASE IMPORTS
import { useFirebase } from '@/firebase';
import { doc, onSnapshot, updateDoc, deleteDoc, Timestamp, runTransaction, collection } from 'firebase/firestore';

export default function ManageTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const router = useRouter();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [liveStreamLink, setLiveStreamLink] = useState('');
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantToRemove, setParticipantToRemove] = useState<Participant | null>(null);
  
  const [isAccountDeleteDialogOpen, setIsAccountDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<User | null>(null);

  const [isEditPrizeDialogOpen, setIsEditPrizeDialogOpen] = useState(false);
  const [newPrizePool, setNewPrizePool] = useState(0);

  useEffect(() => {
    if (!firestore || !id) return;

    const unsub = onSnapshot(doc(firestore, 'tournaments', id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const t = {
          id: snap.id,
          ...data,
          matchTime: data.matchTime instanceof Timestamp ? data.matchTime.toDate() : (data.matchTime ? new Date(data.matchTime) : new Date())
        } as Tournament;
        setTournament(t);
        setRoomId(t.roomId || '');
        setRoomPassword(t.roomPassword || '');
        setLiveStreamLink(t.liveStreamLink || '');
        setNewPrizePool(t.prizePool);
      } else {
        router.push('/admin/tournaments');
      }
    });

    return () => unsub();
  }, [firestore, id, router]);


  if (!tournament) {
    return <div className="p-8 text-center">Loading match details...</div>;
  }
  
  const handleUpdateAndGoLive = async () => {
    if (!roomId || !roomPassword || !firestore) {
      toast({ variant: 'destructive', title: 'Missing Details', description: 'Room ID and Password are required.' });
      return;
    }
    
    try {
      await updateDoc(doc(firestore, 'tournaments', id), {
        status: 'Live',
        roomId,
        roomPassword,
        liveStreamLink
      });
      setIsEditingRoom(false);
      toast({ title: 'Tournament is Live!', description: 'Room details updated.' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    }
  };

  const handleSaveRoomDetails = async () => {
    if (!roomId || !roomPassword || !firestore) {
      toast({ variant: 'destructive', title: 'Missing Details' });
      return;
    }

    try {
      await updateDoc(doc(firestore, 'tournaments', id), {
        roomId,
        roomPassword,
        liveStreamLink
      });
      setIsEditingRoom(false);
      toast({ title: 'Room Details Updated' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error' });
    }
  };

  const handleUpdatePrizePool = async () => {
    if (newPrizePool < 0 || !firestore) return;
    try {
      await updateDoc(doc(firestore, 'tournaments', id), { prizePool: newPrizePool });
      setIsEditPrizeDialogOpen(false);
      toast({ title: 'Prize Pool Updated' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error' });
    }
  };

  const handleCompleteTournament = async () => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'tournaments', id), { status: 'Completed' });
      toast({ title: 'Tournament Completed' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error' });
    }
  };

  const handleDeleteTournament = async () => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'tournaments', id));
      toast({ title: "Tournament Deleted" });
      router.push('/admin/tournaments');
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error' });
    }
  };

  const handleRemoveParticipant = async () => {
    if (!participantToRemove || !tournament || !firestore) return;

    try {
      const userRef = doc(firestore, 'users', participantToRemove.user.id);
      const txRef = doc(collection(firestore, 'users', participantToRemove.user.id, 'transactions'));
      const tournamentRef = doc(firestore, 'tournaments', tournament.id);

      await runTransaction(firestore, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        const tourSnap = await transaction.get(tournamentRef);

        if (!userSnap.exists() || !tourSnap.exists()) throw new Error("Missing document.");

        const userData = userSnap.data() as User;
        const tourData = tourSnap.data() as Tournament;

        const updatedParticipants = (tourData.participants || []).filter(p => p.id !== participantToRemove.id);

        transaction.update(userRef, { walletBalance: (userData.walletBalance || 0) + tournament.entryFee });
        transaction.update(tournamentRef, { participants: updatedParticipants });
        transaction.set(txRef, {
            amount: tournament.entryFee,
            type: 'credit',
            description: `Refund for removal from tournament: ${tournament.title}`,
            createdAt: Timestamp.now(),
            status: 'completed',
            userId: participantToRemove.user.id
        });
      });

      toast({ title: "Participant Removed", description: "User has been refunded." });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Transaction failed.' });
    } finally {
      setParticipantToRemove(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!accountToDelete || !firestore) return;
    try {
      await deleteDoc(doc(firestore, 'users', accountToDelete.id));
      toast({ title: "Account Deleted" });
      setAccountToDelete(null);
      setIsAccountDeleteDialogOpen(false);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error' });
    }
  };

  const statCards = [
    { title: "Status", value: tournament.status, icon: Clock },
    { title: "Prize Pool", value: `₹${tournament.prizePool.toLocaleString()}`, icon: Trophy },
    { title: "Entry Fee", value: `₹${tournament.entryFee.toLocaleString()}`, icon: DollarSign },
    { title: "Participants", value: `${tournament.participants?.length || 0} / ${tournament.slots || 100}`, icon: Users },
  ];

  const filteredParticipants = (tournament.participants || []).filter(p => {
    const searchLower = participantSearch.toLowerCase();
    return p.user.username.toLowerCase().includes(searchLower) || 
           (p.user.email?.toLowerCase().includes(searchLower)) ||
           (p.user.id.toLowerCase().includes(searchLower));
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href="/admin/tournaments">
                <Button variant="outline" size="icon" className="h-7 w-7">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
            </Link>
            <div>
                <h1 className="font-headline text-3xl font-bold">{tournament.title}</h1>
                <p className="text-muted-foreground">Manage match details in real-time.</p>
            </div>
        </div>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Tournament
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the tournament and all its data from Firestore.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteTournament} className="bg-destructive">
                        Delete Permanently
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
            <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <div className="flex items-center gap-2">
                        {stat.title === "Prize Pool" && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 hover:bg-primary/20"
                                onClick={() => setIsEditPrizeDialogOpen(true)}
                            >
                                <Pencil className="h-3 w-3" />
                                <span className="sr-only">Edit Prize Pool</span>
                            </Button>
                        )}
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
            </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Match Controls</CardTitle>
                    <CardDescription>Update room info or manually complete the tournament.</CardDescription>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsEditingRoom(!isEditingRoom)}
                    disabled={tournament.status === 'Completed'}
                >
                    <Pencil className={cn("h-4 w-4", isEditingRoom && "text-primary")} />
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="room-id">Room ID</Label>
                    <Input id="room-id" value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={!isEditingRoom && tournament.status !== 'Upcoming'} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="room-password">Room Password</Label>
                    <Input id="room-password" value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} disabled={!isEditingRoom && tournament.status !== 'Upcoming'} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="live-stream">Live Stream URL (Optional)</Label>
                    <Input id="live-stream" value={liveStreamLink} onChange={(e) => setLiveStreamLink(e.target.value)} placeholder="https://..." disabled={!isEditingRoom && tournament.status === 'Completed'} />
                </div>
                <div className="flex gap-2">
                    <Button onClick={tournament.status === 'Upcoming' ? handleUpdateAndGoLive : handleSaveRoomDetails} disabled={tournament.status === 'Completed' || (tournament.status === 'Live' && !isEditingRoom)} className="w-full">
                        {tournament.status === 'Upcoming' ? 'Update & Go Live' : tournament.status === 'Live' && isEditingRoom ? 'Save Changes' : `Already ${tournament.status}`}
                    </Button>
                    <Button onClick={handleCompleteTournament} variant="destructive" disabled={tournament.status !== 'Live'} className="w-full">
                        Complete Tournament
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                    <CardTitle className="font-headline">Participants</CardTitle>
                    <CardDescription>Real-time list of joined players.</CardDescription>
                </div>
                <div className="relative w-full max-w-[200px]">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search user..." className="pl-8 h-8 text-xs" value={participantSearch} onChange={(e) => setParticipantSearch(e.target.value)} />
                </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Result</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredParticipants.map(p => (
                            <TableRow key={p.id}>
                                <TableCell className="font-medium text-xs">
                                  <p>{p.user.username}</p>
                                  <p className="text-[10px] text-muted-foreground">{p.user.email}</p>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={p.result === 'Winner' ? 'default' : 'outline'} className="text-[10px]">
                                        {p.result ?? 'N/A'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild><Link href={`/admin/users/edit/${p.user.id}`}>Edit Profile</Link></DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive" onClick={() => setParticipantToRemove(p)} disabled={tournament.status === 'Completed'}>
                                                <UserMinus className="mr-2 h-4 w-4" />
                                                Remove & Refund
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
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
      
       <WinnerSuggestion tournament={tournament} onWinnerDeclare={setTournament} />

       <AlertDialog open={!!participantToRemove} onOpenChange={(open) => !open && setParticipantToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Participant?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? User will be refunded <strong>₹{tournament.entryFee}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveParticipant} className="bg-destructive">
              Confirm & Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditPrizeDialogOpen} onOpenChange={setIsEditPrizeDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Prize Pool</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Label htmlFor="new-prize-pool">Prize Pool (₹)</Label>
            <Input id="new-prize-pool" type="number" value={newPrizePool} onChange={(e) => setNewPrizePool(Number(e.target.value))} />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleUpdatePrizePool}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
