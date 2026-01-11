import type { Timestamp } from 'firebase/firestore';

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
