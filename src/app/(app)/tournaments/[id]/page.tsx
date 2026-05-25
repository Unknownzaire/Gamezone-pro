
'use client';

import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, ShieldCheck, Trophy, Users, AlertTriangle, BarChart3, ChevronRight, PlayCircle, User as UserIcon, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Tournament, PrizeDistribution, User } from '@/lib/types';
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
import React, { useEffect, useState } from 'react';
import { useUser } from '@/hooks/use-user.tsx';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';


export default function TournamentDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser, tournaments, joinTournament, allUsers } = useUser();
  const [isJoining, setIsJoining] = useState(false);
  const [tournament, setTournament] = useState<Tournament | undefined>(undefined);
  const [selectedTeammates, setSelectedTeammates] = useState<string[]>([]);

  useEffect(() => {
    const currentTournament = tournaments.find((t) => t.id === id);
    setTournament(currentTournament);
  }, [id, tournaments]);

  const teammates = allUsers.filter(u => u.teamName === currentUser?.teamName && u.id !== currentUser?.id);
  const requiredTeammates = tournament?.matchType === 'Duo' ? 1 : tournament?.matchType === 'Squad' ? 3 : 0;

  const handleTeammateSelect = (teammateId: string) => {
    setSelectedTeammates(prev => {
        if (prev.includes(teammateId)) {
            return prev.filter(id => id !== teammateId);
        } else {
            if (prev.length < requiredTeammates) {
                return [...prev, teammateId];
            }
            return prev;
        }
    });
  };

  if (!tournament) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-48 rounded-md" />
        </div>
        <Card className="overflow-hidden">
          <Skeleton className="h-48 w-full" />
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const handleJoin = async () => {
    if (!currentUser || !tournament) return;

    setIsJoining(true);

    const playersToJoin: User[] = [currentUser];
    if (requiredTeammates > 0) {
        selectedTeammates.forEach(teammateId => {
            const teammate = allUsers.find(u => u.id === teammateId);
            if (teammate) {
                playersToJoin.push(teammate);
            }
        });
    }

    try {
      const result = joinTournament(tournament.id, playersToJoin);

      if (result === 'success') {
        toast({
          title: "Successfully Joined!",
          description: `You and your team have joined the "${tournament.title}" tournament.`,
        });
        setSelectedTeammates([]);
      } else if (typeof result === 'object' && result.error) {
          toast({
              variant: 'destructive',
              title: `Join Failed: ${result.user.username}`,
              description: result.error,
          });
      } else if (result === 'tournament_full') {
          toast({
              variant: 'destructive',
              title: "Tournament Full",
              description: "There isn't enough space for your team in this tournament.",
          });
      } else {
         toast({
            variant: 'destructive',
            title: "Failed to Join",
            description: "An unexpected error occurred. Please try again.",
         });
      }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: "Error",
            description: error.message || "An unexpected error occurred.",
        });
    } finally {
        setIsJoining(false);
    }
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
        `Participants must register with their correct ${tournament.gameName} Username and ID.`,
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
        `Players must use the official ${tournament.gameName} app only (no modded APKs, scripts, or cheats).`,
        "Teaming, hacking, exploiting, or use of third-party software will result in immediate disqualification.",
        "Players must join the custom room with the correct ID and password provided by organizers.",
        "Player ID must be level 32 or higher in game.",
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

  const slots = tournament.slots || 100;
  const isFull = tournament.participants.length >= slots;
  const isBlocked = currentUser?.isBlocked;
  const isGameMismatch = currentUser && currentUser.primaryGame !== tournament.gameName;
  const isTeamCorrectlySelected = requiredTeammates === 0 || selectedTeammates.length === requiredTeammates;
  const isParticipant = tournament.participants.some(p => p.user.id === currentUser?.id);
  
  const canJoin = currentUser && tournament.status === 'Upcoming' && !isFull && !isBlocked && !isJoining && !isGameMismatch && !isParticipant;

  let joinButtonText = `Join Now for ₹${tournament.entryFee}`;
  if (isJoining) joinButtonText = 'Joining...';
  else if (isParticipant) joinButtonText = 'Already Joined';
  else if (isFull) joinButtonText = 'Tournament Full';
  else if (tournament.status !== 'Upcoming') joinButtonText = 'Joining Closed';
  else if (isBlocked) joinButtonText = 'Account Blocked';
  else if (isGameMismatch) joinButtonText = `Join only ${tournament.gameName.toLowerCase()} player`;


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
                <div className="flex items-center gap-2">
                    {tournament.matchType === 'Solo' ? <UserIcon className="h-4 w-4 text-primary" /> : <Users className="h-4 w-4 text-primary" />}
                    <span>{tournament.matchType}</span>
                </div>
                 <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Players: {tournament.participants.length} / {slots} joined</span>
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
                            {tournament.participants.length > 0 ? tournament.participants.map((p, index) => (
                                <div key={`${p.id}-${index}`} className="flex items-center gap-3 rounded-md bg-muted p-2">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={p.user.avatarUrl} alt={p.user.username} />
                                    <AvatarFallback>{p.user.username.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold">{p.user.username}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {p.user.gameProfiles?.[tournament.gameName]?.inGameUsername || 'N/A'} ({p.user.gameProfiles?.[tournament.gameName]?.inGameId || 'N/A'})
                                  </p>
                                </div>
                                </div>
                            )) : <p className="text-muted-foreground text-center py-8">No players have joined yet.</p>}
                            </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{format(new Date(tournament.matchTime), "PPp")}</span>
                </div>
            </div>
            
            {tournament.status === 'Live' && (
              <div className="space-y-3">
                {tournament.liveStreamLink && (
                  <a href={tournament.liveStreamLink} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="secondary" className="w-full bg-red-600 hover:bg-red-700 text-white border-none">
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Watch Live Stream
                    </Button>
                  </a>
                )}
              </div>
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
            {tournament.gameName} Tournament – Terms &amp; Conditions
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
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg" disabled={!canJoin}>
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
                An entry fee of ₹{tournament.entryFee} will be deducted from your wallet for each player. Are you sure you want to join? This action cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            
            {requiredTeammates > 0 && (
                <div className="space-y-4 py-2">
                    <h4 className="font-semibold">Select Your Team</h4>
                    <p className="text-sm text-muted-foreground">
                        You need to select {requiredTeammates} teammate{requiredTeammates > 1 ? 's' : ''} to join this {tournament.matchType} tournament.
                    </p>
                    <div className="space-y-2">
                        {teammates.length > 0 ? teammates.map(teammate => (
                            <div key={teammate.id} className="flex items-center justify-between space-x-2 rounded-md border p-3 has-[:disabled]:opacity-50">
                                <div className="flex-1">
                                    <p className="font-medium">{teammate.username}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Balance: ₹{teammate.walletBalance.toFixed(2)}
                                    </p>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant={selectedTeammates.includes(teammate.id) ? "default" : "outline"}
                                    onClick={() => handleTeammateSelect(teammate.id)}
                                    disabled={!selectedTeammates.includes(teammate.id) && selectedTeammates.length >= requiredTeammates}
                                >
                                    {selectedTeammates.includes(teammate.id) ? "Selected" : "Select"}
                                </Button>
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No team members found. Create or join a team in your profile.</p>
                        )}
                    </div>
                </div>
            )}

            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleJoin} disabled={!isTeamCorrectlySelected}>
                Confirm &amp; Join
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
      </div>

    </div>
  );
}
