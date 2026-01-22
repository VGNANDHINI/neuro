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

// Helper functions
function calculateReactionTimeScore(averageTime: number): number {
  // A good score is for a low reaction time.
  // Let's say < 250ms is excellent (100), and score drops linearly to 0 at 750ms.
  if (averageTime < 250) return 100;
  if (averageTime > 750) return 0;
  return 100 - ((averageTime - 250) / 500) * 100;
}

function calculateConsistencyScore(reactionTimes: number[]): number {
  if (reactionTimes.length < 2) return 0;
  const mean = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
  const stdDev = Math.sqrt(
    reactionTimes.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / reactionTimes.length
  );
  
  // Score is inversely proportional to standard deviation.
  // Let's say a stddev of < 50ms is excellent (100), dropping to 0 at 250ms.
  if (stdDev < 50) return 100;
  if (stdDev > 250) return 0;
  return 100 - ((stdDev - 50) / 200) * 100;
}

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
            recommendation: 'Not enough data for a complete analysis. Please complete all trials.'
        };
    }
    
    const averageTime = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    
    const reactionTimeScore = calculateReactionTimeScore(averageTime);
    const reactionConsistencyScore = calculateConsistencyScore(reactionTimes);
    
    // Weighted average for overall score
    const overallScore = reactionTimeScore * 0.6 + reactionConsistencyScore * 0.4;

    let riskLevel: 'Low' | 'Moderate' | 'High';
    let recommendation: string;

    if (overallScore >= 70) {
        riskLevel = 'Low';
        recommendation = 'Your reaction time and consistency are within the normal range. Cognitive-motor speed appears stable.';
    } else if (overallScore >= 50) {
        riskLevel = 'Moderate';
        recommendation = 'Some slowness or inconsistency was detected. This could be due to factors like fatigue or distraction. Consider re-testing when you are well-rested.';
    } else {
        riskLevel = 'High';
        recommendation = 'Significant slowness or inconsistency in reaction time was detected. This may indicate a change in cognitive-motor processing speed. We recommend sharing these results with your healthcare provider.';
    }

    return {
        averageTime: parseFloat(averageTime.toFixed(1)),
        reactionTimeScore: parseFloat(reactionTimeScore.toFixed(1)),
        reactionConsistencyScore: parseFloat(reactionConsistencyScore.toFixed(1)),
        overallScore: parseFloat(overallScore.toFixed(1)),
        riskLevel,
        recommendation,
    };
  }
);
