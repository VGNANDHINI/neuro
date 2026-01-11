
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
import { 
    AnalyzeSpiralDrawingOutputSchema, 
    AnalyzeVoiceRecordingOutputSchema,
    AnalyzeTappingPatternsOutputSchema,
} from '@/lib/types';

// USER DATA
export async function getAppUser(userId: string): Promise<AppUser | null> {
  if (!userId) return null;

  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() } as AppUser;
  }
  return null;
}

export async function updateUserProfile(userId: string, data: Partial<AppUser>) {
  if (!userId) return { error: 'Authentication required.' };
  
  try {
    await updateDoc(doc(db, 'users', userId), data);
    return { success: 'Profile updated successfully.' };
  } catch (error) {
    return { error: 'Failed to update profile.' };
  }
}

// TEST ANALYSIS AND STORAGE
export async function analyzeAndSaveSpiralTest(userId: string, points: { x: number; y: number; timestamp: number }[]) {
  if (!userId) return { error: 'Authentication required.' };
  
  try {
    const result = await analyzeSpiralDrawing({ points: JSON.stringify(points) });
    const validation = AnalyzeSpiralDrawingOutputSchema.safeParse(result);

    if (!validation.success) {
      console.error('Invalid AI response for spiral test:', validation.error);
      throw new Error('Invalid AI response format.');
    }
    const validatedResult = validation.data;
    
    const testResult: Omit<TestResult, 'id' | 'createdAt'> = {
      userId,
      testType: 'spiral',
      testData: JSON.stringify(points), // Storing points might be large, consider summarizing
      tremorScore: validatedResult.tremorScore,
      smoothnessScore: validatedResult.smoothnessScore,
      speedScore: validatedResult.speedScore,
      consistencyScore: validatedResult.consistencyScore,
      overallScore: validatedResult.overallScore,
      riskLevel: validatedResult.riskLevel,
      recommendation: validatedResult.recommendation,
    };

    const docRef = await addDoc(collection(db, 'tests'), {
      ...testResult,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...validatedResult };
  } catch (error) {
    console.error('Spiral test analysis failed:', error);
    return { error: 'Analysis failed.' };
  }
}

export async function analyzeAndSaveVoiceTest(userId: string, audioDataUri: string) {
    if (!userId) return { error: 'Authentication required.' };
    
    try {
      const result = await analyzeVoiceRecording({ audioDataUri });
      const validation = AnalyzeVoiceRecordingOutputSchema.safeParse(result);
      if (!validation.success) {
        console.error('Invalid AI response for voice test:', validation.error);
        throw new Error('Invalid AI response format.');
      }
      const validatedResult = validation.data;
      
      const testResult: Omit<TestResult, 'id' | 'createdAt'> = {
        userId,
        testType: 'voice',
        // Storing the full data URI in Firestore is not recommended.
        // In a real app, upload this to Firebase Storage and store the URL.
        testData: audioDataUri.substring(0, 50) + '...', 
        pitchScore: validatedResult.pitch_score,
        volumeScore: validatedResult.volume_score,
        clarityScore: validatedResult.clarity_score,
        tremorScore: validatedResult.tremor_score,
        overallScore: validatedResult.overall_score,
        riskLevel: validatedResult.risk_level as 'Low' | 'Moderate' | 'High',
        recommendation: validatedResult.recommendation,
      };
  
      const docRef = await addDoc(collection(db, 'tests'), {
        ...testResult,
        createdAt: serverTimestamp(),
      });
      return { id: docRef.id, ...validatedResult };
    } catch (error) {
      console.error('Voice test analysis failed:', error);
      return { error: 'Analysis failed.' };
    }
}

export async function analyzeAndSaveTappingTest(userId: string, tapTimestamps: number[], duration: number) {
    if (!userId) return { error: 'Authentication required.' };
    
    try {
      const result = await analyzeTappingPatterns({ tapTimestamps, duration });
      const validation = AnalyzeTappingPatternsOutputSchema.safeParse(result);
      if (!validation.success) {
        console.error('Invalid AI response for tapping test:', validation.error);
        throw new Error('Invalid AI response format.');
      }
      const validatedResult = validation.data;
      
      const testResult: Omit<TestResult, 'id' | 'createdAt'> = {
        userId,
        testType: 'tapping',
        testData: JSON.stringify({ tapCount: validatedResult.tapCount, duration }),
        tapCount: validatedResult.tapCount,
        tapsPerSecond: validatedResult.tapsPerSecond,
        speedScore: validatedResult.speedScore,
        consistencyScore: validatedResult.consistencyScore,
        rhythmScore: validatedResult.rhythmScore,
        fatigueScore: validatedResult.fatigueScore,
        overallScore: validatedResult.overallScore,
        riskLevel: validatedResult.riskLevel as 'Low' | 'Moderate' | 'High',
        recommendation: validatedResult.recommendation,
      };
  
      const docRef = await addDoc(collection(db, 'tests'), {
        ...testResult,
        createdAt: serverTimestamp(),
      });
      return { id: docRef.id, ...validatedResult };
    } catch (error) {
      console.error('Tapping test analysis failed:', error);
      return { error: 'Analysis failed.' };
    }
}


// DATA FETCHING
export async function getDashboardStats(userId: string) {
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

export async function getAllTests(userId: string): Promise<TestResult[]> {
  if (!userId) return [];
  
  const testsQuery = query(collection(db, 'tests'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const testsSnapshot = await getDocs(testsQuery);
  return testsSnapshot.docs.map(doc => {
      const data = doc.data() as TestResult;
      return { ...data, id: doc.id, createdAt: (data.createdAt as any).toDate().toISOString() } as TestResult;
  });
}

export async function getTestDetails(userId: string, testId: string): Promise<TestResult | null> {
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

export async function getProgressData(userId: string, timeframe: string) {
  if (!userId) return null;
  
  // IMPORTANT: The following queries require a composite index in Firestore.
  // Go to your Firebase console -> Firestore -> Indexes and create a composite index for
  // the 'tests' collection with the fields: `userId` (Ascending) and `createdAt` (Ascending).
  const days = parseInt(timeframe, 10);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const testsQuery = query(
      collection(db, 'tests'), 
      where('userId', '==', userId),
      where('createdAt', '>=', Timestamp.fromDate(startDate)), 
      orderBy('createdAt', 'asc')
  );
  const testsSnapshot = await getDocs(testsQuery);
  const tests = testsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TestResult[];
  
  // Group by date and average scores if multiple tests on same day
  const dailySums: { [key: string]: { [key: string]: { sum: number, count: number } } } = {};

  tests.forEach(test => {
    const dateKey = (test.createdAt as any).toDate().toISOString().split('T')[0];
    if (!dailySums[dateKey]) {
      dailySums[dateKey] = {};
    }
    if (!dailySums[dateKey][test.testType]) {
        dailySums[dateKey][test.testType] = { sum: 0, count: 0 };
    }
    
    dailySums[dateKey][test.testType].sum += test.overallScore;
    dailySums[dateKey][test.testType].count += 1;
  });
  
  const dailyAverages: { [key: string]: { date: string, spiral?: number, voice?: number, tapping?: number } } = {};
  Object.keys(dailySums).forEach(dateKey => {
      dailyAverages[dateKey] = { date: dateKey };
      Object.keys(dailySums[dateKey]).forEach(testType => {
          const { sum, count } = dailySums[dateKey][testType];
          dailyAverages[dateKey][testType] = sum / count;
      });
  });

  const formattedProgress = Object.values(dailyAverages).map(day => ({
    ...day,
    date: new Date(day.date).toLocaleString('en-US', { month: 'short', day: 'numeric' }),
  }));

  const allScores = tests.map(t => t.overallScore);
  const average = allScores.length > 0 ? allScores.reduce((acc, t) => acc + t, 0) / allScores.length : 0;
  
  const previousPeriodStartDate = new Date();
  previousPeriodStartDate.setDate(previousPeriodStartDate.getDate() - days * 2);
  const previousPeriodQuery = query(
      collection(db, 'tests'),
      where('userId', '==', userId),
      where('createdAt', '>=', Timestamp.fromDate(previousPeriodStartDate)),
      where('createdAt', '<', Timestamp.fromDate(startDate))
  );
  const previousSnapshot = await getDocs(previousPeriodQuery);
  const previousScores = previousSnapshot.docs.map(doc => doc.data().overallScore as number);
  const previousAverage = previousScores.length > 0 ? previousScores.reduce((a,b) => a+b, 0) / previousScores.length : 0;
  const trend = previousAverage > 0 ? ((average - previousAverage) / previousAverage) * 100 : (average > 0 ? 100 : 0);


  return {
    progress: formattedProgress,
    stats: {
        total: tests.length,
        average: average,
        trend: trend,
    }
  };
}
