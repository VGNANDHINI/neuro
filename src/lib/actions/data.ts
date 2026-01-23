
'use server';

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
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
import { analyzeReactionTime } from '@/ai/flows/analyze-reaction-time';

import {
  AnalyzeSpiralDrawingOutputSchema,
  AnalyzeVoiceRecordingOutputSchema,
  AnalyzeTappingPatternsOutputSchema,
  AnalyzeReactionTimeOutputSchema,
} from '@/lib/types';

/* -------------------- HELPERS -------------------- */

function safeReturn<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

function tsToISO(ts: any): string | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts; // Already a string
  if (ts.seconds && typeof ts.seconds === 'number') return new Date(ts.seconds * 1000).toISOString();
  return null;
}

/* -------------------- USER -------------------- */

export async function getAppUser(userId: string): Promise<AppUser | null> {
  if (!userId) return null;

  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return null;

    const userData = snap.data();
    return safeReturn({ 
      id: snap.id, 
      ...userData,
      createdAt: tsToISO(userData.createdAt),
      lastLogin: tsToISO(userData.lastLogin),
    } as AppUser);
  } catch (e) {
    console.error('getAppUser error:', e);
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  data: Partial<AppUser>
) {
  if (!userId) return { error: 'Authentication required' };

  try {
    await updateDoc(doc(db, 'users', userId), data);
    return safeReturn({ success: true });
  } catch (e) {
    console.error('updateUserProfile error:', e);
    return { error: 'Failed to update profile' };
  }
}

/* -------------------- SPIRAL -------------------- */

export async function analyzeAndSaveSpiralTest(
  userId: string,
  userEmail: string,
  points: { x: number; y: number; timestamp: number }[]
) {
  if (!userId || !userEmail) return { error: 'Auth required' };

  try {
    const result = await analyzeSpiralDrawing({
      points: JSON.stringify(points),
    });

    const parsed = AnalyzeSpiralDrawingOutputSchema.parse(result);

    const docRef = await addDoc(collection(db, 'tests'), {
      userId,
      userEmail,
      testType: 'spiral',
      testData: JSON.stringify(points),
      ...parsed,
      createdAt: serverTimestamp(),
    });

    return safeReturn({ id: docRef.id, ...parsed });
  } catch (e) {
    console.error('Spiral error:', e);
    return { error: 'Analysis failed' };
  }
}

/* -------------------- VOICE -------------------- */

export async function analyzeAndSaveVoiceTest(
  userId: string,
  userEmail: string,
  audioDataUri: string
) {
  if (!userId || !userEmail) return { error: 'Auth required' };

  try {
    const result = await analyzeVoiceRecording({ audioDataUri });
    const parsed = AnalyzeVoiceRecordingOutputSchema.parse(result);

    const docRef = await addDoc(collection(db, 'tests'), {
      userId,
      userEmail,
      testType: 'voice',
      testData: JSON.stringify({ audioPreview: audioDataUri.substring(0, 50) + '...' }),
      pitchScore: parsed.pitchScore,
      volumeScore: parsed.volumeScore,
      clarityScore: parsed.clarityScore,
      tremorScore: parsed.tremorScore,
      overallScore: parsed.overallScore,
      riskLevel: parsed.riskLevel,
      recommendation: parsed.recommendation,
      createdAt: serverTimestamp(),
    });

    return safeReturn({ id: docRef.id, ...parsed });
  } catch (e) {
    console.error('Voice error:', e);
    return { error: 'Analysis failed' };
  }
}

/* -------------------- TAPPING -------------------- */

export async function analyzeAndSaveTappingTest(
  userId: string,
  userEmail: string,
  tapTimestamps: number[],
  duration: number
) {
  if (!userId || !userEmail) return { error: 'Auth required' };

  try {
    const result = await analyzeTappingPatterns({
      tapTimestamps,
      duration,
    });

    const parsed = AnalyzeTappingPatternsOutputSchema.parse(result);

    const docRef = await addDoc(collection(db, 'tests'), {
      userId,
      userEmail,
      testType: 'tapping',
      testData: JSON.stringify({ tapTimestamps, duration }),
      ...parsed,
      createdAt: serverTimestamp(),
    });

    return safeReturn({ id: docRef.id, ...parsed });
  } catch (e) {
    console.error('Tapping error:', e);
    return { error: 'Analysis failed' };
  }
}

