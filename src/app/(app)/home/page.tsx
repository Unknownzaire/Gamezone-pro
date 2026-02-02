
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const TournamentCard = ({ tournament }: { tournament: Tournament }) => (
    <Link href={`/tournaments/${tournament.id}`}>
        <Card key={tournament.id} className="overflow-hidden hover:bg-muted/50 transition-colors">
            <div className="flex">
                <div className="relative h-32 w-32 flex-shrink-0">
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
    </Link>
);

export default function HomePage() {
  const { user, tournaments, promotionalAds } = useUser();
  
  const getSortValue = (status: string) => {
    if (status === 'Live') return 1;
    if (status === 'Upcoming') return 2;
    if (status === 'Completed') return 3;
    return 4;
  };

  const bgmi = tournaments
    .filter((t) => t.gameName === 'BGMI')
    .sort((a,b) => getSortValue(a.status) - getSortValue(b.status));
    
  const freefire = tournaments
    .filter((t) => t.gameName === 'FREE FIRE')
    .sort((a,b) => getSortValue(a.status) - getSortValue(b.status));

  const cod = tournaments
    .filter((t) => t.gameName === 'COD')
    .sort((a,b) => getSortValue(a.status) - getSortValue(b.status));

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
        <TabsContent value="bgmi" className="mt-4 space-y-4">
            {bgmi.length > 0 ? bgmi.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            )) : <p className="text-muted-foreground text-center py-8">No BGMI tournaments.</p>}
        </TabsContent>
        <TabsContent value="freefire" className="mt-4 space-y-4">
            {freefire.length > 0 ? freefire.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            )) : <p className="text-muted-foreground text-center py-8">No FREE FIRE tournaments.</p>}
        </TabsContent>
        <TabsContent value="cod" className="mt-4 space-y-4">
            {cod.length > 0 ? cod.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            )) : <p className="text-muted-foreground text-center py-8">No COD tournaments.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
