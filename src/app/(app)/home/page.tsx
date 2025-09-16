
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tournament } from "@/lib/types";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/hooks/use-user.tsx";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export default function HomePage() {
  const { tournaments, promotionalAds } = useUser();
  const upcomingOrLiveTournaments = tournaments.filter(
    (t) => t.status === "Upcoming" || t.status === "Live"
  );
  
  const activeAds = promotionalAds.filter(ad => ad.status === 'active');

  return (
    <div className="space-y-6">
        {activeAds.length > 0 && (
          <Carousel 
            plugins={[Autoplay({ delay: 5000 })]}
            opts={{ loop: true }}
            className="w-full -mx-4"
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
          </Carousel>
      )}
      <h1 className="font-headline text-3xl font-bold">Tournaments</h1>

      <div className="grid grid-cols-1 gap-4">
        {upcomingOrLiveTournaments.map((tournament) => (
          <Card key={tournament.id} className="overflow-hidden">
            <div className="relative h-40 w-full">
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
                <span>{format(new Date(tournament.matchTime), "PPp")}</span>
              </div>
               <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Players Joined</span>
                      <span>{tournament.participants.length} / 100</span>
                  </div>
                  <Progress value={tournament.participants.length} />
              </div>
            </CardContent>
            <CardFooter>
                <Link href={`/tournaments/${tournament.id}`} className="w-full">
                    <Button
                        className="w-full"
                    >
                        View Details
                    </Button>
                </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
