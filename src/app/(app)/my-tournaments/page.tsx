
'use client';

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Eye, Trophy, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { useUser } from "@/hooks/use-user.tsx";
import { useEffect, useState } from "react";
import { Tournament, PrizeDistribution } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function MyTournamentsPage() {
  const { user: currentUser, tournaments } = useUser();
  const [joinedTournaments, setJoinedTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    if (currentUser) {
      // Filter tournaments where the current user is a participant
      const userJoinedTournaments = tournaments.filter(tournament => 
        tournament.participants.some(participant => participant.user.id === currentUser.id)
      );
      setJoinedTournaments(userJoinedTournaments);
    }
  }, [currentUser, tournaments]);


  const upcoming = joinedTournaments.filter(t => t.status === 'Upcoming');
  const live = joinedTournaments.filter(t => t.status === 'Live');
  const completed = joinedTournaments.filter(t => t.status === 'Completed');

  const getPrizeForUser = (tournament: Tournament) => {
    if (!currentUser) return 0;

    const participant = tournament.participants.find(p => p.user.id === currentUser.id);
    if (!participant || !participant.result) return 0;
    
    const rankMatch = participant.result.match(/#(\d+)/);
    const rank = participant.result === 'Winner' ? 1 : rankMatch ? parseInt(rankMatch[1]) : null;

    if (rank === null) return 0;
    
    const prizeDistribution = tournament.prizeDistribution || [
        { rank: '1', percentage: 50 },
        { rank: '2', percentage: 25 },
        { rank: '3', percentage: 15 },
        { rank: '4-10', percentage: 10 },
    ];

    for (const dist of prizeDistribution) {
        if (dist.rank.includes('-')) {
            const [start, end] = dist.rank.split('-').map(Number);
            if (rank >= start && rank <= end) {
                const winnerCountInRange = tournament.participants.filter(p => {
                    const pRankMatch = p.result?.match(/#(\d+)/);
                    const pRank = p.result === 'Winner' ? 1 : pRankMatch ? parseInt(pRankMatch[1]) : null;
                    return pRank !== null && pRank >= start && pRank <= end;
                }).length;
                
                const totalPrizeForRange = tournament.prizePool * (dist.percentage / 100);
                return winnerCountInRange > 0 ? totalPrizeForRange / winnerCountInRange : 0;
            }
        } else if (rank === parseInt(dist.rank, 10)) {
            return tournament.prizePool * (dist.percentage / 100);
        }
    }
    
    return 0;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold">My Tournaments</h1>
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4 space-y-4">
          {upcoming.length > 0 ? (
            upcoming.map((t) => (
              <Card key={t.id}>
                <CardHeader>
                  <CardTitle className="font-headline flex justify-between items-center">
                    {t.title}
                    <Badge variant='secondary'>{t.status}</Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 pt-2">
                     <Clock className="h-4 w-4" />
                     {format(new Date(t.matchTime), "PPp")}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">No upcoming tournaments.</p>
          )}
        </TabsContent>
         <TabsContent value="live" className="mt-4 space-y-4">
          {live.length > 0 ? (
            live.map((t) => (
              <Card key={t.id}>
                <CardHeader>
                  <CardTitle className="font-headline flex justify-between items-center">
                    {t.title}
                    <Badge variant='destructive'>{t.status}</Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 pt-2">
                     <Clock className="h-4 w-4" />
                     {format(new Date(t.matchTime), "PPp")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="font-semibold">Room Details:</p>
                    <div className="flex items-center gap-2 text-sm">
                      <p>ID: <span className="font-mono text-primary">{t.roomId}</span></p>
                      <p>Pass: <span className="font-mono text-primary">{t.roomPassword}</span></p>
                    </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">No live tournaments.</p>
          )}
        </TabsContent>
        <TabsContent value="completed" className="mt-4 space-y-4">
          {completed.length > 0 ? (
             completed.map((t) => (
              <Card key={t.id}>
                <CardHeader>
                  <CardTitle className="font-headline">{t.title}</CardTitle>
                   <CardDescription className="flex items-center gap-2 pt-2">
                     <Clock className="h-4 w-4" />
                     {format(new Date(t.matchTime), "PP")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                   <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <p>Result: <span className="font-semibold text-primary">{t.participants.find(p => p.user.id === currentUser?.id)?.result || 'N/A'}</span></p>
                   </div>
                   <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                     <p>Prize: ₹{getPrizeForUser(t).toLocaleString()}</p>
                   </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/leaderboard?tournamentId=${t.id}`} className="w-full">
                    <Button variant="secondary" className="w-full">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Results
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
             ))
          ) : (
            <p className="text-muted-foreground text-center py-8">No completed tournaments.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
