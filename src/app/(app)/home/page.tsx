
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tournament } from "@/lib/types";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/hooks/use-user.tsx";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TournamentCard = ({ tournament }: { tournament: Tournament }) => (
    <Card key={tournament.id} className="overflow-hidden">
        <div className="flex">
            <div className="relative h-32 w-32 flex-shrink-0">
                <Link href={`/tournaments/${tournament.id}`}>
                    <Image
                        src={tournament.imageUrl}
                        alt={tournament.title}
                        fill
                        className="object-cover"
                        data-ai-hint={tournament.imageHint}
                    />
                </Link>
                <Badge
                    variant={tournament.status === "Live" ? "destructive" : tournament.status === 'Completed' ? 'secondary' : 'default'}
                    className="absolute right-1 top-1"
                >
                    {tournament.status}
                </Badge>
            </div>
            <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                    <h3 className="font-headline font-semibold">{tournament.title}</h3>
                    <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-3 w-3 text-primary" />
                            <span>Prize: ₹{tournament.prizePool.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-3 w-3 text-primary" />
                            <span>Entry: ₹{tournament.entryFee}</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-primary" />
                            <span>{format(new Date(tournament.matchTime), "PPp")}</span>
                        </div>
                    </div>
                </div>
                 {tournament.status !== 'Completed' && (
                    <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{tournament.participants.length} / 100</span>
                        </div>
                        <Progress value={tournament.participants.length} className="h-2" />
                    </div>
                )}
            </div>
        </div>
    </Card>
);

export default function HomePage() {
  const { user, tournaments, promotionalAds } = useUser();
  const upcoming = tournaments.filter((t) => t.status === "Upcoming");
  const live = tournaments.filter((t) => t.status === "Live");
  const completed = tournaments.filter((t) => t.status === "Completed");

  const activeAds = promotionalAds.filter(ad => ad.status === 'active');

  return (
    <div className="space-y-6">
        {activeAds.length > 0 && (
          <Carousel 
            plugins={[Autoplay({ delay: 5000 })]}
            opts={{ loop: true }}
            className="w-full -mx-4 relative"
          >
            <CarouselContent>
              {activeAds.map((ad) => (
                <CarouselItem key={ad.id}>
                    <Link href={ad.link}>
                        <div className="relative aspect-video w-full overflow-hidden">
                            <Image
                                src={ad.imageUrl}
                                alt={ad.title}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                            <h3 className="absolute bottom-4 left-4 text-white font-bold text-xl font-headline">{ad.title}</h3>
                        </div>
                   </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
             <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/30 border-none hover:bg-black/50 text-white" />
             <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/30 border-none hover:bg-black/50 text-white" />
          </Carousel>
      )}
      <h1 className="font-headline text-3xl font-bold">Tournaments</h1>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4 space-y-4">
            {upcoming.length > 0 ? upcoming.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            )) : <p className="text-muted-foreground text-center py-8">No upcoming tournaments.</p>}
        </TabsContent>
        <TabsContent value="live" className="mt-4 space-y-4">
            {live.length > 0 ? live.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            )) : <p className="text-muted-foreground text-center py-8">No live tournaments.</p>}
        </TabsContent>
        <TabsContent value="completed" className="mt-4 space-y-4">
            {completed.length > 0 ? completed.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            )) : <p className="text-muted-foreground text-center py-8">No completed tournaments.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
