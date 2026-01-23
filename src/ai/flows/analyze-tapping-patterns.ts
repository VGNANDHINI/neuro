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

// Helper functions for analysis
function calculateSpeedScore(tapsPerSecond: number): number {
  if (tapsPerSecond >= 6) return 100; // Excellent
  if (tapsPerSecond > 4.5) return 80 + ((tapsPerSecond - 4.5) / 1.5) * 20; // Good
  if (tapsPerSecond > 3) return 60 + ((tapsPerSecond - 3) / 1.5) * 20; // Moderate
  if (tapsPerSecond > 1.5) return 30 + ((tapsPerSecond - 1.5) / 1.5) * 30; // Poor
  return Math.max(0, (tapsPerSecond / 1.5) * 30); // Very Poor
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
    const std = Math.sqrt(intervals.reduce((sum, val) => sum + (val - mean) ** 2, 0) / intervals.length);
    if (std === 0) return 100;

    const normalizedIntervals = intervals.map(val => (val - mean) / std);

    // Calculate autocorrelation at lag 1
    let autocorr = 0;
    for (let i = 0; i < normalizedIntervals.length - 1; i++) {
        autocorr += normalizedIntervals[i] * normalizedIntervals[i + 1];
    }
    autocorr /= (normalizedIntervals.length - 1);

    return Math.min(100, Math.max(0, (autocorr + 0.5) * 100)); // Scale to 0-100
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

  if (meanEarlyInterval === 0) return 50; // Avoid division by zero, return a middling score.

  // A positive value means slowing down (interval got longer)
  const intervalIncrease = ((meanLateInterval - meanEarlyInterval) / meanEarlyInterval) * 100;
  
  // A score of 100 means no fatigue. A 50% slowdown (interval increase) results in a score of 50.
  const score = 100 - intervalIncrease;
  
  return Math.max(0, Math.min(100, score));
}


const analyzeTappingPatternsFlow = ai.defineFlow(
  {
    name: 'analyzeTappingPatternsFlow',
    inputSchema: AnalyzeTappingPatternsInputSchema,
    outputSchema: AnalyzeTappingPatternsOutputSchema,
  },
  async ({ tapTimestamps, duration }) => {
    
    if (tapTimestamps.length < 10) {
        return {
            tapCount: tapTimestamps.length,
            tapsPerSecond: tapTimestamps.length / duration,
            speedScore: 0,
            consistencyScore: 0,
            rhythmScore: 0,
            fatigueScore: 0,
            overallScore: 0,
            riskLevel: 'Low',
            recommendation: 'Not enough tapping data for a complete analysis. Please try to tap more consistently for the full duration.'
        };
    }
    
    const tapTimesInSeconds = tapTimestamps.map(t => t / 1000);
    const tapCount = tapTimesInSeconds.length;
    const tapsPerSecond = tapCount / duration;

    const speedScore = calculateSpeedScore(tapsPerSecond);
    const consistencyScore = calculateConsistency(tapTimesInSeconds);
    const rhythmScore = calculateRhythm(tapTimesInSeconds);
    const fatigueScore = calculateFatigue(tapTimesInSeconds, duration);
    
    // Weighted average for overall score
    const overallScore =
      speedScore * 0.35 +
      consistencyScore * 0.35 +
      rhythmScore * 0.20 +
      fatigueScore * 0.10;

    let riskLevel: 'Low' | 'Moderate' | 'High';
    let recommendation: string;

    if (overallScore >= 70) {
        riskLevel = 'Low';
        recommendation = 'Tapping performance is within normal range. Your motor control appears stable and consistent. Continue regular monitoring.';
    } else if (overallScore >= 50) {
        riskLevel = 'Moderate';
        recommendation = 'Some irregularities detected in tapping speed or rhythm. This could be due to various factors. Consider retesting and consult a healthcare provider if you have concerns.';
    } else {
        riskLevel = 'High';
        recommendation = 'Significant irregularities detected in motor control, speed, or rhythm. We strongly recommend scheduling an appointment with a neurologist for a comprehensive evaluation.';
    }

    return {
        tapCount: Math.round(tapCount),
        tapsPerSecond: parseFloat(tapsPerSecond.toFixed(2)),
        speedScore: parseFloat(speedScore.toFixed(1)),
        consistencyScore: parseFloat(consistencyScore.toFixed(1)),
        rhythmScore: parseFloat(rhythmScore.toFixed(1)),
        fatigueScore: parseFloat(fatigueScore.toFixed(1)),
        overallScore: parseFloat(overallScore.toFixed(1)),
        riskLevel,
        recommendation,
    };
  }
);
