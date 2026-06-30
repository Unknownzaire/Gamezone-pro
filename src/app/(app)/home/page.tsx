
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tournament } from "@/lib/types";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, Trophy, Users, User as UserIcon, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/hooks/use-user.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const TournamentCard = ({ tournament }: { tournament: Tournament }) => {
    const slots = tournament.slots || 100;
    const participantCount = tournament.participants?.length || 0;
    const progress = (participantCount / slots) * 100;

    return (
        <Card key={tournament.id} className="overflow-hidden group relative flex flex-row h-32 border-primary/10 bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <Link href={`/tournaments/${tournament.id}`} className="absolute inset-0 z-20">
                <span className="sr-only">View tournament details</span>
            </Link>
            
            <div className="relative w-1/3 h-full overflow-hidden shrink-0 border-r border-white/5">
                <Image
                    src={tournament.imageUrl}
                    alt={tournament.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    data-ai-hint={tournament.imageHint}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-transparent to-transparent" />
                
                <Badge
                    variant={tournament.status === "Live" ? "destructive" : tournament.status === 'Completed' ? 'secondary' : 'default'}
                    className="absolute left-1 top-1 z-30 font-bold shadow-md px-1.5 py-0.5 text-[8px]"
                >
                    {tournament.status}
                </Badge>
            </div>

            <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-2 overflow-hidden">
                <div className="space-y-1">
                    <h3 className="font-headline text-sm font-bold leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                        {tournament.title}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-lg border border-white/5">
                            <Trophy className="h-3 w-3 text-yellow-500" />
                            <div className="flex flex-col">
                                <span className="text-[8px] text-muted-foreground uppercase font-medium leading-none">Prize</span>
                                <span className="text-[10px] font-bold text-foreground">₹{tournament.prizePool.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-lg border border-white/5">
                            <Users className="h-3 w-3 text-primary" />
                            <div className="flex flex-col">
                                <span className="text-[8px] text-muted-foreground uppercase font-medium leading-none">Entry</span>
                                <span className="text-[10px] font-bold text-foreground">₹{tournament.entryFee}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                        {tournament.matchType === 'Solo' ? <UserIcon className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                        <span>{tournament.matchType}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(tournament.matchTime), "p")}</span>
                    </div>
                </div>

                <div className="pt-1">
                    {tournament.status === 'Live' ? (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            WATCH LIVE NOW
                        </div>
                    ) : tournament.status !== 'Completed' ? (
                        <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-bold">
                                <span className="text-muted-foreground uppercase">Spots Left</span>
                                <span className="text-primary">{slots - participantCount} / {slots}</span>
                            </div>
                            <Progress value={progress} className="h-1 bg-muted" />
                        </div>
                    ) : (
                        <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground">
                            <span>TOURNAMENT ENDED</span>
                            <ChevronRight className="h-3 w-3" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const GameContent = ({gameName, tournaments}: {gameName: string, tournaments: Tournament[]}) => {
    const gameTournaments = tournaments.filter(t => t.gameName.toUpperCase() === gameName.toUpperCase());
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
            <TabsContent value="upcoming" className="mt-4 grid grid-cols-1 gap-4">
                {upcoming.length > 0 ? upcoming.map((t) => (
                    <TournamentCard key={t.id} tournament={t} />
                )) : <p className="text-muted-foreground text-center py-8">No upcoming {gameName} tournaments.</p>}
            </TabsContent>
            <TabsContent value="live" className="mt-4 grid grid-cols-1 gap-4">
                {live.length > 0 ? live.map((t) => (
                    <TournamentCard key={t.id} tournament={t} />
                )) : <p className="text-muted-foreground text-center py-8">No live {gameName} tournaments.</p>}
            </TabsContent>
            <TabsContent value="completed" className="mt-4 grid grid-cols-1 gap-4">
                {completed.length > 0 ? completed.map((t) => (
                    <TournamentCard key={t.id} tournament={t} />
                )) : <p className="text-muted-foreground text-center py-8">No completed {gameName} tournaments.</p>}
            </TabsContent>
        </Tabs>
    );
};

export default function HomePage() {
  const { tournaments, promotionalAds, gameList } = useUser();
  const activeAds = promotionalAds.filter(ad => ad.status === 'active');
  const normalizedGameList = gameList.filter(g => g.toUpperCase() !== 'OTHER');

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
                        <Card className="overflow-hidden hover:bg-muted/50 transition-colors border-none shadow-none bg-transparent">
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/5">
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

      {normalizedGameList.length > 0 && (
        <Tabs defaultValue={normalizedGameList[0].toLowerCase().replace(/ /g, '')} className="w-full">
            <TabsList className="grid w-full mb-6" style={{gridTemplateColumns: `repeat(${normalizedGameList.length}, minmax(0, 1fr))`}}>
                {normalizedGameList.map(game => (
                    <TabsTrigger key={game} value={game.toLowerCase().replace(/ /g, '')}>{game.toUpperCase()}</TabsTrigger>
                ))}
            </TabsList>
            {normalizedGameList.map(game => (
                <TabsContent key={game} value={game.toLowerCase().replace(/ /g, '')} className="mt-0">
                    <GameContent gameName={game} tournaments={tournaments} />
                </TabsContent>
            ))}
        </Tabs>
      )}
    </div>
  );
}