/* -------------------- REACTION -------------------- */

export async function analyzeAndSaveReactionTest(
  userId: string,
  userEmail: string,
  reactionTimes: number[]
) {
  if (!userId || !userEmail) return { error: 'Auth required' };

  try {
    const result = await analyzeReactionTime({ reactionTimes });

    const parsed = AnalyzeReactionTimeOutputSchema.parse(result);

    const docRef = await addDoc(collection(db, 'tests'), {
      userId,
      userEmail,
      testType: 'reaction',
      testData: JSON.stringify({ reactionTimes }),
      ...parsed,
      createdAt: serverTimestamp(),
    });

    return safeReturn({ id: docRef.id, ...parsed });
  } catch (e) {
    console.error('Reaction Time error:', e);
    return { error: 'Analysis failed' };
  }
}


/* -------------------- DASHBOARD -------------------- */

export async function getDashboardStats(userId: string) {
  if (!userId) return null;

  try {
    const q = query(
      collection(db, 'tests'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snap = await getDocs(q);
    const tests = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: tsToISO(d.data().createdAt),
    })) as TestResult[];

    const scores = tests
      .map(t => t.overallScore)
      .filter((n): n is number => typeof n === 'number');

    return safeReturn({
      totalTests: tests.length,
      averageScore:
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0,
      currentRisk: tests[0]?.riskLevel ?? 'N/A',
      recentTests: tests.slice(0, 5),
      testsByType: {
        spiral: tests.filter(t => t.testType === 'spiral').length,
        voice: tests.filter(t => t.testType === 'voice').length,
        tapping: tests.filter(t => t.testType === 'tapping').length,
      },
    });
  } catch (e) {
    console.error('Dashboard error:', e);
    return null;
  }
}

/* -------------------- ALL TESTS -------------------- */

export async function getAllTests(userId: string): Promise<TestResult[]> {
  if (!userId) return [];

  try {
    const q = query(
      collection(db, 'tests'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snap = await getDocs(q);

    return safeReturn(
      snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: tsToISO(d.data().createdAt),
      })) as TestResult[]
    );
  } catch (e) {
    console.error('getAllTests error:', e);
    return [];
  }
}

/* -------------------- SINGLE TEST -------------------- */

export async function getTestDetails(
  userId: string,
  testId: string
): Promise<TestResult | null> {
  if (!userId) return null;

  try {
    const snap = await getDoc(doc(db, 'tests', testId));
    if (!snap.exists()) return null;

    const data = snap.data() as TestResult;
    if (data.userId !== userId) return null;

    return safeReturn({
      id: snap.id,
      ...data,
      createdAt: tsToISO(data.createdAt),
    });
  } catch (e) {
    console.error('getTestDetails error:', e);
    return null;
  }
}

/* -------------------- PROGRESS -------------------- */

export async function getProgressData(userId: string, timeframe: string) {
    if (!userId) return null;

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
    const tests = testsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<TestResult, 'id'> })) as TestResult[];

    const dailyAverages: { [key: string]: { [key: string]: { sum: number; count: number } } } = {};

    tests.forEach(test => {
        const dateKey = (test.createdAt as unknown as Timestamp).toDate().toISOString().split('T')[0];
        if (!dailyAverages[dateKey]) {
            dailyAverages[dateKey] = {};
        }
        if (!dailyAverages[dateKey][test.testType]) {
            dailyAverages[dateKey][test.testType] = { sum: 0, count: 0 };
        }
        dailyAverages[dateKey][test.testType].sum += test.overallScore;
        dailyAverages[dateKey][test.testType].count += 1;
    });

    const formattedProgress = Object.keys(dailyAverages).map(dateKey => {
        const dayData: { date: string; spiral?: number; voice?: number; tapping?: number; reaction?: number; } = {
            date: new Date(dateKey).toLocaleString('en-US', { month: 'short', day: 'numeric' }),
        };
        for (const testType in dailyAverages[dateKey]) {
            const { sum, count } = dailyAverages[dateKey][testType];
            if (count > 0) {
                dayData[testType as 'spiral' | 'voice' | 'tapping' | 'reaction'] = sum / count;
            }
        }
        return dayData;
    });

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

    return safeReturn({
        progress: formattedProgress,
        stats: {
            total: tests.length,
            average: average,
            trend: trend,
        }
    });
}
