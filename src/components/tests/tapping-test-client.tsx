'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Hand, Play, RotateCcw, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { analyzeAndSaveTappingTest } from '@/lib/actions/data';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ResponsiveContainer, PolarGrid, PolarAngleAxis, Radar, RadarChart } from 'recharts';
import { cn } from '@/lib/utils';

const TEST_DURATION = 10; // seconds

export function TappingTestClient() {
  const [testState, setTestState] = useState<'idle' | 'running' | 'analyzing' | 'results'>('idle');
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
  const [tapCount, setTapCount] = useState(0);
  const [analysis, setAnalysis] = useState<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { appUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (testState === 'running' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (testState === 'running' && timeLeft === 0) {
      endTest();
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [testState, timeLeft]);

  const startTest = () => {
    setTestState('running');
    setTimeLeft(TEST_DURATION);
    setTapCount(0);
  };

  const endTest = async () => {
    if(timerRef.current) clearTimeout(timerRef.current);
    setTestState('analyzing');
    if (appUser) {
      const result = await analyzeAndSaveTappingTest(appUser.id, tapCount, TEST_DURATION);
      if (result && 'error' in result) {
        toast({ variant: 'destructive', title: 'Analysis Failed', description: result.error });
        resetTest();
      } else {
        setAnalysis(result);
        setTestState('results');
      }
    }
  };
  
  const resetTest = () => {
    setTestState('idle');
    setAnalysis(null);
    setTapCount(0);
    setTimeLeft(TEST_DURATION);
  };

  const handleTap = () => {
    if (testState === 'running') {
      setTapCount(count => count + 1);
    }
  };

  const chartData = analysis ? [
    { subject: 'Speed', value: analysis.speedScore, fullMark: 100 },
    { subject: 'Consistency', value: analysis.consistencyScore, fullMark: 100 },
    { subject: 'Rhythm', value: analysis.rhythmScore, fullMark: 100 },
  ] : [];

  const getRiskClasses = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Moderate': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'High': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card className={cn("h-[400px] md:h-[500px]", testState !== 'running' && 'flex items-center justify-center')}>
          <CardContent className="p-4 w-full h-full">
            {testState === 'idle' && (
              <div className="text-center">
                <Hand className="mx-auto h-16 w-16 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Ready to start?</h3>
                <p className="text-muted-foreground mb-6">Tap the button to begin the {TEST_DURATION}-second tapping test.</p>
                <Button size="lg" onClick={startTest}>
                  <Play className="mr-2 h-5 w-5" /> Start Test
                </Button>
              </div>
            )}
            {testState === 'running' && (
              <button
                className="w-full h-full bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-3xl focus:outline-none focus:ring-4 focus:ring-primary/50 active:bg-primary/20 transition-all"
                onClick={handleTap}
              >
                Tap Here!
              </button>
            )}
            {(testState === 'analyzing' || testState === 'results') && (
                <div className="text-center flex flex-col justify-center items-center h-full">
                {testState === 'analyzing' ? (
                    <>
                    <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary mb-4" />
                    <p className="text-xl font-semibold">Analyzing tapping patterns...</p>
                    <p className="text-muted-foreground">This should only take a moment.</p>
                    </>
                ) : analysis && (
                    <>
                    <CheckCircle className="h-16 w-16 mx-auto text-green-400 mb-4" />
                    <p className="text-2xl font-bold font-headline">Test Complete!</p>
                    <p className="text-muted-foreground mb-6">Your results are ready on the right.</p>
                    <Button variant="outline" onClick={resetTest}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Take Again
                    </Button>
                    </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Time Left</p>
              <p className="text-3xl font-bold font-headline">{timeLeft}s</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taps</p>
              <p className="text-3xl font-bold font-headline">{tapCount}</p>
            </div>
          </CardContent>
        </Card>
        {analysis && testState === 'results' && (
             <Card>
             <CardHeader>
               <CardTitle>Analysis Results</CardTitle>
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
               
               <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                    </RadarChart>
                </ResponsiveContainer>
              </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-2 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Taps/sec</p>
                        <p className="font-semibold text-lg">{analysis.tapsPerSecond.toFixed(2)}</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Taps</p>
                        <p className="font-semibold text-lg">{analysis.tapCount}</p>
                    </div>
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
                  View Full Report
                </Button>
              </div>
             </CardContent>
           </Card>
        )}
      </div>
    </div>
  );
}
