'use server';

/**
 * @fileOverview Analyzes tapping data to assess motor skills and detect irregularities.
 *
 * - analyzeTapping - Analyzes tapping data and returns an assessment of motor skills.
 * - AnalyzeTappingInput - The input type for the analyzeTapping function.
 * - AnalyzeTappingOutput - The return type for the analyzeTapping function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTappingInputSchema = z.object({
  tapCount: z.number().describe('The number of taps recorded during the test.'),
  duration: z.number().describe('The duration of the tapping test in seconds.'),
});
export type AnalyzeTappingInput = z.infer<typeof AnalyzeTappingInputSchema>;

const AnalyzeTappingOutputSchema = z.object({
  tapsPerSecond: z
    .number()
    .describe('The number of taps per second during the test.'),
  speedScore: z
    .number()
    .describe('A score representing the speed of tapping.'),
  consistencyScore: z
    .number()
    .describe('A score representing the consistency of tapping.'),
  rhythmScore: z.number().describe('A score representing the rhythm of tapping.'),
  overallScore: z
    .number()
    .describe('An overall score assessing the motor skills.'),
  riskLevel: z
    .string()
    .describe(
      "The risk level assessment based on the tapping analysis ('Low', 'Moderate', or 'High')."
    ),
  recommendation:
    z.string().describe('A recommendation based on the risk level.'),
});
export type AnalyzeTappingOutput = z.infer<typeof AnalyzeTappingOutputSchema>;

export async function analyzeTapping(input: AnalyzeTappingInput): Promise<AnalyzeTappingOutput> {
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
