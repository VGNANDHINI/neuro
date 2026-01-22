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


// Local calculation functions based on the logic from the original prompt
function calculateReactionTimeScore(avgTime: number): number {
    // A score from 0-100 where 100 is excellent (e.g., <280ms) and 0 is very poor (e.g., >800ms).
    const score = 100 - ((avgTime - 280) / (800 - 280)) * 100;
    return Math.max(0, Math.min(100, score));
}

function calculateConsistencyScore(stdDev: number): number {
    // High variability and standard deviation should result in a lower score.
    // A standard deviation less than 60ms is good, while over 250ms is poor.
    const score = 100 - ((stdDev - 60) / (250 - 60)) * 100;
    return Math.max(0, Math.min(100, score));
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
        recommendation:
          'Not enough data for a complete analysis. Please complete all trials.',
      };
    }

    const averageTime = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    const variance = reactionTimes.reduce((acc, time) => acc + Math.pow(time - averageTime, 2), 0) / reactionTimes.length;
    const stdDev = Math.sqrt(variance);

    const reactionTimeScore = calculateReactionTimeScore(averageTime);
    const reactionConsistencyScore = calculateConsistencyScore(stdDev);

    // overallScore: A weighted combination of the time and consistency scores (60% time, 40% consistency).
    const overallScore = reactionTimeScore * 0.6 + reactionConsistencyScore * 0.4;
    
    let riskLevel: 'Low' | 'Moderate' | 'High';
    let recommendation: string;

    // riskLevel: Scores below 50 indicate 'High' risk, scores between 50 and 70 indicate 'Moderate' risk, and scores above 70 indicate 'Low' risk.
    if (overallScore < 50) {
        riskLevel = 'High';
        recommendation = 'Significant slowness or inconsistency in reaction time was detected. This may indicate a change in cognitive-motor processing speed. We strongly recommend sharing these results with your healthcare provider.';
    } else if (overallScore < 70) {
        riskLevel = 'Moderate';
        recommendation = 'Some inconsistency or slowness in reaction time was observed. Factors like age, fatigue, or distraction can affect results. Consider re-testing and monitoring your scores over time.';
    } else {
        riskLevel = 'Low';
        recommendation = 'Your reaction time and consistency are within a normal range. This indicates good cognitive-motor performance. Continue with regular monitoring.';
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
