import type { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export type AppUser = {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  phone?: string;
  location?: string;
  createdAt: Timestamp;
  lastLogin?: Timestamp;
  photoURL?: string;
};

export type TestResult = {
  id: string;
  userId: string;
  testType: 'spiral' | 'voice' | 'tapping';
  testData: string; // JSON string of test raw data
  
  // Common Scores
  overallScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  recommendation?: string;
  
  // Spiral specific
  tremorScore?: number;
  smoothnessScore?: number;
  
  // Voice specific
  pitchScore?: number;
  volumeScore?: number;
  clarityScore?: number;
  
  // Tapping specific
  tapCount?: number;
  tapsPerSecond?: number;
  speedScore?: number;
  consistencyScore?: number;
  rhythmScore?: number;
  fatigueScore?: number;
  
  createdAt: Timestamp;
};

// AI Flow Schemas

// Spiral Test
export const AnalyzeSpiralDrawingInputSchema = z.object({
  points: z
    .string()
    .describe(
      'A JSON string containing an array of points, each with x, y coordinates, and timestamp.'
    ),
});
export type AnalyzeSpiralDrawingInput = z.infer<typeof AnalyzeSpiralDrawingInputSchema>;

export const AnalyzeSpiralDrawingOutputSchema = z.object({
  tremorScore: z
    .number()
    .describe('A score indicating the level of tremor detected in the drawing (0-100, higher is worse).'),
  smoothnessScore: z.number().describe('A score indicating the smoothness of the drawing (0-100, higher is better).'),
  speedScore: z.number().describe('A score indicating the consistency of the drawing speed (0-100, higher is better).'),
  consistencyScore: z
    .number()
    .describe('A score indicating how consistently the spiral expands (0-100, higher is better).'),
  overallScore: z.number().describe('An overall score indicating the quality of the drawing (0-100, higher is better).'),
  riskLevel: z
    .enum(['Low', 'Moderate', 'High'])
    .describe('The risk level based on the analysis.'),
  recommendation: z
    .string()
    .describe('A recommendation based on the risk level, e.g., consult a neurologist.'),
});
export type AnalyzeSpiralDrawingOutput = z.infer<typeof AnalyzeSpiralDrawingOutputSchema>;


// Voice Test
export const AnalyzeVoiceRecordingInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A voice recording as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeVoiceRecordingInput = z.infer<typeof AnalyzeVoiceRecordingInputSchema>;

export const AnalyzeVoiceRecordingOutputSchema = z.object({
  pitch_score: z.number().describe('The pitch score of the voice recording.'),
  volume_score: z.number().describe('The volume score of the voice recording.'),
  clarity_score: z.number().describe('The clarity score of the voice recording.'),
  tremor_score: z.number().describe('The tremor score of the voice recording.'),
  overall_score: z.number().describe('The overall score of the voice recording.'),
  risk_level: z
    .string()
    .describe("The risk level of the voice recording ('Low', 'Moderate', or 'High')."),
  recommendation: z.string().describe('A recommendation based on the risk level.'),
});
export type AnalyzeVoiceRecordingOutput = z.infer<typeof AnalyzeVoiceRecordingOutputSchema>;

// Tapping Test
export const AnalyzeTappingPatternsInputSchema = z.object({
  tapTimestamps: z.array(z.number()).describe('An array of tap timestamps in milliseconds.'),
  duration: z.number().describe('The total duration of the test in seconds.'),
});
export type AnalyzeTappingPatternsInput = z.infer<typeof AnalyzeTappingPatternsInputSchema>;

export const AnalyzeTappingPatternsOutputSchema = z.object({
    tapCount: z.number().describe('Total number of taps recorded.'),
    tapsPerSecond: z.number().describe('Average number of taps per second.'),
    speedScore: z.number().describe('Score based on the tapping speed (0-100).'),
    consistencyScore: z.number().describe('Score based on the consistency of inter-tap intervals (0-100).'),
    rhythmScore: z.number().describe('Score based on the rhythmic regularity of taps (0-100).'),
    fatigueScore: z.number().describe('Score indicating resistance to fatigue during the test (0-100).'),
    overallScore: z.number().describe('A weighted overall score of motor performance (0-100).'),
    riskLevel: z.enum(['Low', 'Moderate', 'High']).describe('The assessed risk level.'),
    recommendation: z.string().describe('A textual recommendation for the user based on the results.'),
});
export type AnalyzeTappingPatternsOutput = z.infer<typeof AnalyzeTappingPatternsOutputSchema>;
