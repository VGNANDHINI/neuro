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


// NEW: A more robust schema for qualitative analysis by the AI
const VoiceAnalysisQualitativeSchema = z.object({
  pitch: z.enum(['monopitch', 'varied', 'natural']).describe('Assessment of pitch variation. Monopitch is a key indicator.'),
  volume: z.enum(['monoloudness', 'trailing_off', 'consistent']).describe('Assessment of volume consistency. Monoloudness or fading volume are key indicators.'),
  clarity: z.enum(['slurred', 'imprecise', 'crisp']).describe('Assessment of speech articulation and clarity.'),
  tremor: z.enum(['none', 'slight', 'moderate', 'significant']).describe('Assessment of the presence of vocal tremor.'),
});

// NEW: A prompt that asks for classification, which is more reliable for LLMs.
const analyzeVoiceQualitativePrompt = ai.definePrompt({
  name: 'analyzeVoiceQualitativePrompt',
  input: {schema: AnalyzeVoiceRecordingInputSchema},
  output: {schema: VoiceAnalysisQualitativeSchema},
  prompt: `You are an expert in analyzing voice recordings for potential vocal biomarkers of Parkinson's disease.
The user has recorded themselves saying "The quick brown fox jumps over the lazy dog."
Analyze the provided voice recording and classify its characteristics based on the provided schema.

- **pitch**: Is the pitch flat and monotonous (monopitch), or does it have natural variation?
- **volume**: Is the volume consistent, or does it trail off or sound flat (monoloudness)?
- **clarity**: Is the articulation crisp and clear, or is it imprecise or slurred?
- **tremor**: Is there evidence of shakiness or tremor in the voice?

Return your analysis in the structured JSON format.

Voice Recording: {{media url=audioDataUri}}
`,
});

// NEW: Function to map qualitative AI output to quantitative scores.
function mapQualitativeToScores(qualitative: z.infer<typeof VoiceAnalysisQualitativeSchema>) {
    const pitchMap = { monopitch: 20, varied: 70, natural: 95 };
    const volumeMap = { monoloudness: 25, trailing_off: 50, consistent: 95 };
    const clarityMap = { slurred: 20, imprecise: 60, crisp: 95 };
    const tremorMap = { none: 5, slight: 30, moderate: 65, significant: 90 }; // higher is worse

    return {
        pitchScore: pitchMap[qualitative.pitch],
        volumeScore: volumeMap[qualitative.volume],
        clarityScore: clarityMap[qualitative.clarity],
        tremorScore: tremorMap[qualitative.tremor],
    };
}

const analyzeVoiceRecordingFlow = ai.defineFlow(
  {
    name: 'analyzeVoiceRecordingFlow',
    inputSchema: AnalyzeVoiceRecordingInputSchema,
    outputSchema: AnalyzeVoiceRecordingOutputSchema,
  },
  async input => {
    // UPDATED: Call the new, more reliable prompt.
    const { output: qualitativeAnalysis } = await analyzeVoiceQualitativePrompt(input);
    if (!qualitativeAnalysis) {
      throw new Error('The AI model did not return a valid qualitative analysis.');
    }
    
    // NEW: Map the qualitative analysis to scores.
    const scores = mapQualitativeToScores(qualitativeAnalysis);
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
