

'use client';

import React, { useState, useEffect, memo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getWinnerSuggestion } from '../actions';
import { Loader2, Sparkles, Trophy } from 'lucide-react';
import { Tournament, User, Participant, PrizeDistribution } from '@/lib/types';
import type { SuggestWinnerFromMatchDataOutput } from '@/ai/flows/suggest-winner-from-match-data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const generateUniqueId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;


// Memoized component for each participant rank item to prevent unnecessary re-renders
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
        <p className="font-semibold">{participant.user.username}</p>
        <p className="text-xs text-muted-foreground">
          {participant.user.bgmiUsername} ({participant.user.bgmiId})
        </p>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-32 justify-start">
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
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestWinnerFromMatchDataOutput | null>(null);
  const [ranks, setRanks] = useState<{[participantId: string]: number | null}>({});
  const { toast } = useToast();

  useEffect(() => {
    // Pre-fill ranks if they already exist on the tournament participants
    const initialRanks: { [participantId: string]: number | null } = {};
    tournament.participants.forEach(p => {
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
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'No file selected', description: 'Please upload a match data file.' });
      return;
    }

    setIsLoading(true);
    setSuggestion(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const matchDataUri = reader.result as string;
      const tournamentRules = `Prize: ${tournament.prizePool}, Commission: ${tournament.commissionPercentage}%. Winner takes all after commission.`;

      const result = await getWinnerSuggestion({ matchDataUri, tournamentRules });
      if (result.success && result.data) {
        setSuggestion(result.data);
      } else {
        toast({ variant: 'destructive', title: 'AI Suggestion Failed', description: result.error });
      }
      setIsLoading(false);
    };
    reader.onerror = () => {
      toast({ variant: 'destructive', title: 'File Read Error', description: 'Could not read the selected file.' });
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
  
  const handleDeclareWinner = () => {
    const winnerRanks = Object.entries(ranks).filter(([, rank]) => rank !== null && rank > 0);
    if(winnerRanks.length === 0){
        toast({variant: 'destructive', title: 'No Ranks Assigned', description: 'Please assign at least one rank.'});
        return;
    }

    let allUsers: User[] = JSON.parse(localStorage.getItem('allUsers') || '[]');
    let allTransactions = JSON.parse(localStorage.getItem('allTransactions') || '[]');

    const prizeDistribution = tournament.prizeDistribution || [
        { rank: '1', percentage: 50 },
        { rank: '2', percentage: 25 },
        { rank: '3', percentage: 15 },
        { rank: '4-10', percentage: 10 },
    ];
    
    const updatedParticipants = tournament.participants.map(p => {
        const rank = ranks[p.id] ?? null;
        let newResult = 'Participated';
        
        if (rank) {
            newResult = rank === 1 ? 'Winner' : `Rank #${rank}`;
            const prizeAmount = getPrizeForRank(rank, tournament.prizePool, prizeDistribution);
            
            if (prizeAmount > 0) {
                 const userIndex = allUsers.findIndex(u => u.id === p.user.id);
                if(userIndex !== -1){
                    allUsers[userIndex].walletBalance += prizeAmount;
                    allTransactions.push({
                        id: generateUniqueId(`tx-prize-${p.user.id}`),
                        userId: p.user.id,
                        amount: prizeAmount,
                        type: 'credit',
                        description: `Prize for Rank #${rank} in "${tournament.title}"`,
                        createdAt: new Date(),
                        status: 'completed'
                    });
                }
            }
        }
        
        return {
            ...p,
            result: newResult
        };
    });

    const updatedTournament: Tournament = {
        ...tournament,
        status: 'Completed',
        participants: updatedParticipants,
        winner: updatedParticipants.find(p => p.result === 'Winner')?.user,
    };
    
    localStorage.setItem('allUsers', JSON.stringify(allUsers));
    localStorage.setItem('allTransactions', JSON.stringify(allTransactions));

    onWinnerDeclare(updatedTournament);
    
    toast({ title: 'Winners Declared!', description: 'Ranks assigned and prizes have been distributed.' });
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
          <CardDescription>Upload match data (screenshot) to get an AI-powered winner suggestion.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="match-data">Match Data File</Label>
            <Input id="match-data" type="file" onChange={handleFileChange} accept="image/*" />
          </div>
          <Button onClick={handleSubmit} disabled={isLoading || !file}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get Suggestion
          </Button>

          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Analyzing match data...</p>
            </div>
          )}

          {suggestion && (
            <Card className="mt-4 bg-muted">
              <CardHeader>
                <CardTitle className="text-lg">Suggestion Result</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p><span className="font-semibold">Suggested Winner:</span> <span className="text-primary">{suggestion.suggestedWinner}</span></p>
                <p><span className="font-semibold">Confidence:</span> {Math.round(suggestion.confidence * 100)}%</p>
                <div>
                  <p className="font-semibold">Explanation:</p>
                  <p className="text-sm text-muted-foreground">{suggestion.explanation}</p>
                </div>
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
          <CardDescription>Manually assign ranks to participants. This will distribute prizes and complete the tournament.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <ScrollArea className="h-72">
                <div className="space-y-3 pr-4">
                    {tournament.participants.map(p => (
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
            <Button className="w-full bg-accent hover:bg-accent/90" onClick={handleDeclareWinner} disabled={tournament.status === 'Completed'}>
                {tournament.status === 'Completed' ? 'Already Completed' : 'Declare Winners & Distribute Prizes'}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
