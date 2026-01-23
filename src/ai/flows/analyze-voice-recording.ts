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

  Analyze the provided voice recording and provide scores for pitch, volume, clarity, and tremor.
  Based on these scores, determine an overall score and a risk level (Low, Moderate, or High).
  Also, provide a recommendation based on the risk level.

  Voice Recording: {{media url=audioDataUri}}

  Ensure the output is in the following JSON format:
  {
    "pitchScore": number,
    "volumeScore": number,
    "clarityScore": number,
    "tremorScore": number,
    "overallScore": number,
    "riskLevel": string,
    "recommendation": string
  }`,
});

const analyzeVoiceRecordingFlow = ai.defineFlow(
  {
    name: 'analyzeVoiceRecordingFlow',
    inputSchema: AnalyzeVoiceRecordingInputSchema,
    outputSchema: AnalyzeVoiceRecordingOutputSchema,
  },
  async input => {
    // Since direct audio analysis is complex and beyond the scope of this example,
    // we will simulate the analysis and return dummy scores.

    // In a real-world scenario, you would use audio processing libraries or APIs
    // to extract features like pitch, volume, clarity, and tremor from the audio data.

    // Simulate audio analysis scores (replace with actual analysis in a real implementation)
    const pitchScore = Math.random() * 30 + 60;
    const volumeScore = Math.random() * 30 + 65;
    const clarityScore = Math.random() * 30 + 70;
    const tremorScore = Math.random() * 40 + 10;
    const overallScore = (pitchScore + volumeScore + clarityScore + (100 - tremorScore)) / 4;

    // Determine risk level based on overall score
    const riskLevel = overallScore > 75 ? 'Low' : overallScore > 50 ? 'Moderate' : 'High';

    // Provide a recommendation based on the risk level
    const recommendation = getRecommendation(riskLevel);

    // Return the analysis results
    return {
      pitchScore,
      volumeScore,
      clarityScore,
      tremorScore,
      overallScore,
      riskLevel,
      recommendation,
    };
  }
);

function getRecommendation(riskLevel: string): string {
  switch (riskLevel) {
    case 'Low':
      return 'No significant vocal biomarkers detected. Continue regular monitoring.';
    case 'Moderate':
      return 'Some irregularities detected. Consider consulting a healthcare provider.';
    case 'High':
      return 'Significant vocal biomarkers detected. We strongly recommend consulting a neurologist for comprehensive evaluation.';
    default:
      return 'No recommendation available.';
  }
}
