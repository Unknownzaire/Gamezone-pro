'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockTournaments as initialMockTournaments } from "@/lib/mock-data";
import { MoreHorizontal, PlusCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Tournament } from "@/lib/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);
  const { toast } = useToast();

   useEffect(() => {
    const loadTournaments = () => {
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
        localStorage.setItem('allTournaments', JSON.stringify(initialMockTournaments));
      }
    };

    loadTournaments();
    // Listen for storage changes to update the list in real-time
    window.addEventListener('storage', loadTournaments);
    return () => {
      window.removeEventListener('storage', loadTournaments);
    };
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
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
        <Link href="/admin/tournaments/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Tournament
          </Button>
        </Link>
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
                <TableHead>Match Time</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments.map((t) => (
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