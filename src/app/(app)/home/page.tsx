"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { mockTournaments } from "@/lib/mock-data";
import { Tournament } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, Trophy, Users } from "lucide-react";

export default function HomePage() {
  const { toast } = useToast();
  const upcomingOrLiveTournaments = mockTournaments.filter(
    (t) => t.status === "Upcoming" || t.status === "Live"
  );

  const handleJoin = (tournament: Tournament) => {
    toast({
      title: "Successfully Joined!",
      description: `You have joined the "${tournament.title}" tournament.`,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold">Tournaments</h1>
      <div className="grid grid-cols-1 gap-4">
        {upcomingOrLiveTournaments.map((tournament) => (
          <Card key={tournament.id} className="overflow-hidden">
            <div className="relative h-40 w-full">
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
              <CardTitle className="font-headline">{tournament.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span>Prize Pool: ₹{tournament.prizePool.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>Entry: ₹{tournament.entryFee}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{format(tournament.matchTime, "PPp")}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => handleJoin(tournament)}
              >
                Join Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
