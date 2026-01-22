'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Timer, RotateCcw, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { analyzeAndSaveReactionTest } from '@/lib/actions/data';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

const TOTAL_TRIALS = 5;

export function ReactionTimeTestClient() {
  const { appUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [testState, setTestState] = useState<'idle' | 'waiting' | 'cue' | 'analyzing' | 'results'>('idle');
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const startTrial = () => {
    setTestState('waiting');
    const randomDelay = Math.random() * 2000 + 1000; // 1-3 seconds delay
    timerRef.current = setTimeout(() => {
      startTimeRef.current = Date.now();
      setTestState('cue');
    }, randomDelay);
  };
  
  const handleTap = () => {
    if (testState === 'waiting') {
        if(timerRef.current) clearTimeout(timerRef.current);
        toast({
            variant: 'destructive',
            title: 'Too Soon!',
            description: 'Wait for the screen to turn green before tapping.',
            duration: 2000
        });
        startTrial();
        return;
    }

    if (testState === 'cue' && startTimeRef.current) {
        const endTime = Date.now();
        const time = endTime - startTimeRef.current;
        const newReactionTimes = [...reactionTimes, time];
        setReactionTimes(newReactionTimes);

        if(newReactionTimes.length >= TOTAL_TRIALS) {
            endTest(newReactionTimes);
        } else {
            startTrial();
        }
    }
  };
  
  const startTest = () => {
    setReactionTimes([]);
    setAnalysis(null);
    startTrial();
  }

  const endTest = async (times: number[]) => {
    setTestState('analyzing');
    if (!appUser) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to save results.'});
        resetTest();
        return;
    }
    try {
        const result = await analyzeAndSaveReactionTest(appUser.id, appUser.email, times);
        if (result && 'error' in result) {
            toast({ variant: 'destructive', title: 'Analysis Failed', description: result.error});
            resetTest();
        } else {
            setAnalysis(result);
            setTestState('results');
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Analysis Failed', description: 'An unexpected error occurred.'});
        resetTest();
    }
  };

  const resetTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTestState('idle');
    setReactionTimes([]);
    setAnalysis(null);
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
      { subject: 'Speed', value: analysis.reactionTimeScore, fullMark: 100 },
      { subject: 'Consistency', value: analysis.reactionConsistencyScore, fullMark: 100 },
  ] : [];

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card className="h-[450px] flex flex-col">
            <button
              onClick={handleTap}
              className={cn(
                "w-full h-full flex-grow flex items-center justify-center rounded-lg transition-colors duration-100",
                testState === 'cue' ? 'bg-green-400' : 'bg-card'
              )}
              disabled={testState === 'analyzing' || testState === 'results' || testState === 'idle'}
            >
              <div className="text-center">
                {testState === 'waiting' && <p className="text-2xl text-muted-foreground">Wait for green...</p>}
                {testState === 'cue' && <p className="text-4xl font-bold text-background">TAP NOW!</p>}
                {(testState === 'idle' || testState === 'results') && (
                    <>
                        <Timer className="w-24 h-24 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Tap the screen when it turns green</p>
                    </>
                )}
                {testState === 'analyzing' && (
                    <>
                        <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary mb-4" />
                        <p className="text-xl font-semibold">Analyzing results...</p>
                    </>
                )}
              </div>
            </button>
        </Card>
      </div>

      <div className="space-y-6">
        {testState === 'idle' && (
          <Card>
            <CardHeader>
                <CardTitle>Instructions</CardTitle>
                <CardDescription>Tap the screen as fast as you can when it turns green. You will do this {TOTAL_TRIALS} times.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button size="lg" onClick={startTest}>Start Test</Button>
            </CardContent>
          </Card>
        )}

        {(testState === 'waiting' || testState === 'cue') && (
            <Card>
                <CardHeader>
                    <CardTitle>Test in Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-center">
                    <div>
                        <p className="text-sm text-muted-foreground">Trial</p>
                        <p className="text-6xl font-bold font-headline">{reactionTimes.length + 1} / {TOTAL_TRIALS}</p>
                    </div>
                     <div>
                        <p className="text-sm text-muted-foreground">Last Time</p>
                        <p className="text-4xl font-bold font-headline">
                            {reactionTimes.length > 0 ? `${reactionTimes[reactionTimes.length -1]} ms` : '...'}
                        </p>
                    </div>
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
