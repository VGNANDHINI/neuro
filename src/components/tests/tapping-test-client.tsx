'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hand, RotateCcw, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { analyzeAndSaveTappingTest } from '@/lib/actions/data';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

const TEST_DURATION = 10; // seconds

export function TappingTestClient() {
  const { appUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [testState, setTestState] = useState<'idle' | 'testing' | 'analyzing' | 'results'>('idle');
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
  const [tapCount, setTapCount] = useState(0);
  const [tapTimestamps, setTapTimestamps] = useState<number[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const testStartTimeRef = useRef<number | null>(null);

  const resetTest = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTestState('idle');
    setTimeLeft(TEST_DURATION);
    setTapCount(0);
    setTapTimestamps([]);
    setAnalysis(null);
  }, []);

  const endTest = useCallback(async () => {
    setTestState('analyzing');
    if (!appUser) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to save results.' });
      resetTest();
      return;
    }
    try {
      const result = await analyzeAndSaveTappingTest(appUser.id, appUser.email, tapTimestamps, TEST_DURATION);
      if (result && 'error' in result) {
        toast({ variant: 'destructive', title: 'Analysis Failed', description: result.error });
        resetTest();
      } else {
        setAnalysis(result);
        setTestState('results');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Analysis Failed', description: 'An unexpected error occurred.' });
      resetTest();
    }
  }, [appUser, tapTimestamps, toast, resetTest]);

  // Timer management effect
  useEffect(() => {
    if (testState !== 'testing') {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [testState]);

  // Effect to end the test when time runs out
  useEffect(() => {
    if (timeLeft <= 0 && testState === 'testing') {
      if (timerRef.current) clearInterval(timerRef.current);
      endTest();
    }
  }, [timeLeft, testState, endTest]);


  const startTest = () => {
    setTestState('testing');
    setTimeLeft(TEST_DURATION);
    setTapCount(0);
    setTapTimestamps([]);
    setAnalysis(null);
    testStartTimeRef.current = Date.now();
  };

  const handleTap = () => {
    if (testState !== 'testing') return;
    setTapCount(c => c + 1);
    if (testStartTimeRef.current) {
      const timestamp = Date.now() - testStartTimeRef.current;
      setTapTimestamps(times => [...times, timestamp]);
    }
  };

  const getRiskClasses = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Moderate': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'High': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const chartData = analysis ? [
      { subject: 'Speed', value: analysis.speedScore, fullMark: 100 },
      { subject: 'Consistency', value: analysis.consistencyScore, fullMark: 100 },
      { subject: 'Rhythm', value: analysis.rhythmScore, fullMark: 100 },
      { subject: 'Fatigue Res.', value: analysis.fatigueScore, fullMark: 100 },
  ] : [];

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card className="h-[450px] flex flex-col">
          <CardHeader>
            <CardTitle>Tapping Area</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            {testState === 'testing' ? (
                <button
                    onClick={handleTap}
                    className="w-64 h-64 bg-gradient-to-br from-primary to-accent/80 rounded-full text-primary-foreground font-bold text-6xl hover:opacity-90 transition active:scale-95 shadow-lg"
                >
                    TAP
                </button>
            ) : (
                <div className="text-center text-muted-foreground">
                    <Hand className="w-24 h-24 mx-auto mb-4" />
                    <p>Press "Start Test" to begin</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {testState === 'idle' && (
          <Card>
            <CardHeader><CardTitle>Ready to start?</CardTitle></CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">Tap the button to begin the {TEST_DURATION}-second tapping test.</p>
              <Button size="lg" onClick={startTest}>Start Test</Button>
            </CardContent>
          </Card>
        )}

        {(testState === 'testing' || testState === 'analyzing') && (
            <Card>
                <CardHeader><CardTitle>Test Status</CardTitle></CardHeader>
                <CardContent className="space-y-6 text-center">
                    {testState === 'testing' ? (
                        <>
                            <div>
                                <p className="text-sm text-muted-foreground">Time Left</p>
                                <p className="text-6xl font-bold font-headline">{timeLeft}s</p>
                            </div>
                             <div>
                                <p className="text-sm text-muted-foreground">Taps</p>
                                <p className="text-6xl font-bold font-headline">{tapCount}</p>
                            </div>
                        </>
                    ) : (
                         <>
                            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
                            <p className="text-lg font-semibold">Analyzing your taps...</p>
                            <p className="text-muted-foreground">This may take a moment.</p>
                        </>
                    )}
                </CardContent>
            </Card>
        )}

        {testState === 'results' && analysis && (
             <Card>
                <CardHeader>
                <CardTitle className="flex items-center">
                    <CheckCircle className="mr-2 h-6 w-6 text-green-400" />
                    Analysis Complete
                </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                <div className={`p-4 rounded-lg border text-center ${getRiskClasses(analysis.riskLevel)}`}>
                    <p className="text-sm font-medium">Risk Level</p>
                    <p className="text-2xl font-bold">{analysis.riskLevel}</p>
                </div>

                <div className="text-center">
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                    <p className="text-5xl font-bold font-headline text-primary">
                        {analysis.overallScore.toFixed(1)}<span className="text-2xl text-muted-foreground">/100</span>
                    </p>
                </div>
                
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                            <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Recommendation</h4>
                    <p className="text-sm text-muted-foreground">{analysis.recommendation}</p>
                </div>

                <div className="flex gap-4">
                    <Button variant="outline" onClick={resetTest} className="w-full">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Try Again
                    </Button>
                    <Button onClick={() => router.push(`/results/${analysis.id}`)} className="w-full">
                    View Details
                    </Button>
                </div>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
