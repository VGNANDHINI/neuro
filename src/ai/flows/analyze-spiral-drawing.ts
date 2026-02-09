'use server';
/**
 * @fileOverview Analyzes a spiral drawing to detect potential Parkinson's indicators.
 *
 * - analyzeSpiralDrawing - A function that handles the spiral drawing analysis process.
 * - AnalyzeSpiralDrawingInput - The input type for the analyzeSpiralDrawing function.
 * - AnalyzeSpiralDrawingOutput - The return type for the analyzeSpiralDrawing function.
 */

import {ai} from '@/ai/genkit';
import {
  AnalyzeSpiralDrawingInputSchema,
  AnalyzeSpiralDrawingOutputSchema,
  type AnalyzeSpiralDrawingInput,
} from '@/lib/types';
import { z } from 'zod';

export async function analyzeSpiralDrawing(input: AnalyzeSpiralDrawingInput): Promise<any> {
  return analyzeSpiralDrawingFlow(input);
}

type Point = { x: number; y: number; timestamp: number };

// All calculation functions remain as local logic
function calculateTremor(points: Point[]): number {
  if (points.length < 5) return 0;
  const velocities = [];
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i-1]; const p2 = points[i];
    const dx = p2.x - p1.x; const dy = p2.y - p1.y;
    const dt = (p2.timestamp - p1.timestamp) / 1000;
    if (dt > 0.001) { velocities.push({vx: dx/dt, vy: dy/dt}); }
  }
  if (velocities.length < 4) return 0;
  const accelerations = [];
  for(let i=1; i<velocities.length; i++) {
    const v1 = velocities[i-1]; const v2 = velocities[i];
    accelerations.push(Math.sqrt((v2.vx - v1.vx)**2 + (v2.vy-v1.vy)**2));
  }
  if (accelerations.length === 0) return 0;
  const rmsAcceleration = Math.sqrt(accelerations.reduce((a,b) => a+b*b, 0) / accelerations.length);
  return isNaN(rmsAcceleration) ? 0 : Math.min(100, rmsAcceleration / 20);
}
function calculateSmoothness(points: Point[]): number {
  if (points.length < 3) return 100;
  const jerks = [];
  for (let i = 1; i < points.length - 1; i++) {
    const v1 = { x: points[i].x - points[i-1].x, y: points[i].y - points[i-1].y };
    const v2 = { x: points[i+1].x - points[i].x, y: points[i+1].y - points[i].y };
    jerks.push(Math.sqrt((v2.x - v1.x)**2 + (v2.y - v1.y)**2));
  }
  if (jerks.length === 0) return 100;
  const avgJerk = jerks.reduce((s, j) => s + j, 0) / jerks.length;
  return Math.max(0, 100 - avgJerk * 5);
}
function calculateSpeedScore(points: Point[]): number {
    if (points.length < 2) return 0;
    const speeds = [];
    for (let i = 1; i < points.length; i++) {
        const dist = Math.sqrt((points[i].x - points[i-1].x)**2 + (points[i].y - points[i-1].y)**2);
        const time = (points[i].timestamp - points[i-1].timestamp) / 1000;
        if (time > 0) { speeds.push(dist / time); }
    }
    if (speeds.length === 0) return 0;
    const meanSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    if (meanSpeed === 0) return 0;
    const stdDev = Math.sqrt(speeds.map(x => Math.pow(x - meanSpeed, 2)).reduce((a, b) => a + b, 0) / speeds.length);
    return Math.max(0, 100 - (stdDev / meanSpeed) * 100);
}
function calculateConsistency(points: Point[]): number {
    if (points.length < 10) return 0;
    const centerX = points.reduce((s, p) => s + p.x, 0) / points.length;
    const centerY = points.reduce((s, p) => s + p.y, 0) / points.length;
    const distances = points.map(p => Math.sqrt((p.x - centerX)**2 + (p.y - centerY)**2));
    const indices = Array.from({length: distances.length}, (_, i) => i);
    const sumX = indices.reduce((a,b) => a+b, 0);
    const sumY = distances.reduce((a,b) => a+b, 0);
    const sumXY = indices.reduce((s, x, i) => s + x * distances[i], 0);
    const sumX2 = indices.reduce((s, x) => s + x*x, 0);
    const n = indices.length;
    if ((n * sumX2 - sumX * sumX) === 0) return 0;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const yMean = sumY / n;
    const ssTot = distances.reduce((s, y) => s + (y-yMean)**2, 0);
    if (ssTot === 0) return 100;
    const ssRes = distances.reduce((s, y, i) => s + (y - (slope * i))**2, 0);
    return Math.max(0, (1 - (ssRes / ssTot)) * 100);
}

