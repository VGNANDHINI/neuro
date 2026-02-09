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

const TremorAnalysisPartialSchema = z.object({
  severity: z.enum(['Mild', 'Moderate', 'Severe']).describe('The overall assessment of tremor severity based on the data.'),
  stability: z.enum(['Stable', 'Fluctuating', 'Worsening']).describe('The trend of the tremor over the provided time period.'),
  keyObservation: z.string().describe('The single most important observation from the data (e.g., "Amplitude has increased by 20% this week.").')
});


const analyzeTremorPartialPrompt = ai.definePrompt({
  name: 'analyzeTremorPartialPrompt',
  input: { schema: AnalyzeTremorDataInputSchema },
  output: { schema: TremorAnalysisPartialSchema },
  prompt: `You are a clinical data analyst specializing in Parkinson's disease biomarkers. You have received a series of tremor readings from a wearable device. Your task is to analyze this data and provide a classification and key observation.

  The data contains frequency (Hz) and amplitude (arbitrary unit representing intensity).
  - Parkinson's tremor typically occurs at a frequency of 4-6 Hz.
  - Higher amplitude indicates a more intense tremor.

  Based on the provided readings, you must perform the following analysis:

  1.  **Determine Severity**: Classify the overall tremor severity as 'Mild', 'Moderate', or 'Severe'.
      -   **Mild**: Average frequency is within or near the 4-6 Hz range, but average amplitude is consistently low (e.g., < 20).
      -   **Moderate**: Average frequency is consistently within the 4-6 Hz range, and amplitude is noticeable and variable (e.g., 20-40).
      -   **Severe**: Average frequency is in the 4-6 Hz range, and amplitude is consistently high (e.g., > 40).

  2.  **Determine Stability**: Assess the trend of the tremor over time. Classify it as 'Stable', 'Fluctuating', or 'Worsening'.
      -   **Stable**: Amplitude and frequency show no significant upward trend.
      -   **Fluctuating**: Amplitude and/or frequency show significant variability without a clear trend.
      -   **Worsening**: There is a clear upward trend in average amplitude over the time period.

  3.  **Provide a Key Observation**: Write a single, concise sentence that is the most important takeaway from the data. For example: "Tremor amplitude has increased by 20% in the latter half of the readings." or "Tremor frequency remains stable within the Parkinsonian range."

  Do NOT provide a recommendation. Only output the structured JSON.

  Here is the historical tremor data:
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
    const { output: analysis } = await analyzeTremorPartialPrompt(input);
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
