'use server';
/**
 * @fileOverview Analyzes a spiral drawing to detect potential Parkinson's indicators.
 *
 * - analyzeSpiralDrawing - A function that handles the spiral drawing analysis process.
 * - AnalyzeSpiralDrawingInput - The input type for the analyzeSpiralDrawing function.
 * - AnalyzeSpiralDrawingOutput - The return type for the analyzeSpiralDrawing function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSpiralDrawingInputSchema = z.object({
  points: z
    .string()
    .describe(
      'A JSON string containing an array of points, each with x, y coordinates, and timestamp.'
    ),
});
export type AnalyzeSpiralDrawingInput = z.infer<typeof AnalyzeSpiralDrawingInputSchema>;

const AnalyzeSpiralDrawingOutputSchema = z.object({
  tremorScore: z
    .number()
    .describe('A score indicating the level of tremor detected in the drawing.'),
  smoothnessScore: z.number().describe('A score indicating the smoothness of the drawing.'),
  speedScore: z.number().describe('A score indicating the speed of the drawing.'),
  consistencyScore: z
    .number()
    .describe('A score indicating the consistency of the drawing.'),
  overallScore: z.number().describe('An overall score indicating the likelihood of Parkinson’s.'),
  riskLevel: z
    .enum(['Low', 'Moderate', 'High'])
    .describe('The risk level based on the analysis.'),
  recommendation: z
    .string()
    .describe('A recommendation based on the risk level, e.g., consult a neurologist.'),
});
export type AnalyzeSpiralDrawingOutput = z.infer<typeof AnalyzeSpiralDrawingOutputSchema>;

export async function analyzeSpiralDrawing(input: AnalyzeSpiralDrawingInput): Promise<AnalyzeSpiralDrawingOutput> {
  return analyzeSpiralDrawingFlow(input);
}

const analyzeSpiralDrawingPrompt = ai.definePrompt({
  name: 'analyzeSpiralDrawingPrompt',
  input: {schema: AnalyzeSpiralDrawingInputSchema},
  output: {schema: AnalyzeSpiralDrawingOutputSchema},
  prompt: `You are a medical expert specialized in analyzing spiral drawings for early detection of Parkinson's disease.

You will receive a JSON string containing an array of points representing a spiral drawing. Each point has x, y coordinates, and a timestamp.

Analyze the drawing based on tremor, smoothness, speed, and consistency, and output an overall score and risk level.

Based on the risk level, provide a recommendation.

Drawing data: {{{points}}}
`,
});

const analyzeSpiralDrawingFlow = ai.defineFlow(
  {
    name: 'analyzeSpiralDrawingFlow',
    inputSchema: AnalyzeSpiralDrawingInputSchema,
    outputSchema: AnalyzeSpiralDrawingOutputSchema,
  },
  async input => {
    const {output} = await analyzeSpiralDrawingPrompt(input);
    return output!;
  }
);