// Schema for the data passed to the recommendation prompt
const SpiralAnalysisForRecSchema = AnalyzeSpiralDrawingOutputSchema.omit({ recommendation: true });

// Prompt to generate only the recommendation
const recommendationPrompt = ai.definePrompt({
  name: 'generateSpiralRecommendation',
  input: { schema: SpiralAnalysisForRecSchema },
  output: { schema: z.object({ recommendation: z.string() }) },
  prompt: `You are a clinical data analyst. Based on the following spiral drawing test results, provide a concise, user-friendly recommendation.
  - Tremor Score: {{tremorScore}} (higher is worse)
  - Smoothness Score: {{smoothnessScore}}/100
  - Speed Score: {{speedScore}}/100
  - Consistency Score: {{consistencyScore}}/100
  - Overall Score: {{overallScore}}/100
  - Risk Level: {{riskLevel}}

  If the risk is High, strongly recommend seeing a neurologist.
  If Moderate, suggest retesting and consulting a healthcare provider if concerned.
  If Low, recommend continued regular monitoring.
  
  Return your response as a valid JSON object with a single "recommendation" key.`,
});


const analyzeSpiralDrawingFlow = ai.defineFlow(
  {
    name: 'analyzeSpiralDrawingFlow',
    inputSchema: AnalyzeSpiralDrawingInputSchema,
    outputSchema: AnalyzeSpiralDrawingOutputSchema,
  },
  async (input) => {
    const points: Point[] = JSON.parse(input.points);

    if (points.length < 50) {
        return {
            tremorScore: 0, smoothnessScore: 0, speedScore: 0, consistencyScore: 0, overallScore: 0,
            riskLevel: 'Low',
            recommendation: 'Not enough drawing data to perform an analysis. Please trace the spiral more completely.'
        };
    }
    
    const tremorScore = calculateTremor(points);
    const smoothnessScore = calculateSmoothness(points);
    const speedScore = calculateSpeedScore(points);
    const consistencyScore = calculateConsistency(points);

    const overallScore = (100 - tremorScore) * 0.25 + smoothnessScore * 0.30 + speedScore * 0.20 + consistencyScore * 0.25;
    
    let riskLevel: 'Low' | 'Moderate' | 'High';
    if (overallScore < 50) {
        riskLevel = 'High';
    } else if (overallScore < 75) {
        riskLevel = 'Moderate';
    } else {
        riskLevel = 'Low';
    }

    const analysisResult = {
        tremorScore: parseFloat(tremorScore.toFixed(1)),
        smoothnessScore: parseFloat(smoothnessScore.toFixed(1)),
        speedScore: parseFloat(speedScore.toFixed(1)),
        consistencyScore: parseFloat(consistencyScore.toFixed(1)),
        overallScore: parseFloat(overallScore.toFixed(1)),
        riskLevel,
    };

    // Generate recommendation using AI
    const { output } = await recommendationPrompt(analysisResult);
    if (!output) {
      throw new Error("AI failed to generate a recommendation.");
    }

    return {
        ...analysisResult,
        recommendation: output.recommendation,
    };
  }
);
