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
import type { z } from 'zod';

export async function analyzeTremor(
  input: AnalyzeTremorDataInput
): Promise<z.infer<typeof AnalyzeTremorDataOutputSchema>> {
  return analyzeTremorFlow(input);
}

const analyzeTremorPrompt = ai.definePrompt({
  name: 'analyzeTremorPrompt',
  input: { schema: AnalyzeTremorDataInputSchema },
  output: { schema: AnalyzeTremorDataOutputSchema },
  prompt: `You are a clinical data analyst specializing in Parkinson's disease biomarkers. You have received a series of tremor readings from a wearable device. Your task is to analyze this data and provide a clear, concise summary for the patient.

  The data contains frequency (Hz) and amplitude (arbitrary unit representing intensity).
  - Parkinson's tremor typically occurs at a frequency of 4-6 Hz.
  - Higher amplitude indicates a more intense tremor.

  Based on the provided readings, you must perform the following analysis:

  1.  **Determine Severity**: Classify the overall tremor severity as 'Mild', 'Moderate', or 'Severe'.
      -   **Mild**: Average frequency is within or near the 4-6 Hz range, but average amplitude is consistently low.
      -   **Moderate**: Average frequency is consistently within the 4-6 Hz range, and amplitude is noticeable and variable.
      -   **Severe**: Average frequency is in the 4-6 Hz range, and amplitude is consistently high and may show significant fluctuations.

  2.  **Determine Stability**: Assess the trend of the tremor over time. Classify it as 'Stable', 'Fluctuating', or 'Worsening'.
      -   **Stable**: Amplitude and frequency show no significant upward trend.
      -   **Fluctuating**: Amplitude and/or frequency show significant variability without a clear trend.
      -   **Worsening**: There is a clear upward trend in average amplitude over the time period.

  3.  **Provide a Key Observation**: Write a single sentence that is the most important takeaway from the data. For example: "Tremor amplitude has increased by 20% in the latter half of the readings." or "Tremor frequency remains stable within the Parkinsonian range."

  4.  **Provide a Recommendation**: Write a short, encouraging, and actionable recommendation for the user. Do not diagnose. Focus on monitoring and consulting a professional.

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
    const { output } = await analyzeTremorPrompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid tremor analysis.');
    }
    return output;
  }
);
