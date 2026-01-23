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

export async function analyzeVoiceRecording(
  input: AnalyzeVoiceRecordingInput
): Promise<any> {
  return analyzeVoiceRecordingFlow(input);
}

const analyzeVoiceRecordingPrompt = ai.definePrompt({
  name: 'analyzeVoiceRecordingPrompt',
  input: {schema: AnalyzeVoiceRecordingInputSchema},
  output: {schema: AnalyzeVoiceRecordingOutputSchema},
  prompt: `You are an expert in analyzing voice recordings for potential vocal biomarkers of Parkinson's disease.
The user has recorded themselves saying "The quick brown fox jumps over the lazy dog."
Analyze the provided voice recording of this phrase.

You will assess the following vocal characteristics on a scale of 0-100.
- **pitchScore**: Evaluate for monopitch. A varied and natural pitch gets a high score (closer to 100). A flat, monotonous pitch gets a low score.
- **volumeScore**: Evaluate for monoloudness. Consistent, clear volume gets a high score (closer to 100). Trailing off or inconsistent volume gets a low score.
- **clarityScore**: Evaluate for slurred or imprecise speech. Crisp, clear articulation gets a high score (closer to 100). Mumbled or slurred words get a low score.
- **tremorScore**: This score measures the amount of tremor, where a higher score means more tremor is detected. A score of 0 is a perfectly steady voice.

Based on these individual scores, you must also calculate a weighted **overallScore**. The weights are: clarityScore (40%), volumeScore (25%), pitchScore (20%), and Steadiness (100 - tremorScore) (15%).

Finally, determine a **riskLevel** and provide a **recommendation** based on the overall score:
- **overallScore >= 75**: 'Low' risk. Recommendation should be encouraging and suggest regular monitoring.
- **overallScore >= 50 and < 75**: 'Moderate' risk. Recommendation should suggest re-testing and consulting a provider if concerned.
- **overallScore < 50**: 'High' risk. Recommendation should strongly advise consulting a neurologist.

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
    const { output } = await analyzeVoiceRecordingPrompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid analysis.');
    }
    return output;
  }
);
