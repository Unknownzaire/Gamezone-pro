
'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockTournaments as initialMockTournaments } from "@/lib/mock-data";
import { MoreHorizontal, PlusCircle, ArrowLeft, Search, Clock, Trophy, Swords } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import type { Tournament } from "@/lib/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);
  const [gameFilter, setGameFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [gameList, setGameList] = useState<string[]>([]);
  const { toast } = useToast();

  const loadData = useCallback(() => {
    try {
      const storedTournaments = localStorage.getItem('allTournaments');
      if (storedTournaments) {
        setTournaments(JSON.parse(storedTournaments).map((t: any) => ({...t, matchTime: new Date(t.matchTime)})));
      } else {
        setTournaments(initialMockTournaments);
        localStorage.setItem('allTournaments', JSON.stringify(initialMockTournaments));
      }
    } catch (error) {
      console.error("Failed to parse tournaments from localStorage", error);
      setTournaments(initialMockTournaments);
    }

    const storedGames = localStorage.getItem('gameList');
    if (storedGames) {
        setGameList(JSON.parse(storedGames));
    } else {
        const defaultGames = ['BGMI', 'FREE FIRE', 'COD'];
        setGameList(defaultGames);
        localStorage.setItem('gameList', JSON.stringify(defaultGames));
    }
  }, []);

   useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
    };
  }, [loadData]);

  const handleDeleteTournament = () => {
    if (!tournamentToDelete) return;

    const updatedTournaments = tournaments.filter(t => t.id !== tournamentToDelete.id);
    setTournaments(updatedTournaments);
    localStorage.setItem('allTournaments', JSON.stringify(updatedTournaments));

    toast({
        title: "Tournament Deleted",
        description: `The tournament "${tournamentToDelete.title}" has been successfully deleted.`,
    });

    setTournamentToDelete(null);
  };

  const filteredTournaments = tournaments.filter(t => {
    const matchesGame = gameFilter === 'ALL' || t.gameName.toUpperCase() === gameFilter.toUpperCase();
    const matchesStatus = statusFilter === 'ALL' || t.status.toUpperCase() === statusFilter.toUpperCase();
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGame && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
         <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="hidden md:block">
              <Button variant="outline" size="icon" className="h-7 w-7">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
              </Button>
          </Link>
          <div>
            <h1 className="font-headline text-3xl font-bold">Tournaments</h1>
            <p className="text-muted-foreground">Manage all tournaments in the system.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
                <Button 
                    variant={statusFilter === 'ALL' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setStatusFilter('ALL')}
                >
                    All
                </Button>
                <Button 
                    variant={statusFilter === 'Upcoming' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setStatusFilter(statusFilter === 'Upcoming' ? 'ALL' : 'Upcoming')}
                >
                    Upcoming
                </Button>
                <Button 
                    variant={statusFilter === 'Live' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setStatusFilter(statusFilter === 'Live' ? 'ALL' : 'Live')}
                >
                    Live
                </Button>
                <Button 
                    variant={statusFilter === 'Completed' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setStatusFilter(statusFilter === 'Completed' ? 'ALL' : 'Completed')}
                >
                    Completed
                </Button>
            </div>

          <Select value={gameFilter} onValueChange={setGameFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by Game" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Games</SelectItem>
              {gameList.filter(g => g.toUpperCase() !== 'OTHER').map(game => (
                <SelectItem key={game} value={game.toUpperCase()}>{game}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search tournaments..."
                    className="pl-9 h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

          <Link href="/admin/tournaments/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Tournament
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Tournaments</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{tournaments.filter(t => t.status === 'Upcoming').length}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Live Tournaments</CardTitle>
                <Swords className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{tournaments.filter(t => t.status === 'Live').length}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Tournaments</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{tournaments.filter(t => t.status === 'Completed').length}</div>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Game</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prize Pool</TableHead>
                <TableHead>Entry Fee</TableHead>
                <TableHead>Limit</TableHead>
                <TableHead>Match Time</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTournaments.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-bold">
                      {t.gameName}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Image 
                      src={t.imageUrl} 
                      alt={t.title} 
                      width={80} 
                      height={45} 
                      className="rounded-md object-cover"
                      data-ai-hint={t.imageHint}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        t.status === 'Live' ? 'destructive' :
                        t.status === 'Completed' ? 'secondary' :
                        'outline'
                      }
                    >{t.status}</Badge>
                  </TableCell>
                  <TableCell>₹{t.prizePool.toLocaleString()}</TableCell>
                  <TableCell>₹{t.entryFee.toLocaleString()}</TableCell>
                  <TableCell>{t.slots}</TableCell>
                  <TableCell>{format(new Date(t.matchTime), "PPp")}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <Link href={`/admin/tournaments/${t.id}`}><DropdownMenuItem>Manage</DropdownMenuItem></Link>
                        <Link href={`/admin/tournaments/edit/${t.id}`}><DropdownMenuItem>Edit</DropdownMenuItem></Link>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-500" onClick={() => setTournamentToDelete(t)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredTournaments.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No {gameFilter !== 'ALL' ? gameFilter : ''} tournaments found.
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!tournamentToDelete} onOpenChange={(open) => !open && setTournamentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tournament "{tournamentToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTournament} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
