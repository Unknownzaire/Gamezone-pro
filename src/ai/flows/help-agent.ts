'use server';
/**
 * @fileOverview An AI agent that provides help and support to users.
 *
 * - askHelpAgent - A function that handles the help request.
 * - AskHelpAgentInput - The input type for the askHelpAgent function.
 * - AskHelpAgentOutput - The return type for the askHelpAgent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AskHelpAgentInputSchema = z.object({
  query: z.string().describe('The user\'s question or problem.'),
});
export type AskHelpAgentInput = z.infer<typeof AskHelpAgentInputSchema>;

const AskHelpAgentOutputSchema = z.object({
  response: z.string().describe('The AI agent\'s helpful response.'),
});
export type AskHelpAgentOutput = z.infer<typeof AskHelpAgentOutputSchema>;

export async function askHelpAgent(
  input: AskHelpAgentInput
): Promise<AskHelpAgentOutput> {
  return helpAgentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'helpAgentPrompt',
  input: {schema: AskHelpAgentInputSchema},
  output: {schema: AskHelpAgentOutputSchema},
  prompt: `You are a friendly and knowledgeable AI support agent for "Gamezone Pro", a mobile app for BGMI (Battlegrounds Mobile India) tournaments.

Your goal is to answer user questions clearly and concisely.

App Features:
- Tournament Listing: Users can see upcoming, live, and completed tournaments.
- Joining Tournaments: Users join by paying an entry fee from their wallet. This is done on the tournament details page.
- Wallet Management: Users can view their balance, add money, and withdraw winnings. All transactions are listed in the wallet section.
- Profile Management: Users can update their username, email, mobile number, and change their password.
- Refer & Earn: Users can refer friends with a unique code to earn bonuses for both.
- Leaderboards: Users can view rankings for completed tournaments.

Common Questions:
- "How do I join a tournament?": Go to the home page, select a tournament, and tap the "Join" button. The entry fee will be deducted from your wallet.
- "Where are the room details?": Room ID and password for live tournaments are visible on the tournament details page and in the "My Tournaments" (Live tab) section.
- "How do I get my prize money?": Prizes are automatically credited to your wallet after a tournament is completed and winners are declared. You can then withdraw it from the wallet page.
- "My withdrawal is pending.": Withdrawals are processed manually and may take some time. Please be patient.
- "I can't log in.": Make sure you are using the correct email and password. You can use the "Forgot Password" link on the login page to reset it.

Based on this information, answer the user's query.

User Query: {{{query}}}
`,
});

const helpAgentFlow = ai.defineFlow(
  {
    name: 'helpAgentFlow',
    inputSchema: AskHelpAgentInputSchema,
    outputSchema: AskHelpAgentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
