'use server';
/**
 * @fileOverview Analyzes reaction time patterns to assess cognitive-motor speed.
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


// Local calculation functions
function calculateReactionTimeScore(avgTime: number): number {
    const score = 100 - ((avgTime - 280) / (800 - 280)) * 100;
    return Math.max(0, Math.min(100, score));
}

function calculateConsistencyScore(stdDev: number): number {
    const score = 100 - ((stdDev - 60) / (250 - 60)) * 100;
    return Math.max(0, Math.min(100, score));
}


// Schema for the data passed to the recommendation prompt
const ReactionAnalysisForRecSchema = AnalyzeReactionTimeOutputSchema.omit({ recommendation: true });

// Prompt to generate only the recommendation
const recommendationPrompt = ai.definePrompt({
  name: 'generateReactionTimeRecommendation',
  input: { schema: ReactionAnalysisForRecSchema },
  output: { schema: z.object({ recommendation: z.string() }) },
  prompt: `You are a clinical data analyst. Based on the following reaction time test results, provide a concise, user-friendly recommendation.
  - Average Time: {{averageTime}} ms
  - Reaction Time Score: {{reactionTimeScore}}/100
  - Consistency Score: {{reactionConsistencyScore}}/100
  - Overall Score: {{overallScore}}/100
  - Risk Level: {{riskLevel}}

  If the risk is High, strongly recommend seeing a healthcare provider.
  If Moderate, suggest monitoring and considering a consultation.
  If Low, recommend continued regular monitoring.
  Provide only the recommendation text.`,
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

    const averageTime = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    const variance = reactionTimes.reduce((acc, time) => acc + Math.pow(time - averageTime, 2), 0) / reactionTimes.length;
    const stdDev = Math.sqrt(variance);

    const reactionTimeScore = calculateReactionTimeScore(averageTime);
    const reactionConsistencyScore = calculateConsistencyScore(stdDev);

    const overallScore = reactionTimeScore * 0.6 + reactionConsistencyScore * 0.4;
    
    let riskLevel: 'Low' | 'Moderate' | 'High';
    if (overallScore < 50) {
        riskLevel = 'High';
    } else if (overallScore < 70) {
        riskLevel = 'Moderate';
    } else {
        riskLevel = 'Low';
    }

    const analysisResult = {
        averageTime: parseFloat(averageTime.toFixed(1)),
        reactionTimeScore: parseFloat(reactionTimeScore.toFixed(1)),
        reactionConsistencyScore: parseFloat(reactionConsistencyScore.toFixed(1)),
        overallScore: parseFloat(overallScore.toFixed(1)),
        riskLevel,
    };
    
    // Generate recommendation using AI
    const { output } = await recommendationPrompt(analysisResult);
    if (!output) {
      throw new Error("AI failed to generate a recommendation.");
    }

    return {
        ...analysisResult,
        recommendation: output.recommendation,
    };
  }
);
