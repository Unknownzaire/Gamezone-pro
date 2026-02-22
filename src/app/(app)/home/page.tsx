
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tournament } from "@/lib/types";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, Trophy, Users, PlayCircle, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/hooks/use-user.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useState, useEffect } from "react";

const TournamentCard = ({ tournament }: { tournament: Tournament }) => (
    <Card key={tournament.id} className="overflow-hidden group relative aspect-video flex flex-col justify-end text-white">
        {/* Clickable Link Overlay */}
        <Link href={`/tournaments/${tournament.id}`} className="absolute inset-0 z-20">
            <span className="sr-only">View tournament details</span>
        </Link>
        
        {/* Background Image */}
        <Image
            src={tournament.imageUrl}
            alt={tournament.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={tournament.imageHint}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />

        {/* Content */}
        <div className="relative z-20 p-3 space-y-2">
             <h3 className="font-headline text-base font-bold truncate">{tournament.title}</h3>
            
             <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-white/90">
                <div className="flex items-center gap-1.5">
                    <Trophy className="h-3 w-3" />
                    <span>Prize: ₹{tournament.prizePool.toLocaleString()}</span>
                </div>
                 <div className="flex items-center gap-1.5">
                    <Users className="h-3 w-3" />
                    <span>Entry: ₹{tournament.entryFee}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {tournament.matchType === 'Solo' ? <UserIcon className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                    <span>{tournament.matchType}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span className='truncate'>{format(new Date(tournament.matchTime), "P p")}</span>
                </div>
            </div>

            <div>
                {tournament.status === 'Live' && tournament.liveStreamLink ? (
                    <Button 
                        size="sm" 
                        variant="secondary" 
                        className="w-full bg-red-600 hover:bg-red-700 text-white border-none h-7 text-[10px] relative z-30"
                        asChild
                    >
                        <a 
                            href={tournament.liveStreamLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <PlayCircle className="mr-1 h-3 w-3" />
                            Watch Live
                        </a>
                    </Button>
                ) : tournament.status !== 'Completed' && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-white/90">
                            <span>{tournament.participants.length} / 100 joined</span>
                        </div>
                        <Progress value={tournament.participants.length} className="h-1 bg-white/20" />
                    </div>
                )}
            </div>
        </div>
        {/* Status Badge */}
        <Badge
            variant={tournament.status === "Live" ? "destructive" : tournament.status === 'Completed' ? 'secondary' : 'default'}
            className="absolute right-2 top-2 z-30 text-[10px] px-1.5 py-0.5"
        >
            {tournament.status}
        </Badge>
    </Card>
);

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
            <TabsContent value="upcoming" className="mt-4 grid grid-cols-2 gap-4">
                {upcoming.length > 0 ? upcoming.map((t) => (
                    <TournamentCard key={t.id} tournament={t} />
                )) : <p className="text-muted-foreground text-center py-8 col-span-2">No upcoming {gameName} tournaments.</p>}
            </TabsContent>
            <TabsContent value="live" className="mt-4 grid grid-cols-2 gap-4">
                {live.length > 0 ? live.map((t) => (
                    <TournamentCard key={t.id} tournament={t} />
                )) : <p className="text-muted-foreground text-center py-8 col-span-2">No live {gameName} tournaments.</p>}
            </TabsContent>
            <TabsContent value="completed" className="mt-4 grid grid-cols-2 gap-4">
                {completed.length > 0 ? completed.map((t) => (
                    <TournamentCard key={t.id} tournament={t} />
                )) : <p className="text-muted-foreground text-center py-8 col-span-2">No completed {gameName} tournaments.</p>}
            </TabsContent>
        </Tabs>
    );
};

export default function HomePage() {
  const { user, tournaments, promotionalAds } = useUser();
  const [gameList, setGameList] = useState(['BGMI', 'FREE FIRE', 'COD']);
  const activeAds = promotionalAds.filter(ad => ad.status === 'active');
  
  useEffect(() => {
    const loadGames = () => {
        const storedGames = localStorage.getItem('gameList');
        const defaultGames = ['BGMI', 'FREE FIRE', 'COD'];
        let gamesToShow: string[] = [];

        if (storedGames) {
            gamesToShow = JSON.parse(storedGames);
        } else {
            gamesToShow = defaultGames;
        }

        const otherFiltered = gamesToShow.filter(g => g.toUpperCase() !== 'OTHER');
        setGameList(otherFiltered);
    };
    
    loadGames();
    window.addEventListener('storage', loadGames);
    return () => window.removeEventListener('storage', loadGames);
  }, []);

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

      {gameList.length > 0 && (
        <Tabs defaultValue={gameList[0].toLowerCase().replace(/ /g, '')} className="w-full">
            <TabsList className="grid w-full" style={{gridTemplateColumns: `repeat(${gameList.length}, minmax(0, 1fr))`}}>
                {gameList.map(game => (
                    <TabsTrigger key={game} value={game.toLowerCase().replace(/ /g, '')}>{game.toUpperCase()}</TabsTrigger>
                ))}
            </TabsList>
            {gameList.map(game => (
                <TabsContent key={game} value={game.toLowerCase().replace(/ /g, '')} className="mt-4">
                    <GameContent gameName={game} tournaments={tournaments} />
                </TabsContent>
            ))}
        </Tabs>
      )}
    </div>
  );
}
