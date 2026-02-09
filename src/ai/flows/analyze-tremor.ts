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

// This schema is what the AI will output. It's a classification and summarization task.
const TremorAnalysisPartialSchema = z.object({
  severity: z.enum(['Mild', 'Moderate', 'Severe']).describe('The overall assessment of tremor severity based on the pre-calculated metrics and data.'),
  stability: z.enum(['Stable', 'Fluctuating', 'Worsening']).describe('The trend of the tremor over the provided time period based on the pre-calculated metrics.'),
  keyObservation: z.string().describe('The single most important observation from the data (e.g., "Amplitude has increased by 20% this week.").')
});

// NEW: Define an augmented input schema for the prompt that includes our pre-calculated metrics.
const AugmentedTremorInputSchema = AnalyzeTremorDataInputSchema.extend({
    avgFrequency: z.number(),
    avgAmplitude: z.number(),
    amplitudeTrend: z.number().describe('The slope of the amplitude trend line. Positive means worsening.'),
});


// UPDATED: The prompt is now simpler for the AI. It receives pre-calculated metrics.
const analyzeTremorPartialPrompt = ai.definePrompt({
  name: 'analyzeTremorPartialPrompt',
  input: { schema: AugmentedTremorInputSchema },
  output: { schema: TremorAnalysisPartialSchema },
  prompt: `You are a clinical data analyst specializing in Parkinson's disease biomarkers. You have received a series of tremor readings and some pre-calculated metrics. Your task is to classify the data and provide a key observation.

  **Pre-calculated Metrics:**
  - Average Frequency: {{avgFrequency}} Hz (Typical Parkinson's tremor is 4-6 Hz)
  - Average Amplitude: {{avgAmplitude}} (Higher is more intense)
  - Amplitude Trend Slope: {{amplitudeTrend}} (A positive slope suggests worsening over time)

  **Your Task:**
  Based on the pre-calculated metrics and the raw data below, perform the following analysis:

  1.  **Determine Severity**: Classify the severity as 'Mild' (avg amplitude < 20), 'Moderate' (20-40), or 'Severe' (> 40).
  2.  **Determine Stability**: Classify the stability. If the trend slope is significantly positive, classify as 'Worsening'. If it's near zero, classify as 'Stable'. Otherwise, classify as 'Fluctuating'.
  3.  **Provide a Key Observation**: Write a single, concise sentence that is the most important takeaway from the data.

  Do NOT provide a recommendation. Only output the structured JSON.

  **Raw Historical Tremor Data:**
  {{#each readings}}
  - Time: {{createdAt}}, Frequency: {{frequency}} Hz, Amplitude: {{amplitude}}
  {{/each}}
  `,
});


const analyzeTremorFlow = ai.defineFlow(
  {
    name: 'analyzeTremorFlow',
    inputSchema: AnalyzeTremorDataInputSchema,
    outputSchema: AnalyzeTremorDataOutputSchema,
  },
  async (input) => {
    // NEW: Pre-calculation logic is moved into the flow.
    const { readings } = input;
    if (readings.length === 0) {
        // Should be guarded before calling, but as a fallback.
        throw new Error('No tremor readings provided for analysis.');
    }

    const avgFrequency = readings.reduce((sum, r) => sum + r.frequency, 0) / readings.length;
    const avgAmplitude = readings.reduce((sum, r) => sum + r.amplitude, 0) / readings.length;
    
    // Simple linear regression for trend
    let trend = 0;
    if (readings.length > 1) {
        const n = readings.length;
        const x = readings.map((_, i) => i);
        const y = readings.map(r => r.amplitude);
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const denominator = n * sumX2 - sumX * sumX;
        if (denominator !== 0) {
            trend = (n * sumXY - sumX * sumY) / denominator;
        }
    }

    // UPDATED: Call the prompt with the augmented data.
    const { output: analysis } = await analyzeTremorPartialPrompt({
        ...input,
        avgFrequency,
        avgAmplitude,
        amplitudeTrend: trend,
    });
    
    if (!analysis) {
      throw new Error('The AI model did not return a valid tremor analysis.');
    }

    let recommendation: string;
    if (analysis.severity === 'Severe' || analysis.stability === 'Worsening') {
        recommendation = 'Your tremor patterns show signs of worsening or high severity. We strongly recommend sharing these results with your healthcare provider for a closer look.';
    } else if (analysis.severity === 'Moderate' || analysis.stability === 'Fluctuating') {
        recommendation = 'Your tremor patterns are showing some fluctuation or moderate severity. Continue regular monitoring and consider discussing these patterns with your healthcare provider at your next appointment.';
    } else {
        recommendation = 'Your tremor patterns appear to be stable and mild. This is a positive sign. Continue with your regular monitoring schedule.';
    }

    return {
        ...analysis,
        recommendation,
    };
  }
);
