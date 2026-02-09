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


// AI is used for qualitative analysis (its strength)
const VoiceAnalysisQualitativeSchema = z.object({
  pitch: z.enum(['monopitch', 'varied', 'natural']),
  volume: z.enum(['monoloudness', 'trailing_off', 'consistent']),
  clarity: z.enum(['slurred', 'imprecise', 'crisp']),
  tremor: z.enum(['none', 'slight', 'moderate', 'significant']),
});

const analyzeVoiceQualitativePrompt = ai.definePrompt({
  name: 'analyzeVoiceQualitativePrompt',
  input: {schema: AnalyzeVoiceRecordingInputSchema},
  output: {schema: VoiceAnalysisQualitativeSchema},
  prompt: `You are an expert in analyzing voice recordings for potential vocal biomarkers of Parkinson's disease.
Analyze the provided voice recording and classify its characteristics based on the provided schema.
- **pitch**: Is the pitch flat and monotonous (monopitch), or does it have natural variation?
- **volume**: Is the volume consistent, or does it trail off or sound flat (monoloudness)?
- **clarity**: Is the articulation crisp and clear, or is it imprecise or slurred?
- **tremor**: Is there evidence of shakiness or tremor in the voice?
Return your analysis in the structured JSON format.
Voice Recording: {{media url=audioDataUri}}`,
});

// Local logic maps qualitative AI output to quantitative scores
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

// A second AI prompt generates the recommendation based on the calculated scores
const VoiceAnalysisForRecSchema = AnalyzeVoiceRecordingOutputSchema.omit({ recommendation: true });
const recommendationPrompt = ai.definePrompt({
    name: 'generateVoiceRecommendation',
    input: { schema: VoiceAnalysisForRecSchema },
    output: { schema: z.object({ recommendation: z.string() }) },
    prompt: `You are a clinical data analyst. Based on the following voice analysis results, provide a concise, user-friendly recommendation.
    - Pitch Score: {{pitchScore}}/100
    - Volume Score: {{volumeScore}}/100
    - Clarity Score: {{clarityScore}}/100
    - Tremor Score: {{tremorScore}} (higher is worse)
    - Overall Score: {{overallScore}}/100
    - Risk Level: {{riskLevel}}

    If the risk is High, strongly recommend sharing results with a healthcare provider or neurologist.
    If Moderate, suggest monitoring and considering a consultation if concerned.
    If Low, recommend continued regular monitoring.
    Provide only the recommendation text.`,
});


const analyzeVoiceRecordingFlow = ai.defineFlow(
  {
    name: 'analyzeVoiceRecordingFlow',
    inputSchema: AnalyzeVoiceRecordingInputSchema,
    outputSchema: AnalyzeVoiceRecordingOutputSchema,
  },
  async input => {
    // 1. Get qualitative analysis from AI
    const { output: qualitativeAnalysis } = await analyzeVoiceQualitativePrompt(input);
    if (!qualitativeAnalysis) {
      throw new Error('The AI model did not return a valid qualitative analysis.');
    }
    
    // 2. Map qualitative analysis to scores using local logic
    const scores = mapQualitativeToScores(qualitativeAnalysis);
    const { pitchScore, volumeScore, clarityScore, tremorScore } = scores;

    // 3. Calculate overall score and risk level using local logic
    const overallScore = clarityScore * 0.4 + volumeScore * 0.25 + pitchScore * 0.2 + (100 - tremorScore) * 0.15;

    let riskLevel: 'Low' | 'Moderate' | 'High';
    if (overallScore < 50) {
        riskLevel = 'High';
    } else if (overallScore >= 50 && overallScore < 75) {
        riskLevel = 'Moderate';
    } else {
        riskLevel = 'Low';
    }

    const analysisResult = {
        pitchScore: parseFloat(pitchScore.toFixed(1)),
        volumeScore: parseFloat(volumeScore.toFixed(1)),
        clarityScore: parseFloat(clarityScore.toFixed(1)),
        tremorScore: parseFloat(tremorScore.toFixed(1)),
        overallScore: parseFloat(overallScore.toFixed(1)),
        riskLevel,
    };

    // 4. Call AI again, but only to generate the recommendation text
    const { output: recOutput } = await recommendationPrompt(analysisResult);
    if (!recOutput) {
        throw new Error('AI failed to generate a recommendation.');
    }

    return {
        ...analysisResult,
        recommendation: recOutput.recommendation,
    };
  }
);
