'use server';
/**
 * @fileOverview Analyzes finger tapping patterns to detect potential Parkinson's indicators.
 *
 * - analyzeTappingPatterns - A function that handles the tapping pattern analysis.
 * - AnalyzeTappingPatternsInput - The input type for the analyzeTappingPatterns function.
 * - AnalyzeTappingPatternsOutput - The return type for the analyzeTappingPatterns function.
 */

import { ai } from '@/ai/genkit';
import {
  AnalyzeTappingPatternsInputSchema,
  AnalyzeTappingPatternsOutputSchema,
  type AnalyzeTappingPatternsInput,
} from '@/lib/types';
import { z } from 'zod';

export async function analyzeTappingPatterns(
  input: AnalyzeTappingPatternsInput
): Promise<z.infer<typeof AnalyzeTappingPatternsOutputSchema>> {
  return analyzeTappingPatternsFlow(input);
}

// All calculation functions remain as local logic
function calculateSpeedScore(tapsPerSecond: number): number {
  if (tapsPerSecond >= 6) return 100;
  if (tapsPerSecond > 4.5) return 80 + ((tapsPerSecond - 4.5) / 1.5) * 20;
  if (tapsPerSecond > 3) return 60 + ((tapsPerSecond - 3) / 1.5) * 20;
  if (tapsPerSecond > 1.5) return 30 + ((tapsPerSecond - 1.5) / 1.5) * 30;
  return Math.max(0, (tapsPerSecond / 1.5) * 30);
}
function calculateConsistency(tapTimes: number[]): number {
  if (tapTimes.length < 2) return 50;
  const intervals = tapTimes.slice(1).map((time, i) => time - tapTimes[i]);
  if (intervals.length < 2) return 50;
  const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const stdInterval = Math.sqrt(intervals.map(x => Math.pow(x - meanInterval, 2)).reduce((a, b) => a + b, 0) / intervals.length);
  const cv = meanInterval > 0 ? stdInterval / meanInterval : 1;
  return Math.max(0, 100 - cv * 100);
}
function calculateRhythm(tapTimes: number[]): number {
    const intervals = tapTimes.slice(1).map((time, i) => time - tapTimes[i]);
    if (intervals.length < 3) return 50;
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    if(mean === 0) return 50;
    const std = Math.sqrt(intervals.reduce((sum, val) => sum + (val - mean) ** 2, 0) / intervals.length);
    if (std === 0) return 100;
    const normalizedIntervals = intervals.map(val => (val - mean) / std);
    let autocorr = 0;
    for (let i = 0; i < normalizedIntervals.length - 1; i++) {
        autocorr += normalizedIntervals[i] * normalizedIntervals[i + 1];
    }
    autocorr /= (normalizedIntervals.length - 1);
    return Math.min(100, Math.max(0, (autocorr + 0.5) * 100));
}
function calculateFatigue(tapTimes: number[], duration: number): number {
  if (tapTimes.length < 10) return 100;
  const midPoint = duration / 2;
  const earlyTaps = tapTimes.filter(t => t <= midPoint);
  const lateTaps = tapTimes.filter(t => t > midPoint);
  if (earlyTaps.length < 5 || lateTaps.length < 5) return 100;
  const earlyIntervals = earlyTaps.slice(1).map((time, i) => time - earlyTaps[i]);
  const lateIntervals = lateTaps.slice(1).map((time, i) => time - lateTaps[i]);
  if(earlyIntervals.length === 0 || lateIntervals.length === 0) return 100;
  const meanEarlyInterval = earlyIntervals.reduce((a, b) => a + b, 0) / earlyIntervals.length;
  const meanLateInterval = lateIntervals.reduce((a, b) => a + b, 0) / lateIntervals.length;
  if (meanEarlyInterval === 0) return 50;
  const intervalIncrease = ((meanLateInterval - meanEarlyInterval) / meanEarlyInterval) * 100;
  return Math.max(0, Math.min(100, 100 - intervalIncrease));
}

// Schema for the data passed to the recommendation prompt
const TappingAnalysisForRecSchema = AnalyzeTappingPatternsOutputSchema.omit({ recommendation: true });

// Prompt to generate only the recommendation
const recommendationPrompt = ai.definePrompt({
  name: 'generateTappingRecommendation',
  input: { schema: TappingAnalysisForRecSchema },
  output: { schema: z.object({ recommendation: z.string() }) },
  prompt: `You are a clinical data analyst. Based on the following finger tapping test results, provide a concise, user-friendly recommendation.
  - Taps Per Second: {{tapsPerSecond}}
  - Speed Score: {{speedScore}}/100
  - Consistency Score: {{consistencyScore}}/100
  - Rhythm Score: {{rhythmScore}}/100
  - Fatigue Score: {{fatigueScore}}/100
  - Overall Score: {{overallScore}}/100
  - Risk Level: {{riskLevel}}

  If the risk is High, strongly recommend seeing a neurologist.
  If Moderate, suggest retesting and consulting a healthcare provider if concerned.
  If Low, recommend continued regular monitoring.
  Provide only the recommendation text.`,
});

const analyzeTappingPatternsFlow = ai.defineFlow(
  {
    name: 'analyzeTappingPatternsFlow',
    inputSchema: AnalyzeTappingPatternsInputSchema,
    outputSchema: AnalyzeTappingPatternsOutputSchema,
  },
  async ({ tapTimestamps, duration }) => {
    
    if (tapTimestamps.length < 10) {
        return {
            tapCount: tapTimestamps.length, tapsPerSecond: tapTimestamps.length / duration,
            speedScore: 0, consistencyScore: 0, rhythmScore: 0, fatigueScore: 0, overallScore: 0,
            riskLevel: 'Low',
            recommendation: 'Not enough tapping data for a complete analysis. Please tap more consistently for the full duration.'
        };
    }
    
    const tapTimesInSeconds = tapTimestamps.map(t => t / 1000);
    const tapCount = tapTimesInSeconds.length;
    const tapsPerSecond = tapCount / duration;

    const speedScore = calculateSpeedScore(tapsPerSecond);
    const consistencyScore = calculateConsistency(tapTimesInSeconds);
    const rhythmScore = calculateRhythm(tapTimesInSeconds);
    const fatigueScore = calculateFatigue(tapTimesInSeconds, duration);
    
    const overallScore = speedScore * 0.35 + consistencyScore * 0.35 + rhythmScore * 0.20 + fatigueScore * 0.10;

    let riskLevel: 'Low' | 'Moderate' | 'High';
    if (overallScore < 50) {
        riskLevel = 'High';
    } else if (overallScore < 70) {
        riskLevel = 'Moderate';
    } else {
        riskLevel = 'Low';
    }

    const analysisResult = {
        tapCount: Math.round(tapCount),
        tapsPerSecond: parseFloat(tapsPerSecond.toFixed(2)),
        speedScore: parseFloat(speedScore.toFixed(1)),
        consistencyScore: parseFloat(consistencyScore.toFixed(1)),
        rhythmScore: parseFloat(rhythmScore.toFixed(1)),
        fatigueScore: parseFloat(fatigueScore.toFixed(1)),
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
