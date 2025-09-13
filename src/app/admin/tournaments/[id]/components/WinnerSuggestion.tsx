'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getWinnerSuggestion } from '../actions';
import { Loader2, Sparkles, Trophy } from 'lucide-react';
import { Tournament } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SuggestWinnerFromMatchDataOutput } from '@/ai/flows/suggest-winner-from-match-data';

export function WinnerSuggestion({ tournament }: { tournament: Tournament }) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestWinnerFromMatchDataOutput | null>(null);
  const { toast } = useToast();

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
  
  const handleDeclareWinner = () => {
     toast({ title: 'Winner Declared!', description: 'Prizes have been distributed.' });
  }

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
            Declare Winner
          </CardTitle>
          <CardDescription>Manually select a winner and distribute the prizes. Use the AI suggestion for guidance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label>Select Winner</Label>
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="Choose a participant" />
                    </SelectTrigger>
                    <SelectContent>
                        {tournament.participants.map(p => (
                            <SelectItem key={p.id} value={p.user.username}>{p.user.username}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button className="w-full bg-accent hover:bg-accent/90" onClick={handleDeclareWinner}>Declare Winner & Distribute Prize</Button>
        </CardContent>
      </Card>
    </div>
  );
}
