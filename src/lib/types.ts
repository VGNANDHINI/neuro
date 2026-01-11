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
};

export type TestResult = {
  id: string;
  userId: string;
  testType: 'spiral' | 'voice' | 'tapping';
  testData: string; // JSON string of test raw data
  
  // Scores
  tremorScore?: number;
  smoothnessScore?: number;
  speedScore?: number;
  consistencyScore?: number;
  overallScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  recommendation?: string;
  
  // Voice specific
  pitchScore?: number;
  volumeScore?: number;
  clarityScore?: number;
  
  // Tapping specific
  tapCount?: number;
  tapsPerSecond?: number;
  rhythmScore?: number;

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
export const AnalyzeTappingInputSchema = z.object({
  tapCount: z.number().describe('The number of taps recorded during the test.'),
  duration: z.number().describe('The duration of the tapping test in seconds.'),
});
export type AnalyzeTappingInput = z.infer<typeof AnalyzeTappingInputSchema>;

export const AnalyzeTappingOutputSchema = z.object({
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
