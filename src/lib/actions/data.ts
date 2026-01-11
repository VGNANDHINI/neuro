'use server';

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppUser, TestResult } from '@/lib/types';
import { analyzeSpiralDrawing } from '@/ai/flows/analyze-spiral-drawing';
import { analyzeVoiceRecording } from '@/ai/flows/analyze-voice-recording';
import { analyzeTappingPatterns } from '@/ai/flows/analyze-tapping-patterns';

// USER DATA
export async function getAppUser(userId: string): Promise<AppUser | null> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() } as AppUser;
  }
  return null;
}

export async function updateUserProfile(userId: string, data: Partial<AppUser>) {
  try {
    await updateDoc(doc(db, 'users', userId), data);
    return { success: 'Profile updated successfully.' };
  } catch (error) {
    return { error: 'Failed to update profile.' };
  }
}

// TEST ANALYSIS AND STORAGE
export async function analyzeAndSaveSpiralTest(userId: string, points: { x: number; y: number; timestamp: number }[]) {
  try {
    const result = await analyzeSpiralDrawing({ points: JSON.stringify(points) });
    
    const testResult: Omit<TestResult, 'id'> = {
      userId,
      testType: 'spiral',
      testData: JSON.stringify(points),
      tremorScore: result.tremorScore,
      smoothnessScore: result.smoothnessScore,
      speedScore: result.speedScore,
      consistencyScore: result.consistencyScore,
      overallScore: result.overallScore,
      riskLevel: result.riskLevel,
      recommendation: result.recommendation,
      createdAt: serverTimestamp() as Timestamp,
    };

    const docRef = await addDoc(collection(db, 'tests'), testResult);
    return { id: docRef.id, ...result };
  } catch (error) {
    console.error('Spiral test analysis failed:', error);
    return { error: 'Analysis failed.' };
  }
}

export async function analyzeAndSaveVoiceTest(userId: string, audioDataUri: string) {
    try {
      const result = await analyzeVoiceRecording({ audioDataUri });
      
      const testResult: Omit<TestResult, 'id'> = {
        userId,
        testType: 'voice',
        testData: audioDataUri.substring(0, 30) + '...', // Don't store the whole blob
        pitchScore: result.pitch_score,
        volumeScore: result.volume_score,
        clarityScore: result.clarity_score,
        tremorScore: result.tremor_score,
        overallScore: result.overall_score,
        riskLevel: result.risk_level as 'Low' | 'Moderate' | 'High',
        recommendation: result.recommendation,
        createdAt: serverTimestamp() as Timestamp,
      };
  
      const docRef = await addDoc(collection(db, 'tests'), testResult);
      return { id: docRef.id, ...result };
    } catch (error) {
      console.error('Voice test analysis failed:', error);
      return { error: 'Analysis failed.' };
    }
}

export async function analyzeAndSaveTappingTest(userId: string, tapCount: number, duration: number) {
    try {
      const result = await analyzeTappingPatterns({ tapCount, duration });
  
      const testResult: Omit<TestResult, 'id'> = {
        userId,
        testType: 'tapping',
        testData: JSON.stringify({ tapCount, duration }),
        tapCount,
        tapsPerSecond: result.tapsPerSecond,
        speedScore: result.speedScore,
        consistencyScore: result.consistencyScore,
        rhythmScore: result.rhythmScore,
        overallScore: result.overallScore,
        riskLevel: result.riskLevel as 'Low' | 'Moderate' | 'High',
        recommendation: result.recommendation,
        createdAt: serverTimestamp() as Timestamp,
      };
  
      const docRef = await addDoc(collection(db, 'tests'), testResult);
      return { id: docRef.id, ...result };
    } catch (error) {
      console.error('Tapping test analysis failed:', error);
      return { error: 'Analysis failed.' };
    }
  }


// DATA FETCHING
export async function getDashboardStats(userId: string) {
  const testsQuery = query(collection(db, 'tests'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const testsSnapshot = await getDocs(testsQuery);
  const tests = testsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TestResult[];

  const totalTests = tests.length;
  const recentTests = tests.slice(0, 5);
  const allScores = tests.map(t => t.overallScore);
  const averageScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
  
  const testsByType = {
    spiral: tests.filter(t => t.testType === 'spiral').length,
    voice: tests.filter(t => t.testType === 'voice').length,
    tapping: tests.filter(t => t.testType === 'tapping').length,
  };
  
  const latestTest = tests[0] ?? null;
  const currentRisk = latestTest?.riskLevel || 'N/A';

  return {
    totalTests,
    averageScore,
    currentRisk,
    recentTests,
    testsByType,
  };
}

export async function getAllTests(userId: string) {
  const testsQuery = query(collection(db, 'tests'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const testsSnapshot = await getDocs(testsQuery);
  return testsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TestResult[];
}

export async function getTestDetails(testId: string) {
  const testDoc = await getDoc(doc(db, 'tests', testId));
  if (!testDoc.exists()) {
    return null;
  }
  return { id: testDoc.id, ...testDoc.data() } as TestResult;
}

export async function getProgressData(userId: string) {
  const testsQuery = query(collection(db, 'tests'), where('userId', '==', userId), orderBy('createdAt', 'asc'));
  const testsSnapshot = await getDocs(testsQuery);
  const tests = testsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TestResult[];
  
  const progress = tests.map(test => ({
    date: (test.createdAt.toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    overallScore: test.overallScore,
    testType: test.testType,
  }));
  
  // Group by date and average scores if multiple tests on same day
  const dailyProgress: { [key: string]: { date: string; spiral?: number; voice?: number; tapping?: number } } = {};

  tests.forEach(test => {
    const dateKey = test.createdAt.toDate().toISOString().split('T')[0];
    if (!dailyProgress[dateKey]) {
      dailyProgress[dateKey] = { date: dateKey };
    }
    dailyProgress[dateKey][test.testType] = test.overallScore;
  });

  const formattedProgress = Object.values(dailyProgress).map(day => ({
    ...day,
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  })).slice(-30); // Last 30 days of tests

  return {
    progress: formattedProgress,
    stats: {
        total: tests.length,
        average: tests.length > 0 ? tests.reduce((acc, t) => acc + t.overallScore, 0) / tests.length : 0,
    }
  };
}
