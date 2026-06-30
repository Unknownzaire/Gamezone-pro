
'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import { Participant, Tournament, User } from "@/lib/types";
import { useUser } from "@/hooks/use-user.tsx";
import { useMemo } from "react";

const getRank = (participant: Participant) => {
    if (participant.result === 'Winner') return 1;
    if (participant.result?.startsWith('Rank #')) {
      return parseInt(participant.result.replace('Rank #', ''));
    }
    return null;
};

export default function LeaderboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tournaments: allTournaments, allUsers } = useUser();
  const tournamentId = searchParams.get('tournamentId');

  const handleTournamentChange = (value: string) => {
    router.push(`/leaderboard?tournamentId=${value}`);
  };
  
  const usersWithPoints = useMemo(() => {
    return allUsers.map(user => {
        const points = allTournaments.reduce((acc, t) => {
            const p = t.participants.find(part => part.user.id === user.id);
            if (p) {
                if(p.result === 'Winner') return acc + 10;
                if(p.result === 'Participated' || (p.result?.startsWith('Rank #'))) return acc + 1;
            }
            return acc;
        }, 0);
        return { ...user, points };
    }).sort((a,b) => b.points - a.points);
  }, [allUsers, allTournaments]);

  const currentTournament = allTournaments.find((t) => t.id === tournamentId);
  const rankedParticipants = useMemo(() => {
    return currentTournament ? currentTournament.participants.filter((p: Participant) => getRank(p) !== null) : [];
  }, [currentTournament]);

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <h1 className="font-headline text-3xl font-bold">Leaderboard</h1>
         {tournamentId && currentTournament?.winner && (
            <div className="flex items-center gap-2 text-yellow-400">
              <Trophy />
              <span className="font-bold">{currentTournament?.winner?.username}</span>
            </div>
         )}
       </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter by Tournament</CardTitle>
           <Select onValueChange={handleTournamentChange} value={tournamentId || undefined}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a tournament to see results" />
            </SelectTrigger>
            <SelectContent>
              {allTournaments.filter(t => t.status === 'Completed').map(t => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        {tournamentId && (
          <CardContent>
            {rankedParticipants.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankedParticipants.sort((a: Participant, b: Participant) => {
                    const rankA = getRank(a);
                    const rankB = getRank(b);
                    if (rankA === null) return 1;
                    if (rankB === null) return -1;
                    return rankA - rankB;
                  }).map((p: Participant) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold">{getRank(p) ?? 'Unranked'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={p.user.avatarUrl} alt={p.user.username} />
                            <AvatarFallback>{p.user.username.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{p.user.username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{p.result}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">No results available for this tournament yet.</p>
            )}
          </CardContent>
        )}
      </Card>
      
      {!tournamentId && (
        <Card>
          <CardHeader>
            <CardTitle>Overall Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersWithPoints.filter(u => u.points > 0).map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-bold">{index+1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl} alt={user.username} />
                            <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{user.username}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">{user.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {usersWithPoints.filter(u => u.points > 0).length === 0 && (
                <p className="text-muted-foreground text-center py-8">No players have earned points yet.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
