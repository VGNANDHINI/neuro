'use server';

/**
 * @fileOverview Analyzes tapping data to assess motor skills and detect irregularities.
 *
 * - analyzeTapping - Analyzes tapping data and returns an assessment of motor skills.
 * - AnalyzeTappingInput - The input type for the analyzeTapping function.
 * - AnalyzeTappingOutput - The return type for the analyzeTapping function.
 */

import {ai} from '@/ai/genkit';
import {
  AnalyzeTappingInputSchema,
  AnalyzeTappingOutputSchema,
  type AnalyzeTappingInput,
} from '@/lib/types';

export async function analyzeTapping(input: AnalyzeTappingInput): Promise<any> {
  return analyzeTappingFlow(input);
}

const analyzeTappingPrompt = ai.definePrompt({
  name: 'analyzeTappingPrompt',
  input: {schema: AnalyzeTappingInputSchema},
  output: {schema: AnalyzeTappingOutputSchema},
  prompt: `You are an expert in analyzing tapping test results to assess motor skills and detect irregularities that may indicate early signs of conditions like Parkinson's disease.

  Given the following tapping test data, calculate relevant metrics and provide an overall assessment of motor skills.

  Tap Count: {{{tapCount}}}
  Duration: {{{duration}}} seconds

  Based on the data, determine the taps per second, speed score, consistency score, rhythm score, overall score, and risk level (Low, Moderate, or High).

  Provide a recommendation based on the risk level:
  - Low: No significant irregularities detected. Continue regular monitoring.
  - Moderate: Some irregularities detected. Consider retesting and consulting a healthcare provider if symptoms persist.
  - High: Significant irregularities detected. We strongly recommend scheduling an appointment with a neurologist for comprehensive evaluation.

  Ensure that the output is structured according to the AnalyzeTappingOutputSchema.
  `,
});

const analyzeTappingFlow = ai.defineFlow(
  {
    name: 'analyzeTappingFlow',
    inputSchema: AnalyzeTappingInputSchema,
    outputSchema: AnalyzeTappingOutputSchema,
  },
  async input => {
    const {output} = await analyzeTappingPrompt(input);
    return output!;
  }
);
