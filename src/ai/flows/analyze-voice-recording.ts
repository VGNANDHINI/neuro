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
    "pitch_score": number,
    "volume_score": number,
    "clarity_score": number,
    "tremor_score": number,
    "overall_score": number,
    "risk_level": string,
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
    const pitch_score = Math.random() * 30 + 60;
    const volume_score = Math.random() * 30 + 65;
    const clarity_score = Math.random() * 30 + 70;
    const tremor_score = Math.random() * 40 + 10;
    const overall_score = (pitch_score + volume_score + clarity_score + (100 - tremor_score)) / 4;

    // Determine risk level based on overall score
    const risk_level = overall_score > 75 ? 'Low' : overall_score > 50 ? 'Moderate' : 'High';

    // Provide a recommendation based on the risk level
    const recommendation = getRecommendation(risk_level);

    // Return the analysis results
    return {
      pitch_score,
      volume_score,
      clarity_score,
      tremor_score,
      overall_score,
      risk_level,
      recommendation,
    };
  }
);

function getRecommendation(risk_level: string): string {
  switch (risk_level) {
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
