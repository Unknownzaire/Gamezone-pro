'use server';
/**
 * @fileOverview An AI agent that suggests a potential winner based on uploaded match data.
 *
 * - suggestWinnerFromMatchData - A function that handles the winner suggestion process.
 * - SuggestWinnerFromMatchDataInput - The input type for the suggestWinnerFromMatchData function.
 * - SuggestWinnerFromMatchDataOutput - The return type for the suggestWinnerFromMatchData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestWinnerFromMatchDataInputSchema = z.object({
  matchDataUri: z
    .string()
    .describe(
      "Match data, such as screenshots or replay files, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  tournamentRules: z
    .string()
    .describe('The rules of the tournament, including scoring and win conditions.'),
});
export type SuggestWinnerFromMatchDataInput = z.infer<typeof SuggestWinnerFromMatchDataInputSchema>;

const SuggestWinnerFromMatchDataOutputSchema = z.object({
  suggestedWinner: z.string().describe('The username of the suggested winner.'),
  confidence: z
    .number()
    .describe('A confidence score (0-1) indicating the certainty of the suggestion.'),
  explanation: z
    .string()
    .describe('An explanation of why the AI suggests this winner.'),
});
export type SuggestWinnerFromMatchDataOutput = z.infer<typeof SuggestWinnerFromMatchDataOutputSchema>;

export async function suggestWinnerFromMatchData(
  input: SuggestWinnerFromMatchDataInput
): Promise<SuggestWinnerFromMatchDataOutput> {
  return suggestWinnerFromMatchDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestWinnerFromMatchDataPrompt',
  input: {schema: SuggestWinnerFromMatchDataInputSchema},
  output: {schema: SuggestWinnerFromMatchDataOutputSchema},
  prompt: `You are an expert BGMI tournament administrator.

You are provided with match data (screenshots, replay files) and the tournament rules.
Your task is to analyze the data and suggest a potential winner based on the rules.

Match Data: {{media url=matchDataUri}}
Tournament Rules: {{{tournamentRules}}}

Consider factors such as kill count, survival time, objective completion, and any other relevant metrics.
Provide a confidence score (0-1) indicating the certainty of your suggestion.
Explain your reasoning for choosing the suggested winner.

Output the suggested winner, confidence score, and explanation in JSON format.`, // Ensure output is valid JSON
});

const suggestWinnerFromMatchDataFlow = ai.defineFlow(
  {
    name: 'suggestWinnerFromMatchDataFlow',
    inputSchema: SuggestWinnerFromMatchDataInputSchema,
    outputSchema: SuggestWinnerFromMatchDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
