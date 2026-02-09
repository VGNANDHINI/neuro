'use server';
/**
 * @fileOverview Analyzes historical tremor data to assess severity and stability.
 *
 * - analyzeTremor - A function that handles the tremor data analysis process.
 * - AnalyzeTremorDataInput - The input type for the analyzeTremor function.
 * - AnalyzeTremorDataOutput - The return type for the analyzeTremor function.
 */

import { ai } from '@/ai/genkit';
import {
  AnalyzeTremorDataInputSchema,
  AnalyzeTremorDataOutputSchema,
  type AnalyzeTremorDataInput,
} from '@/lib/types';
import { z } from 'zod';

export async function analyzeTremor(
  input: AnalyzeTremorDataInput
): Promise<z.infer<typeof AnalyzeTremorDataOutputSchema>> {
  return analyzeTremorFlow(input);
}

// Define an augmented input schema for the recommendation prompt
const TremorAnalysisForRecSchema = AnalyzeTremorDataOutputSchema.extend({
  avgFrequency: z.number(),
  avgAmplitude: z.number(),
  amplitudeTrend: z.number(),
});

// Prompt to generate only the key observation and recommendation
const recommendationPrompt = ai.definePrompt({
  name: 'generateTremorRecommendation',
  input: { schema: TremorAnalysisForRecSchema },
  output: { schema: z.object({ keyObservation: z.string(), recommendation: z.string() }) },
  prompt: `You are a clinical data analyst specializing in Parkinson's disease. Based on the following tremor analysis report, provide a single key observation and a concise, user-friendly recommendation.

  **Analysis Report:**
  - Average Frequency: {{avgFrequency}} Hz (Typical Parkinson's tremor is 4-6 Hz)
  - Average Amplitude: {{avgAmplitude}} (Higher is more intense)
  - Amplitude Trend Slope: {{amplitudeTrend}} (A positive slope suggests worsening)
  - Assessed Severity: {{severity}}
  - Assessed Stability: {{stability}}

  If the severity is Severe or stability is Worsening, strongly recommend seeing a healthcare provider.
  If Moderate or Fluctuating, suggest continued monitoring and considering a consultation.
  If Mild and Stable, provide reassurance and recommend continued monitoring.
  
  Return your response as a valid JSON object with the keys "keyObservation" and "recommendation".`,
});


const analyzeTremorFlow = ai.defineFlow(
  {
    name: 'analyzeTremorFlow',
    inputSchema: AnalyzeTremorDataInputSchema,
    outputSchema: AnalyzeTremorDataOutputSchema,
  },
  async (input) => {
    const { readings } = input;
    if (readings.length < 10) {
        throw new Error('Not enough tremor readings provided for analysis. At least 10 are required.');
    }

    // Perform all calculations locally
    const avgFrequency = readings.reduce((sum, r) => sum + r.frequency, 0) / readings.length;
    const avgAmplitude = readings.reduce((sum, r) => sum + r.amplitude, 0) / readings.length;
    
    let trend = 0;
    if (readings.length > 1) {
        const n = readings.length;
        const x = readings.map((_, i) => i); const y = readings.map(r => r.amplitude);
        const sumX = x.reduce((a, b) => a + b, 0); const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const denominator = n * sumX2 - sumX * sumX;
        if (denominator !== 0) { trend = (n * sumXY - sumX * sumY) / denominator; }
    }

    // Determine Severity and Stability locally
    let severity: 'Mild' | 'Moderate' | 'Severe';
    if (avgAmplitude > 40) severity = 'Severe';
    else if (avgAmplitude > 20) severity = 'Moderate';
    else severity = 'Mild';

    let stability: 'Stable' | 'Fluctuating' | 'Worsening';
    if (trend > 0.5) stability = 'Worsening'; // Trend slope is significantly positive
    else if (Math.abs(trend) < 0.1) stability = 'Stable'; // Trend is near zero
    else stability = 'Fluctuating';


    const analysisResult = {
        severity,
        stability,
        avgFrequency,
        avgAmplitude,
        amplitudeTrend: trend,
    };
    
    // Call AI only for the recommendation and key observation
    const { output } = await recommendationPrompt(analysisResult);
    
    if (!output) {
      throw new Error('The AI model did not return a valid recommendation.');
    }

    return {
        severity: analysisResult.severity,
        stability: analysisResult.stability,
        keyObservation: output.keyObservation,
        recommendation: output.recommendation,
    };
  }
);
