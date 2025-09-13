'use client';

import { notFound, useRouter } from 'next/navigation';
import { mockTournaments } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, ShieldCheck, Trophy, Users, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Tournament } from '@/lib/types';
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
} from "@/components/ui/alert-dialog"


export default function TournamentDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const tournament = mockTournaments.find((t) => t.id === params.id);

  if (!tournament) {
    notFound();
  }
  
  const handleJoin = (tournament: Tournament) => {
    toast({
      title: "Successfully Joined!",
      description: `You have joined the "${tournament.title}" tournament.`,
    });
    router.push('/my-tournaments');
  };

  const terms = [
    "You must have a valid BGMI account.",
    "Entry fee is non-refundable.",
    "Room details will be available 15 minutes before match time.",
    "Cheating will result in a permanent ban.",
    "The organizer's decision is final."
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-headline text-3xl font-bold truncate">{tournament.title}</h1>
      </div>

      <Card className="overflow-hidden">
        <div className="relative h-48 w-full">
            <Image
            src={tournament.imageUrl}
            alt={tournament.title}
            fill
            className="object-cover"
            data-ai-hint={tournament.imageHint}
            />
            <Badge
            variant={tournament.status === "Live" ? "destructive" : "secondary"}
            className="absolute right-2 top-2"
            >
            {tournament.status}
            </Badge>
        </div>
        <CardHeader>
            <CardTitle className="font-headline text-2xl">{tournament.title}</CardTitle>
            <CardDescription>{tournament.gameName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
             <div className="grid grid-cols-2 gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span>Prize: ₹{tournament.prizePool.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Entry: ₹{tournament.entryFee}</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{format(tournament.matchTime, "PPp")}</span>
                </div>
            </div>
            {tournament.status === 'Live' && tournament.roomId && (
                 <Card className="bg-muted p-4">
                    <CardTitle className="text-lg mb-2">Live Match Details</CardTitle>
                    <div className="flex items-center gap-4 text-base">
                      <p>Room ID: <span className="font-mono text-primary">{tournament.roomId}</span></p>
                      <p>Password: <span className="font-mono text-primary">{tournament.roomPassword}</span></p>
                    </div>
                </Card>
            )}
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <ShieldCheck className="text-primary" />
            Terms & Conditions
            </CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                {terms.map((term, i) => <li key={i}>{term}</li>)}
            </ul>
        </CardContent>
      </Card>

      <div className="pt-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg" disabled={tournament.status !== 'Upcoming'}>
              {tournament.status === 'Upcoming' ? `Join Now for ₹${tournament.entryFee}` : `Joining Closed`}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="text-primary" />
                Confirm Your Entry
              </AlertDialogTitle>
              <AlertDialogDescription>
                An entry fee of ₹{tournament.entryFee} will be deducted from your wallet. Are you sure you want to join the "{tournament.title}" tournament? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleJoin(tournament)}>
                Confirm & Join
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

    </div>
  );
}
