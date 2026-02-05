
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tournament } from "@/lib/types";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, Trophy, Users, PlayCircle } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/hooks/use-user.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const TournamentCard = ({ tournament }: { tournament: Tournament }) => (
    <Card key={tournament.id} className="overflow-hidden hover:bg-muted/50 transition-colors relative">
        <div className="flex">
            {/* Main card link overlay */}
            <Link href={`/tournaments/${tournament.id}`} className="absolute inset-0 z-0">
                <span className="sr-only">tap to open</span>
            </Link>
            
            <div className="relative h-32 w-32 flex-shrink-0 z-10 pointer-events-none">
                <Image
                    src={tournament.imageUrl}
                    alt={tournament.title}
                    fill
                    className="object-cover"
                    data-ai-hint={tournament.imageHint}
                />
                <Badge
                    variant={tournament.status === "Live" ? "destructive" : tournament.status === 'Completed' ? 'secondary' : 'default'}
                    className="absolute right-1 top-1"
                >
                    {tournament.status}
                </Badge>
            </div>
            <div className="flex-1 p-4 flex flex-col justify-between z-10">
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
                
                <div className="mt-auto">
                    {tournament.status === 'Live' && tournament.liveStreamLink ? (
                        <Button 
                            size="sm" 
                            variant="secondary" 
                            className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white border-none h-8 text-xs relative z-20"
                            asChild
                        >
                            <a 
                                href={tournament.liveStreamLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()} // Extra precaution
                            >
                                <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
                                Watch Live
                            </a>
                        </Button>
                    ) : tournament.status !== 'Completed' && (
                        <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{tournament.participants.length} / 100</span>
                            </div>
                            <Progress value={tournament.participants.length} className="h-2" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    </Card>
);

const GameContent = ({gameName, tournaments}: {gameName: string, tournaments: Tournament[]}) => {
    const gameTournaments = tournaments.filter(t => t.gameName === gameName);
    const upcoming = gameTournaments.filter(t => t.status === 'Upcoming');
    const live = gameTournaments.filter(t => t.status === 'Live');
    const completed = gameTournaments.filter(t => t.status === 'Completed');

    if (gameTournaments.length === 0) {
        return <p className="text-muted-foreground text-center py-8">No {gameName} tournaments.</p>;
    }

    return (
        <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="live">Live</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="mt-4 space-y-4">
                {upcoming.length > 0 ? upcoming.map((t) => (
                    <TournamentCard key={t.id} tournament={t} />
                )) : <p className="text-muted-foreground text-center py-8">No upcoming {gameName} tournaments.</p>}
            </TabsContent>
            <TabsContent value="live" className="mt-4 space-y-4">
                {live.length > 0 ? live.map((t) => (
                    <TournamentCard key={t.id} tournament={t} />
                )) : <p className="text-muted-foreground text-center py-8">No live {gameName} tournaments.</p>}
            </TabsContent>
            <TabsContent value="completed" className="mt-4 space-y-4">
                {completed.length > 0 ? completed.map((t) => (
                    <TournamentCard key={t.id} tournament={t} />
                )) : <p className="text-muted-foreground text-center py-8">No completed {gameName} tournaments.</p>}
            </TabsContent>
        </Tabs>
    );
};

export default function HomePage() {
  const { user, tournaments, promotionalAds } = useUser();
  const activeAds = promotionalAds.filter(ad => ad.status === 'active');

  return (
    <div className="space-y-6">
      {activeAds.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-headline text-2xl font-bold">Promotions</h2>
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 5000,
                  stopOnInteraction: true,
                }),
              ]}
              className="w-full group"
            >
              <CarouselContent>
                {activeAds.map((ad) => (
                  <CarouselItem key={ad.id}>
                    <Link href={ad.link}>
                        <Card className="overflow-hidden hover:bg-muted/50 transition-colors">
                            <div className="relative aspect-video w-full">
                                <Image
                                    src={ad.imageUrl}
                                    alt={ad.title}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                <h3 className="absolute bottom-4 left-4 text-white font-bold text-xl font-headline">{ad.title}</h3>
                            </div>
                       </Card>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-black/40 text-white hover:bg-black/60 border-none opacity-0 group-hover:opacity-100 transition-opacity" />
              <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-black/40 text-white hover:bg-black/60 border-none opacity-0 group-hover:opacity-100 transition-opacity" />
            </Carousel>
          </div>
      )}
      <h1 className="font-headline text-3xl font-bold">Tournaments</h1>

      <Tabs defaultValue="bgmi" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bgmi">BGMI</TabsTrigger>
          <TabsTrigger value="freefire">FREE FIRE</TabsTrigger>
          <TabsTrigger value="cod">COD</TabsTrigger>
        </TabsList>
        <TabsContent value="bgmi" className="mt-4">
            <GameContent gameName="BGMI" tournaments={tournaments} />
        </TabsContent>
        <TabsContent value="freefire" className="mt-4">
            <GameContent gameName="FREE FIRE" tournaments={tournaments} />
        </TabsContent>
        <TabsContent value="cod" className="mt-4">
            <GameContent gameName="COD" tournaments={tournaments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
