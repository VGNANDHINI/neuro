'use server';

/**
 * @fileOverview An AI agent that analyzes a user's voice recording to identify potential vocal biomarkers of Parkinson's.
 *
 * - analyzeVoiceRecording - A function that handles the voice recording analysis process.
 * - AnalyzeVoiceRecordingInput - The input type for the analyzeVoiceRecording functionूं.
 * - AnalyzeVoiceRecordingOutput - The return type for the analyzeVoiceRecording function.
 */

import {ai} from '@/ai/genkit';
import {
  AnalyzeVoiceRecordingInputSchema,
  AnalyzeVoiceRecordingOutputSchema,
  type AnalyzeVoiceRecordingInput,
} from '@/lib/types';
import { z } from 'zod';

export async function analyzeVoiceRecording(
  input: AnalyzeVoiceRecordingInput
): Promise<any> {
  return analyzeVoiceRecordingFlow(input);
}


// NEW schema for the prompt-only scores
const VoiceAnalysisScoresSchema = z.object({
  pitchScore: z.number().describe('The pitch score of the voice recording (0-100, higher is better).'),
  volumeScore: z.number().describe('The volume score of the voice recording (0-100, higher is better).'),
  clarityScore: z.number().describe('The clarity score of the voice recording (0-100, higher is better).'),
  tremorScore: z.number().describe('The tremor score of the voice recording (0-100, higher is worse).'),
});

// NEW prompt that only asks for scores
const analyzeVoiceScoresPrompt = ai.definePrompt({
  name: 'analyzeVoiceScoresPrompt',
  input: {schema: AnalyzeVoiceRecordingInputSchema},
  output: {schema: VoiceAnalysisScoresSchema},
  prompt: `You are an expert in analyzing voice recordings for potential vocal biomarkers of Parkinson's disease.
The user has recorded themselves saying "The quick brown fox jumps over the lazy dog."
Analyze the provided voice recording of this phrase.

You will assess the following vocal characteristics on a scale of 0-100 and return them in a structured JSON format.
- **pitchScore**: Evaluate for monopitch. A varied and natural pitch gets a high score (closer to 100). A flat, monotonous pitch gets a low score.
- **volumeScore**: Evaluate for monoloudness. Consistent, clear volume gets a high score (closer to 100). Trailing off or inconsistent volume gets a low score.
- **clarityScore**: Evaluate for slurred or imprecise speech. Crisp, clear articulation gets a high score (closer to 100). Mumbled or slurred words get a low score.
- **tremorScore**: This score measures the amount of tremor, where a higher score means more tremor is detected. A score of 0 is a perfectly steady voice.

Voice Recording: {{media url=audioDataUri}}
`,
});

const analyzeVoiceRecordingFlow = ai.defineFlow(
  {
    name: 'analyzeVoiceRecordingFlow',
    inputSchema: AnalyzeVoiceRecordingInputSchema,
    outputSchema: AnalyzeVoiceRecordingOutputSchema,
  },
  async input => {
    const { output: scores } = await analyzeVoiceScoresPrompt(input);
    if (!scores) {
      throw new Error('The AI model did not return valid scores.');
    }
    
    const { pitchScore, volumeScore, clarityScore, tremorScore } = scores;

    // The weights are: clarityScore (40%), volumeScore (25%), pitchScore (20%), and Steadiness (100 - tremorScore) (15%).
    const overallScore =
      clarityScore * 0.4 +
      volumeScore * 0.25 +
      pitchScore * 0.2 +
      (100 - tremorScore) * 0.15;

    let riskLevel: 'Low' | 'Moderate' | 'High';
    let recommendation: string;

    // riskLevel: overallScore >= 75: 'Low' risk. overallScore >= 50 and < 75: 'Moderate' risk. overallScore < 50: 'High' risk.
    if (overallScore >= 75) {
        riskLevel = 'Low';
        recommendation = 'Your vocal biomarkers are within a normal range. Vocal performance appears stable. Continue with regular monitoring.';
    } else if (overallScore >= 50) {
        riskLevel = 'Moderate';
        recommendation = 'Some irregularities were noted in your vocal analysis. Factors like fatigue can influence results. Consider retesting and consult a healthcare provider if you have ongoing concerns.';
    } else {
        riskLevel = 'High';
        recommendation = 'Significant irregularities detected in vocal patterns, such as monotony in pitch or volume, or unclear speech. We strongly recommend sharing these results with your healthcare provider or a neurologist.';
    }

    return {
        pitchScore: parseFloat(pitchScore.toFixed(1)),
        volumeScore: parseFloat(volumeScore.toFixed(1)),
        clarityScore: parseFloat(clarityScore.toFixed(1)),
        tremorScore: parseFloat(tremorScore.toFixed(1)),
        overallScore: parseFloat(overallScore.toFixed(1)),
        riskLevel,
        recommendation,
    };
  }
);
