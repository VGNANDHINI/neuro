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
import { analyzeTapping } from '@/ai/flows/analyze-tapping-patterns';
import { auth } from 'firebase-admin';
import { headers } from 'next/headers';

async function getUserIdFromSession(): Promise<string | null> {
    try {
        const authHeader = headers().get('Authorization');
        if (!authHeader) return null;
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await auth().verifyIdToken(idToken);
        return decodedToken.uid;
    } catch (error) {
        console.error("Error verifying token:", error);
        return null;
    }
}


// USER DATA
export async function getAppUser(): Promise<AppUser | null> {
  const userId = await getUserIdFromSession();
  if (!userId) return null;

  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() } as AppUser;
  }
  return null;
}

export async function updateUserProfile(data: Partial<AppUser>) {
  const userId = await getUserIdFromSession();
  if (!userId) return { error: 'Authentication required.' };
  
  try {
    await updateDoc(doc(db, 'users', userId), data);
    return { success: 'Profile updated successfully.' };
  } catch (error) {
    return { error: 'Failed to update profile.' };
  }
}

// TEST ANALYSIS AND STORAGE
export async function analyzeAndSaveSpiralTest(points: { x: number; y: number; timestamp: number }[]) {
  const userId = await getUserIdFromSession();
  if (!userId) return { error: 'Authentication required.' };
  
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

export async function analyzeAndSaveVoiceTest(audioDataUri: string) {
    const userId = await getUserIdFromSession();
    if (!userId) return { error: 'Authentication required.' };
    
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

export async function analyzeAndSaveTappingTest(tapCount: number, duration: number) {
    const userId = await getUserIdFromSession();
    if (!userId) return { error: 'Authentication required.' };

    try {
      const result = await analyzeTapping({ tapCount, duration });
  
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
export async function getDashboardStats() {
  const userId = await getUserIdFromSession();
  if (!userId) return null;
  
  const testsQuery = query(collection(db, 'tests'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const testsSnapshot = await getDocs(testsQuery);
  const tests = testsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TestResult[];

  const totalTests = tests.length;
  const recentTests = tests.slice(0, 5).map(t => ({...t, createdAt: (t.createdAt as any).toDate().toISOString()}));
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

export async function getAllTests(): Promise<TestResult[]> {
  const userId = await getUserIdFromSession();
  if (!userId) return [];
  
  const testsQuery = query(collection(db, 'tests'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const testsSnapshot = await getDocs(testsQuery);
  return testsSnapshot.docs.map(doc => {
      const data = doc.data() as TestResult;
      return { ...data, id: doc.id, createdAt: (data.createdAt as any).toDate().toISOString() } as TestResult;
  });
}

export async function getTestDetails(testId: string): Promise<TestResult | null> {
  const userId = await getUserIdFromSession();
  if (!userId) return null;

  const testDoc = await getDoc(doc(db, 'tests', testId));
  if (!testDoc.exists()) {
    return null;
  }
  const testData = testDoc.data() as TestResult;

  if (testData.userId !== userId) {
    return null; // Don't allow access to other users' tests
  }

  return { ...testData, id: testDoc.id, createdAt: (testData.createdAt as any).toDate().toISOString() } as TestResult;
}

export async function getProgressData(timeframe: string) {
  const userId = await getUserIdFromSession();
  if (!userId) return null;
  
  const days = parseInt(timeframe, 10);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const testsQuery = query(
      collection(db, 'tests'), 
      where('userId', '==', userId),
      where('createdAt', '>=', startDate), 
      orderBy('createdAt', 'asc')
  );
  const testsSnapshot = await getDocs(testsQuery);
  const tests = testsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TestResult[];
  
  // Group by date and average scores if multiple tests on same day
  const dailyProgress: { [key: string]: { date: string; spiral?: number; voice?: number; tapping?: number, count: number } } = {};

  tests.forEach(test => {
    const dateKey = (test.createdAt as any).toDate().toISOString().split('T')[0];
    if (!dailyProgress[dateKey]) {
      dailyProgress[dateKey] = { date: dateKey, count: 0 };
    }
    
    if (!dailyProgress[dateKey][test.testType]) {
        dailyProgress[dateKey][test.testType] = test.overallScore;
    } else {
        // Average if multiple tests of the same type on the same day
        dailyProgress[dateKey][test.testType] = (dailyProgress[dateKey][test.testType] + test.overallScore) / 2;
    }
  });

  const formattedProgress = Object.values(dailyProgress).map(day => ({
    ...day,
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  const allScores = tests.map(t => t.overallScore);
  const average = allScores.length > 0 ? allScores.reduce((acc, t) => acc + t, 0) / allScores.length : 0;
  
  const previousPeriodStartDate = new Date();
  previousPeriodStartDate.setDate(previousPeriodStartDate.getDate() - days * 2);
  const previousPeriodQuery = query(
      collection(db, 'tests'),
      where('userId', '==', userId),
      where('createdAt', '>=', previousPeriodStartDate),
      where('createdAt', '<', startDate)
  );
  const previousSnapshot = await getDocs(previousPeriodQuery);
  const previousScores = previousSnapshot.docs.map(doc => doc.data().overallScore as number);
  const previousAverage = previousScores.length > 0 ? previousScores.reduce((a,b) => a+b, 0) / previousScores.length : 0;
  const trend = previousAverage > 0 ? ((average - previousAverage) / previousAverage) * 100 : 0;


  return {
    progress: formattedProgress,
    stats: {
        total: tests.length,
        average: average,
        trend: trend,
    }
  };
}
