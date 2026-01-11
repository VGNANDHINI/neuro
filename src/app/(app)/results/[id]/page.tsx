'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getTestDetails } from '@/lib/actions/data';
import type { TestResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Activity, Mic, Hand } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

export default function ResultDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { appUser } = useAuth();
  const [test, setTest] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (appUser) {
      getTestDetails(appUser.id, id).then((data) => {
        // The server action already ensures the user owns the test
        setTest(data);
        setLoading(false);
      });
    }
  }, [appUser, id]);

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-6 w-64 mb-8" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
          </div>
          <div>
            <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
          </div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold">Test not found</h2>
        <p className="text-muted-foreground">This test result could not be loaded or you don't have permission to view it.</p>
        <Button onClick={() => router.push('/results')} className="mt-4">Go to Results</Button>
      </div>
    );
  }
  
  const getRiskClasses = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'Moderate': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'High': return 'bg-red-500/10 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const testIcons = {
    spiral: <Activity className="h-8 w-8" />,
    voice: <Mic className="h-8 w-8" />,
    tapping: <Hand className="h-8 w-8" />,
  };
  
  let chartData: { subject: string, value: number, fullMark: number }[] = [];
  let scoreCards: { label: string, value: number | string | undefined }[] = [];

  switch(test.testType) {
    case 'spiral':
      chartData = [
        { subject: 'Smoothness', value: test.smoothnessScore || 0, fullMark: 100 },
        { subject: 'Speed', value: test.speedScore || 0, fullMark: 100 },
        { subject: 'Consistency', value: test.consistencyScore || 0, fullMark: 100 },
        { subject: 'Steadiness', value: 100 - (test.tremorScore || 0), fullMark: 100 },
      ];
      scoreCards = [
        { label: 'Tremor Score', value: test.tremorScore?.toFixed(1) },
        { label: 'Smoothness Score', value: test.smoothnessScore?.toFixed(1) },
        { label: 'Speed Score', value: test.speedScore?.toFixed(1) },
        { label: 'Consistency Score', value: test.consistencyScore?.toFixed(1) },
      ];
      break;
    case 'voice':
      chartData = [
        { subject: 'Pitch', value: test.pitchScore || 0, fullMark: 100 },
        { subject: 'Volume', value: test.volumeScore || 0, fullMark: 100 },
        { subject: 'Clarity', value: test.clarityScore || 0, fullMark: 100 },
        { subject: 'Steadiness', value: 100-(test.tremorScore || 0), fullMark: 100 },
      ];
       scoreCards = [
        { label: 'Pitch Score', value: test.pitchScore?.toFixed(1) },
        { label: 'Volume Score', value: test.volumeScore?.toFixed(1) },
        { label: 'Clarity Score', value: test.clarityScore?.toFixed(1) },
        { label: 'Tremor Score', value: test.tremorScore?.toFixed(1) },
      ];
      break;
    case 'tapping':
      chartData = [
        { subject: 'Speed', value: test.speedScore || 0, fullMark: 100 },
        { subject: 'Consistency', value: test.consistencyScore || 0, fullMark: 100 },
        { subject: 'Rhythm', value: test.rhythmScore || 0, fullMark: 100 },
        { subject: 'Fatigue Res.', value: test.fatigueScore || 0, fullMark: 100 },
      ];
      scoreCards = [
        { label: 'Taps per Second', value: test.tapsPerSecond?.toFixed(2)},
        { label: 'Speed Score', value: test.speedScore?.toFixed(1) },
        { label: 'Consistency Score', value: test.consistencyScore?.toFixed(1) },
        { label: 'Rhythm Score', value: test.rhythmScore?.toFixed(1) },
      ]
      break;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        <Button onClick={() => window.print()}><Download className="mr-2 h-4 w-4" /> Export PDF</Button>
      </div>

      <Card className="mb-8">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-primary/10 text-primary rounded-lg">{testIcons[test.testType]}</div>
                <h1 className="text-3xl font-bold font-headline capitalize">{test.testType} Test Report</h1>
            </div>
            <CardDescription>
              Test taken on {format(new Date(test.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </CardDescription>
          </div>
           <Badge className={`px-4 py-2 text-md ${getRiskClasses(test.riskLevel)}`} variant="outline">
              {test.riskLevel} Risk
            </Badge>
        </CardHeader>
      </Card>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader><CardTitle>Score Breakdown</CardTitle></CardHeader>
            <CardContent>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14 }} />
                            <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Overall Score</CardTitle></CardHeader>
              <CardContent className="text-center">
                 <p className="text-7xl font-bold font-headline text-primary">
                    {test.overallScore.toFixed(1)}
                  </p>
                  <p className="text-muted-foreground">out of 100</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>AI Recommendation</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{test.recommendation}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
       <Card className="mt-6">
            <CardHeader><CardTitle>Detailed Metrics</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {scoreCards.map(metric => (
                    <div key={metric.label} className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">{metric.label}</p>
                        <p className="text-2xl font-semibold">{metric.value}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
    </div>
  );
}
