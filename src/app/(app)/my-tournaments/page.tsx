import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockParticipants, mockTournaments } from "@/lib/mock-data";
import { Clock, Eye, Trophy } from "lucide-react";
import { format } from "date-fns";

export default function MyTournamentsPage() {
  // We look at the mockParticipants array to see which tournaments the user has joined.
  const currentUser = 'user-1'; // Assuming current user is user-1
  const joinedTournamentIds = [...new Set(mockParticipants.filter(p => p.user.id === currentUser).map(p => p.tournamentId))];
  const joinedTournaments = mockTournaments.filter(t => joinedTournamentIds.includes(t.id));

  const upcomingLive = joinedTournaments.filter(t => t.status !== 'Completed');
  const completed = joinedTournaments.filter(t => t.status === 'Completed');

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold">My Tournaments</h1>
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming/Live</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4 space-y-4">
          {upcomingLive.length > 0 ? (
            upcomingLive.map((t) => (
              <Card key={t.id}>
                <CardHeader>
                  <CardTitle className="font-headline flex justify-between items-center">
                    {t.title}
                    <Badge variant={t.status === 'Live' ? 'destructive' : 'secondary'}>{t.status}</Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 pt-2">
                     <Clock className="h-4 w-4" />
                     {format(new Date(t.matchTime), "PPp")}
                  </CardDescription>
                </CardHeader>
                {t.status === 'Live' && (
                  <CardContent className="space-y-2">
                    <p className="font-semibold">Room Details:</p>
                    <div className="flex items-center gap-2 text-sm">
                      <p>ID: <span className="font-mono text-primary">{t.roomId}</span></p>
                      <p>Pass: <span className="font-mono text-primary">{t.roomPassword}</span></p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">No upcoming or live tournaments.</p>
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
                    <p>Result: <span className="font-semibold text-primary">{t.participants.find(p => p.user.id === 'user-3')?.result}</span></p>
                   </div>
                   <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <p>Prize: ₹{t.prizePool * (1 - t.commissionPercentage/100)}</p>
                   </div>
                </CardContent>
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
