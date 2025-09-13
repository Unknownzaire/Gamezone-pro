'use server';

import { suggestWinnerFromMatchData } from '@/ai/flows/suggest-winner-from-match-data';
import { z } from 'zod';

const ActionInputSchema = z.object({
  matchDataUri: z.string(),
  tournamentRules: z.string(),
});

export async function getWinnerSuggestion(input: z.infer<typeof ActionInputSchema>) {
  try {
    const validatedInput = ActionInputSchema.parse(input);
    const result = await suggestWinnerFromMatchData(validatedInput);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting winner suggestion:", error);
    if (error instanceof z.ZodError) {
        return { success: false, error: "Invalid input." };
    }
    return { success: false, error: "An unexpected error occurred." };
  }
}
