'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockParticipants, mockTournaments, mockUsers } from "@/lib/mock-data";
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


export default function LeaderboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get('tournamentId');

  const handleTournamentChange = (value: string) => {
    router.push(`/leaderboard?tournamentId=${value}`);
  };
  
  const allParticipants = mockParticipants;
  const usersWithPoints = mockUsers.map(user => {
      const userParticipants = allParticipants.filter(p => p.user.id === user.id);
      const points = userParticipants.reduce((acc, p) => {
          if(p.result === 'Winner') return acc + 10;
          if(p.result === 'Participated') return acc + 1;
          return acc;
      }, 0);
      return { ...user, points };
  }).sort((a,b) => b.points - a.points);


  const tournamentParticipants = tournamentId ? mockParticipants.filter(p => p.tournamentId === tournamentId) : [];

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <h1 className="font-headline text-3xl font-bold">Leaderboard</h1>
         {tournamentId && mockTournaments.find(t => t.id === tournamentId)?.winner && (
            <div className="flex items-center gap-2 text-yellow-400">
              <Trophy />
              <span className="font-bold">{mockTournaments.find(t => t.id === tournamentId)?.winner?.username}</span>
            </div>
         )}
       </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter by Tournament</CardTitle>
           <Select onValueChange={handleTournamentChange} defaultValue={tournamentId || undefined}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a tournament to see results" />
            </SelectTrigger>
            <SelectContent>
              {mockTournaments.filter(t => t.status === 'Completed').map(t => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        {tournamentId && tournamentParticipants.length > 0 && (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournamentParticipants.sort((a,b) => (a.result === 'Winner' ? -1 : 1)).map((p, index) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold">{index + 1}</TableCell>
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
                {usersWithPoints.map((user, index) => (
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
