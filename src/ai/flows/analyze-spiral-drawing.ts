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

export async function analyzeSpiralDrawing(input: AnalyzeSpiralDrawingInput): Promise<any> {
  return analyzeSpiralDrawingFlow(input);
}

type Point = { x: number; y: number; timestamp: number };

function calculateTremor(points: Point[]): number {
  if (points.length < 5) return 0;
  
  const velocities = [];
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i-1];
    const p2 = points[i];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dt = (p2.timestamp - p1.timestamp) / 1000; // in seconds
    if (dt > 0.001) { // Added a threshold to prevent division by very small numbers
      velocities.push({vx: dx/dt, vy: dy/dt});
    }
  }

  if (velocities.length < 4) return 0;

  const accelerations = [];
  for(let i=1; i<velocities.length; i++) {
      const v1 = velocities[i-1];
      const v2 = velocities[i];
      accelerations.push(Math.sqrt((v2.vx - v1.vx)**2 + (v2.vy-v1.vy)**2));
  }

  if (accelerations.length === 0) return 0;
  
  const rmsAcceleration = Math.sqrt(accelerations.reduce((a,b) => a+b*b, 0) / accelerations.length);
  if (isNaN(rmsAcceleration)) return 0;
  
  const tremor = Math.min(100, rmsAcceleration / 20);
  return tremor;
}

function calculateSmoothness(points: Point[]): number {
  if (points.length < 3) return 100;
  
  const jerks = [];
  for (let i = 1; i < points.length - 1; i++) {
    const p1 = points[i-1];
    const p2 = points[i];
    const p3 = points[i+1];
    
    const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    
    const a = { x: v2.x - v1.x, y: v2.y - v1.y };
    jerks.push(Math.sqrt(a.x**2 + a.y**2));
  }
  
  if (jerks.length === 0) return 100;

  const avgJerk = jerks.reduce((sum, j) => sum + j, 0) / jerks.length;
  const smoothness = Math.max(0, 100 - avgJerk * 5); // Scale factor
  return smoothness;
}

function calculateSpeedScore(points: Point[]): number {
    if (points.length < 2) return 0;
    
    const speeds = [];
    for (let i = 1; i < points.length; i++) {
        const p1 = points[i-1];
        const p2 = points[i];
        const dist = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);
        const time = (p2.timestamp - p1.timestamp) / 1000;
        if (time > 0) {
            speeds.push(dist / time);
        }
    }

    if (speeds.length === 0) return 0;

    const meanSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    if (meanSpeed === 0) return 0;
    const stdDev = Math.sqrt(speeds.map(x => Math.pow(x - meanSpeed, 2)).reduce((a, b) => a + b, 0) / speeds.length);
    
    const cv = stdDev / meanSpeed; // Coefficient of Variation
    const speedScore = Math.max(0, 100 - cv * 100); // Higher CV means lower score
    return speedScore;
}

function calculateConsistency(points: Point[]): number {
    if (points.length < 10) return 0;
    
    const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    
    const distances = points.map(p => Math.sqrt((p.x - centerX)**2 + (p.y - centerY)**2));
    
    // Check for linear increase in distance from center
    const indices = Array.from({length: distances.length}, (_, i) => i);
    
    // Simple linear regression
    const sumX = indices.reduce((a,b) => a+b, 0);
    const sumY = distances.reduce((a,b) => a+b, 0);
    const sumXY = indices.reduce((s, x, i) => s + x * distances[i], 0);
    const sumX2 = indices.reduce((s, x) => s + x*x, 0);
    const n = indices.length;

    const denominator = (n * sumX2 - sumX * sumX);
    if (denominator === 0) return 0;
    const slope = (n * sumXY - sumX * sumY) / denominator;
    
    // R-squared - simplified
    const yMean = sumY / n;
    const ssTot = distances.reduce((s, y) => s + (y-yMean)**2, 0);
    if (ssTot === 0) return 100;
    const ssRes = distances.reduce((s, y, i) => s + (y - (slope * i))**2, 0);

    const rSquared = 1 - (ssRes / ssTot);

    return Math.max(0, rSquared * 100);
}

const analyzeSpiralDrawingFlow = ai.defineFlow(
  {
    name: 'analyzeSpiralDrawingFlow',
    inputSchema: AnalyzeSpiralDrawingInputSchema,
    outputSchema: AnalyzeSpiralDrawingOutputSchema,
  },
  async (input) => {
    const points: Point[] = JSON.parse(input.points);

    if (points.length < 50) {
        // Return a default "not enough data" response
        return {
            tremorScore: 0,
            smoothnessScore: 0,
            speedScore: 0,
            consistencyScore: 0,
            overallScore: 0,
            riskLevel: 'Low',
            recommendation: 'Not enough drawing data to perform an analysis. Please try to trace the spiral more completely.'
        };
    }
    
    const tremorScore = calculateTremor(points);
    const smoothnessScore = calculateSmoothness(points);
    const speedScore = calculateSpeedScore(points);
    const consistencyScore = calculateConsistency(points);

    // Weighted average. Higher is better.
    const overallScore = 
        (100 - tremorScore) * 0.25 + // Tremor is bad, so we invert it
        smoothnessScore * 0.30 +
        speedScore * 0.20 +
        consistencyScore * 0.25;
    
    let riskLevel: 'Low' | 'Moderate' | 'High';
    let recommendation: string;

    if (overallScore >= 75) {
        riskLevel = 'Low';
        recommendation = 'No significant irregularities detected. Your motor control appears stable. Continue regular monitoring.';
    } else if (overallScore >= 50) {
        riskLevel = 'Moderate';
        recommendation = 'Some irregularities detected. This may be due to various factors. Consider retesting and consult a healthcare provider if you have concerns.';
    } else {
        riskLevel = 'High';
        recommendation = 'Significant irregularities detected in motor control. We strongly recommend scheduling an appointment with a neurologist for a comprehensive evaluation.';
    }

    return {
        tremorScore: parseFloat(tremorScore.toFixed(1)),
        smoothnessScore: parseFloat(smoothnessScore.toFixed(1)),
        speedScore: parseFloat(speedScore.toFixed(1)),
        consistencyScore: parseFloat(consistencyScore.toFixed(1)),
        overallScore: parseFloat(overallScore.toFixed(1)),
        riskLevel,
        recommendation,
    };
  }
);
