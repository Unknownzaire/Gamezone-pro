
'use client';

import { notFound, useRouter, useParams } from 'next/navigation';
import { mockTournaments as initialMockTournaments } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, ShieldCheck, Trophy, Users, AlertTriangle, BarChart3, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Tournament, PrizeDistribution } from '@/lib/types';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React from 'react';
import { useUser } from '@/hooks/use-user.tsx';


export default function TournamentDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const { toast } = useToast();
  const { user: currentUser, updateBalance, addTransaction, tournaments, joinTournament } = useUser();

  const tournament = tournaments.find((t) => t.id === id);

  if (!tournament) {
    notFound();
  }
  
  const handleJoin = (tournamentToJoin: Tournament) => {
    if (!currentUser) {
        toast({
            variant: 'destructive',
            title: "Not Logged In",
            description: `Please log in to join a tournament.`,
        });
        return;
    }

    if(currentUser.isBlocked) {
       toast({
            variant: 'destructive',
            title: "Account Blocked",
            description: `Your account is blocked. You cannot join tournaments.`,
        });
        return;
    }
    
    if (tournamentToJoin.participants.length >= 100) {
      toast({
        variant: 'destructive',
        title: "Tournament Full",
        description: "This tournament has reached its maximum capacity.",
      });
      return;
    }

    if (currentUser.walletBalance < tournamentToJoin.entryFee) {
       toast({
        variant: 'destructive',
        title: "Insufficient Balance",
        description: `You need ₹${tournamentToJoin.entryFee} to join. Please add funds to your wallet.`,
      });
      return;
    }

    // This would be a server action in a real app
    const newBalance = currentUser.walletBalance - tournamentToJoin.entryFee;
    updateBalance(newBalance);

    addTransaction({
        amount: tournamentToJoin.entryFee,
        type: 'debit',
        description: `Joined "${tournamentToJoin.title}"`,
        status: 'completed'
    });
    
    joinTournament(tournamentToJoin.id, currentUser);

    toast({
      title: "Successfully Joined!",
      description: `You have joined the "${tournamentToJoin.title}" tournament. ₹${tournamentToJoin.entryFee} has been deducted.`,
    });
  };

  const getPrizeForRankString = (rankString: string, prizePool: number, distribution: PrizeDistribution[]): string => {
        const prize = distribution.find(d => d.rank === rankString);
        if (prize) {
            if (rankString.includes('-')) {
                const [start, end] = rankString.split('-').map(Number);
                const count = end - start + 1;
                const individualPrize = (prizePool * (prize.percentage / 100)) / count;
                return `₹${individualPrize.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (each)`;
            }
            const prizeAmount = prizePool * (prize.percentage / 100);
            return `₹${prizeAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
        }
        return '₹0';
    };

    const prizeDistribution = tournament.prizeDistribution || [
        { rank: '1', percentage: 50 },
        { rank: '2', percentage: 25 },
        { rank: '3', percentage: 15 },
        { rank: '4-10', percentage: 10 },
    ];

  const terms = [
    {
      title: "Eligibility",
      points: [
        "Participants must register with their correct BGMI Username and BGMI ID.",
        "Multiple accounts are not allowed.",
        "Players must be 18 years or older (or have parental consent if under 18).",
      ],
    },
    {
      title: "Registration",
      points: [
        "All players must complete the registration form with valid details.",
        "Entry fees (if applicable) must be paid before the registration deadline.",
        "Once registered, fees are non-refundable, except in case of tournament cancellation by organizers.",
      ],
    },
    {
      title: "Gameplay Rules",
      points: [
        "Players must use the official BGMI app only (no modded APKs, scripts, or cheats).",
        "Teaming, hacking, exploiting, or use of third-party software will result in immediate disqualification.",
        "Players must join the custom room with the correct ID and password provided by organizers.",
      ],
    },
    {
      title: "Match Participation",
      points: [
        "Players should join matches 10 minutes before start time.",
        "No extra time will be provided for late participants.",
        "In case of connection issues, the match will continue, and no rematch will be given.",
      ],
    },
    {
      title: "Prize Distribution",
      points: [
        "Winners will be announced on the app/website after verification.",
        "Prizes will be credited to the player’s wallet/bank/UPI within 7–14 business days.",
        "Any tax or processing charges (if applicable) will be borne by the winner.",
      ],
    },
    {
      title: "Fair Play Policy",
      points: [
        "Use of hacks, mods, emulators, or unfair methods is strictly prohibited.",
        "Any suspicious activity will be reviewed, and the decision of the organizers will be final and binding.",
      ],
    },
    {
      title: "Disqualification",
      points: [
        "Providing false details during registration.",
        "Using inappropriate in-game names, abusive language, or unsportsmanlike behavior.",
        "Violation of any rules mentioned in these terms.",
      ],
    },
    {
      title: "Organizer Rights",
      points: [
        "Organizers reserve the right to modify rules, reschedule matches, or cancel tournaments if necessary.",
        "Decisions made by the organizers regarding disputes will be final.",
      ],
    },
    {
      title: "Liability Disclaimer",
      points: [
        "The tournament is not affiliated with or endorsed by Krafton, BGMI, or PUBG Mobile.",
        "Organizers are not responsible for network issues, technical glitches, or player device problems.",
      ],
    },
    {
      title: "Acceptance",
      points: [
        "By registering and participating, you accept all the above Terms & Conditions.",
      ],
    },
  ];

  const isAlreadyJoined = currentUser ? tournament.participants.some(p => p.user.id === currentUser.id) : false;
  const isFull = tournament.participants.length >= 100;
  const isBlocked = currentUser?.isBlocked;
  
  let joinButtonText = `Join Now for ₹${tournament.entryFee}`;
  if (isAlreadyJoined) joinButtonText = 'Already Joined';
  else if (isFull) joinButtonText = 'Tournament Full';
  else if (tournament.status !== 'Upcoming') joinButtonText = 'Joining Closed';
  else if(isBlocked) joinButtonText = 'Account Blocked';


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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                          View Prizes <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Prize Distribution</DialogTitle>
                          <DialogDescription>
                            Prize pool of ₹{tournament.prizePool.toLocaleString()} will be distributed as follows:
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                          {prizeDistribution.map((item) => (
                            <div key={item.rank} className="flex justify-between items-center rounded-md bg-muted p-2">
                              <p className="font-semibold">Rank #{item.rank}</p>
                              <p className="text-primary font-bold">{getPrizeForRankString(item.rank, tournament.prizePool, prizeDistribution)}</p>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                </div>
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Entry: ₹{tournament.entryFee}</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{format(new Date(tournament.matchTime), "PPp")}</span>
                </div>
                 <div className="flex items-center gap-2 col-span-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Players: {tournament.participants.length} / 100 joined</span>
                     <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                          View Players <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Registered Players ({tournament.participants.length})</DialogTitle>
                          <DialogDescription>
                            The following players have joined this tournament.
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-72">
                            <div className="space-y-3 pr-4">
                            {tournament.participants.map((p) => (
                                <div key={p.id} className="flex items-center gap-3 rounded-md bg-muted p-2">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={p.user.avatarUrl} alt={p.user.username} />
                                    <AvatarFallback>{p.user.username.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold">{p.user.username}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {p.user.bgmiUsername} ({p.user.bgmiId})
                                  </p>
                                </div>
                                </div>
                            ))}
                            </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
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

      {(tournament.status === 'Completed' || tournament.status === 'Live') && (
        <Link href={`/leaderboard?tournamentId=${tournament.id}`}>
          <Button variant="outline" className="w-full">
            <BarChart3 className="mr-2 h-4 w-4" />
            View Leaderboard
          </Button>
        </Link>
      )}
      
       <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <ShieldCheck className="text-primary" />
            BGMI Tournament – Terms & Conditions
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {terms.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="font-semibold text-base mb-2">{`${sectionIndex + 1}. ${section.title}`}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                {section.points.map((point, pointIndex) => (
                  <li key={pointIndex}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="pt-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg" disabled={!currentUser || tournament.status !== 'Upcoming' || isAlreadyJoined || isFull || isBlocked}>
              {joinButtonText}
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
