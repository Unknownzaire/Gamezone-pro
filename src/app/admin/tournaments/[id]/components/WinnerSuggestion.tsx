'use client';

import React, { useState, useEffect, memo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getWinnerSuggestion } from '../actions';
import { Loader2, Sparkles, Trophy } from 'lucide-react';
import { Tournament, Participant, PrizeDistribution } from '@/lib/types';
import type { SuggestWinnerFromMatchDataOutput } from '@/ai/flows/suggest-winner-from-match-data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// FIREBASE IMPORTS
import { useFirebase } from '@/firebase';
import { doc, runTransaction, Timestamp, collection } from 'firebase/firestore';

const ParticipantRankItem = memo(({
  participant,
  rank,
  usedRanks,
  onRankChange
}: {
  participant: Participant;
  rank: number | null;
  usedRanks: number[];
  onRankChange: (participantId: string, rank: string) => void;
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const handleRankSelect = (newRank: number) => {
    onRankChange(participant.id, newRank.toString());
    setIsDialogOpen(false);
  };
  
  const handleUnrank = () => {
    onRankChange(participant.id, '0');
    setIsDialogOpen(false);
  }

  return (
    <div className="flex items-center justify-between gap-4">
       <div className="flex-1 truncate">
        <p className="font-semibold text-sm">{participant.user.username}</p>
        <p className="text-[10px] text-muted-foreground">{participant.user.email}</p>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-32 justify-start text-xs h-8">
              {rank ? `Rank #${rank}` : 'Unranked'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
             <DialogHeader>
                <DialogTitle>Set Rank for {participant.user.username}</DialogTitle>
            </DialogHeader>
            <div className="py-2">
                <ScrollArea className="h-72">
                    <div className="grid grid-cols-5 gap-2 pr-4">
                        {Array.from({length: 100}, (_, i) => i + 1).map(rankNum => (
                            <Button
                                key={rankNum}
                                variant={rank === rankNum ? 'default' : 'outline'}
                                disabled={usedRanks.includes(rankNum) && rank !== rankNum}
                                onClick={() => handleRankSelect(rankNum)}
                            >
                                #{rankNum}
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </div>
            {rank !== null && (
                <Button variant="destructive" onClick={handleUnrank}>Remove Rank</Button>
            )}
          </DialogContent>
      </Dialog>
    </div>
  );
});
ParticipantRankItem.displayName = 'ParticipantRankItem';


export function WinnerSuggestion({ tournament, onWinnerDeclare }: { tournament: Tournament, onWinnerDeclare: (updatedTournament: Tournament) => void }) {
  const { firestore } = useFirebase();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestWinnerFromMatchDataOutput | null>(null);
  const [ranks, setRanks] = useState<{[participantId: string]: number | null}>({});
  const { toast } = useToast();

  useEffect(() => {
    const initialRanks: { [participantId: string]: number | null } = {};
    (tournament.participants || []).forEach(p => {
        if (p.result && p.result.startsWith('Rank #')) {
            initialRanks[p.id] = parseInt(p.result.replace('Rank #', ''), 10);
        } else if (p.result === 'Winner') {
            initialRanks[p.id] = 1;
        } else {
            initialRanks[p.id] = null;
        }
    });
    setRanks(initialRanks);
  }, [tournament]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsLoading(true);
    setSuggestion(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const matchDataUri = reader.result as string;
      const tournamentRules = `Prize: ${tournament.prizePool}, Commission: ${tournament.commissionPercentage}%.`;
      const result = await getWinnerSuggestion({ matchDataUri, tournamentRules });
      if (result.success && result.data) setSuggestion(result.data);
      else toast({ variant: 'destructive', title: 'AI Failed', description: result.error });
      setIsLoading(false);
    };
    reader.onerror = () => {
      toast({ variant: 'destructive', title: 'File Error' });
      setIsLoading(false);
    };
  };

  const handleRankChange = useCallback((participantId: string, rank: string) => {
    setRanks(prev => ({...prev, [participantId]: rank === "0" || rank === "" ? null : parseInt(rank, 10)}));
  }, []);

  const getPrizeForRank = (rank: number, prizePool: number, prizeDistribution: PrizeDistribution[]): number => {
    for (const dist of prizeDistribution) {
        if (dist.rank.includes('-')) {
            const [start, end] = dist.rank.split('-').map(Number);
            if (rank >= start && rank <= end) {
                const winnerCountInRange = Object.values(ranks).filter(r => r && r >= start && r <= end).length;
                const totalPrizeForRange = prizePool * (dist.percentage / 100);
                return winnerCountInRange > 0 ? totalPrizeForRange / winnerCountInRange : 0;
            }
        } else if (rank === parseInt(dist.rank, 10)) {
            return prizePool * (dist.percentage / 100);
        }
    }
    return 0;
  };
  
  const handleDeclareWinner = async () => {
    const winnerRanks = Object.entries(ranks).filter(([, rank]) => rank !== null && rank > 0);
    if(winnerRanks.length === 0 || !firestore) return;

    setIsLoading(true);
    try {
        const prizeDistribution = tournament.prizeDistribution || [
            { rank: '1', percentage: 50 },
            { rank: '2', percentage: 25 },
            { rank: '3', percentage: 15 },
            { rank: '4-10', percentage: 10 },
        ];

        await runTransaction(firestore, async (transaction) => {
            const tournamentRef = doc(firestore, 'tournaments', tournament.id);
            const updatedParticipants = (tournament.participants || []).map(p => {
                const rank = ranks[p.id] ?? null;
                const newResult = rank ? (rank === 1 ? 'Winner' : `Rank #${rank}`) : 'Participated';
                
                if (rank) {
                    const prizeAmount = getPrizeForRank(rank, tournament.prizePool, prizeDistribution);
                    if (prizeAmount > 0) {
                        const userRef = doc(firestore, 'users', p.user.id);
                        const txRef = doc(collection(firestore, 'users', p.user.id, 'transactions'));
                        
                        // We must get user to update balance accurately
                        // Note: In real app we might need to await these within the loop carefully
                        // but since transaction.get returns a promise we can't easily map it here.
                        // Transaction strategy: we'll update the user balances individually.
                    }
                }
                return { ...p, result: newResult };
            });

            // Updating user balances and adding prize transactions inside the transaction
            for (const p of (tournament.participants || [])) {
                const rank = ranks[p.id] ?? null;
                if (rank) {
                    const prizeAmount = getPrizeForRank(rank, tournament.prizePool, prizeDistribution);
                    if (prizeAmount > 0) {
                        const userRef = doc(firestore, 'users', p.user.id);
                        const userSnap = await transaction.get(userRef);
                        if (userSnap.exists()) {
                            const newBal = (userSnap.data().walletBalance || 0) + prizeAmount;
                            transaction.update(userRef, { walletBalance: newBal });
                            const txRef = doc(collection(firestore, 'users', p.user.id, 'transactions'));
                            transaction.set(txRef, {
                                userId: p.user.id,
                                amount: prizeAmount,
                                type: 'credit',
                                description: `Prize for Rank #${rank} in "${tournament.title}"`,
                                createdAt: Timestamp.now(),
                                status: 'completed'
                            });
                        }
                    }
                }
            }

            transaction.update(tournamentRef, {
                status: 'Completed',
                participants: updatedParticipants,
                winner: updatedParticipants.find(p => p.result === 'Winner')?.user || null
            });
        });

        toast({ title: 'Winners Declared!', description: 'Prizes distributed via Firestore.' });
    } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to declare winners.' });
    } finally {
        setIsLoading(false);
    }
  }

  const usedRanks = Object.values(ranks).filter(rank => rank !== null) as number[];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Sparkles className="text-primary" />
            AI Winner Suggestion
          </CardTitle>
          <CardDescription>Upload match data for analysis.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input id="match-data" type="file" onChange={handleFileChange} accept="image/*" />
          <Button onClick={handleSubmit} disabled={isLoading || !file}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get Suggestion
          </Button>
          {suggestion && (
            <Card className="mt-4 bg-muted">
              <CardContent className="p-4 text-xs space-y-2">
                <p><strong>Winner:</strong> {suggestion.suggestedWinner}</p>
                <p><strong>Confidence:</strong> {Math.round(suggestion.confidence * 100)}%</p>
                <p><strong>Reason:</strong> {suggestion.explanation}</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Trophy className="text-primary" />
            Declare Winners
          </CardTitle>
          <CardDescription>Finalize match and distribute prize money.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <ScrollArea className="h-72">
                <div className="space-y-3 pr-4">
                    {tournament.participants?.map(p => (
                       <ParticipantRankItem 
                            key={p.id}
                            participant={p}
                            rank={ranks[p.id] ?? null}
                            usedRanks={usedRanks}
                            onRankChange={handleRankChange}
                       />
                    ))}
                </div>
            </ScrollArea>
            <Button className="w-full bg-accent hover:bg-accent/90" onClick={handleDeclareWinner} disabled={tournament.status === 'Completed' || isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {tournament.status === 'Completed' ? 'Already Completed' : 'Declare Winners & Distribute'}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
