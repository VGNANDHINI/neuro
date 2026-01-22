'use server';
/**
 * @fileOverview Analyzes reaction time patterns to assess cognitive-motor speed using an AI model.
 *
 * - analyzeReactionTime - A function that handles the reaction time analysis.
 * - AnalyzeReactionTimeInput - The input type for the analyzeReactionTime function.
 * - AnalyzeReactionTimeOutput - The return type for the analyzeReactionTime function.
 */

import { ai } from '@/ai/genkit';
import {
  AnalyzeReactionTimeInputSchema,
  AnalyzeReactionTimeOutputSchema,
  type AnalyzeReactionTimeInput,
} from '@/lib/types';
import { z } from 'zod';

export async function analyzeReactionTime(
  input: AnalyzeReactionTimeInput
): Promise<z.infer<typeof AnalyzeReactionTimeOutputSchema>> {
  return analyzeReactionTimeFlow(input);
}

const analyzeReactionTimePrompt = ai.definePrompt({
  name: 'analyzeReactionTimePrompt',
  input: { schema: AnalyzeReactionTimeInputSchema },
  output: { schema: AnalyzeReactionTimeOutputSchema },
  prompt: `You are an expert in analyzing cognitive-motor test results for potential indicators of neurological conditions like Parkinson's disease.

Analyze the provided series of reaction times, given in milliseconds.
Reaction Times: {{reactionTimes}}

Based on the data, provide a detailed analysis including:
1.  averageTime: The average reaction time in milliseconds.
2.  reactionTimeScore: A score from 0-100 where 100 is excellent (e.g., <280ms) and 0 is very poor (e.g., >800ms). Slower times should result in a lower score.
3.  reactionConsistencyScore: A score from 0-100 based on the consistency of the reaction times. High variability and standard deviation should result in a lower score. A standard deviation less than 60ms is good, while over 250ms is poor.
4.  overallScore: A weighted combination of the time and consistency scores (60% time, 40% consistency).
5.  riskLevel: A risk level ('Low', 'Moderate', 'High') based on the overall score. Scores below 50 indicate 'High' risk, scores between 50 and 70 indicate 'Moderate' risk, and scores above 70 indicate 'Low' risk.
6.  recommendation: A plain-language recommendation for the user. A high-risk result should strongly suggest consulting a healthcare provider. Mention that factors like age, fatigue, and distraction can affect results.

You must provide the output in the specified JSON format only.`,
});

const analyzeReactionTimeFlow = ai.defineFlow(
  {
    name: 'analyzeReactionTimeFlow',
    inputSchema: AnalyzeReactionTimeInputSchema,
    outputSchema: AnalyzeReactionTimeOutputSchema,
  },
  async ({ reactionTimes }) => {
    if (reactionTimes.length < 3) {
      return {
        averageTime: 0,
        reactionTimeScore: 0,
        reactionConsistencyScore: 0,
        overallScore: 0,
        riskLevel: 'Low',
        recommendation:
          'Not enough data for a complete analysis. Please complete all trials.',
      };
    }

    const { output } = await analyzeReactionTimePrompt({ reactionTimes });
    
    if (!output) {
      throw new Error("The AI model did not return a valid analysis.");
    }

    // Ensure all numeric values are numbers and not strings from the LLM
    return {
        ...output,
        averageTime: Number(output.averageTime),
        reactionTimeScore: Number(output.reactionTimeScore),
        reactionConsistencyScore: Number(output.reactionConsistencyScore),
        overallScore: Number(output.overallScore),
    };
  }
);
