'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getTremorReadings, getTremorAIAnalysis } from '@/lib/actions/data';
import type { TremorReading, AnalyzeTremorDataOutput } from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Waves, Zap, Activity, Info, BrainCircuit, Loader2 } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

export function TremorPageClient() {
  const { appUser } = useAuth();
  
  // State for live data
  const [liveData, setLiveData] = useState<{ frequency: number; amplitude: number } | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<'loading' | 'disconnected' | 'connected'>('loading');

  // State for historical data
  const [historicalReadings, setHistoricalReadings] = useState<TremorReading[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // State for AI analysis
  const [aiAnalysis, setAiAnalysis] = useState<AnalyzeTremorDataOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);


  // Effect for live data from `tremor_live` collection
  useEffect(() => {
    if (!appUser) return;
    setDeviceStatus('loading');
    const docRef = doc(db, 'tremor_live', appUser.id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLiveData({
          frequency: data.tremor_frequency || 0,
          amplitude: data.tremor_amplitude || 0,
        });
        setDeviceStatus('connected');
      } else {
        setDeviceStatus('disconnected');
        setLiveData(null);
      }
    }, (error) => {
      console.error("Error listening to live tremor data:", error);
      setDeviceStatus('disconnected');
    });

    return () => unsubscribe();
  }, [appUser]);


  // Effect to fetch historical data from `users/{uid}/tremorReadings`
  useEffect(() => {
    if (appUser) {
      setIsLoadingHistory(true);
      getTremorReadings(appUser.id).then(readings => {
        setHistoricalReadings(readings);
        setIsLoadingHistory(false);
      });
    }
  }, [appUser]);
  
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAiAnalysis(null);
    const result = await getTremorAIAnalysis(historicalReadings);
    if ('error' in result) {
        setAnalysisError(result.error);
    } else {
        setAiAnalysis(result);
    }
    setIsAnalyzing(false);
  };
  
  const chartData = useMemo(() => {
    return historicalReadings
        .slice(0, 50) // Limit to 50 points for performance
        .reverse() // Reverse to show oldest first
        .map(r => ({
            date: format(new Date(r.createdAt), 'HH:mm'),
            Frequency: r.frequency,
            Amplitude: r.amplitude,
        }));
  }, [historicalReadings]);

  const severityClasses = {
      Mild: 'text-green-400',
      Moderate: 'text-yellow-400',
      Severe: 'text-red-400',
  }

  const stabilityClasses = {
      Stable: 'text-green-400',
      Fluctuating: 'text-yellow-400',
      Worsening: 'text-red-400',
  }

  return (
    <div className="space-y-8">
      {/* Live Data Section */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className={`w-3 h-3 rounded-full ${deviceStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
              Live Device Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deviceStatus === 'loading' && <Skeleton className="h-8 w-3/4" />}
            {deviceStatus === 'disconnected' && <p className="text-muted-foreground">Device not connected.</p>}
            {deviceStatus === 'connected' && <p className="text-green-400 font-semibold">Receiving live data.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Waves className="w-5 h-5 text-blue-400" />Live Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            {liveData ? (
              <p className="text-4xl font-bold font-headline">
                {liveData.frequency.toFixed(2)} <span className="text-xl text-muted-foreground">Hz</span>
              </p>
            ) : (
              <Skeleton className="h-10 w-1/2" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Zap className="w-5 h-5 text-yellow-400" />Live Amplitude</CardTitle>
          </CardHeader>
          <CardContent>
            {liveData ? (
               <p className="text-4xl font-bold font-headline">
                {liveData.amplitude.toFixed(0)}
              </p>
            ) : (
              <Skeleton className="h-10 w-1/2" />
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* AI Analysis Section */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><BrainCircuit className="w-6 h-6 text-primary" />AI-Powered Analysis</CardTitle>
            <CardDescription>Analyze your historical data to find trends and get insights.</CardDescription>
        </CardHeader>
        <CardContent>
           {isAnalyzing && (
            <div className="flex items-center gap-4 text-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div>
                    <p className="font-semibold">AI is analyzing your data...</p>
                    <p className="text-sm text-muted-foreground">This may take a moment.</p>
                </div>
            </div>
           )}
           {analysisError && (
             <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">{analysisError}</div>
           )}
           {aiAnalysis && (
            <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Assessed Severity</p>
                        <p className={`text-2xl font-semibold ${severityClasses[aiAnalysis.severity] || ''}`}>{aiAnalysis.severity}</p>
                    </div>
                     <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Stability Trend</p>
                        <p className={`text-2xl font-semibold ${stabilityClasses[aiAnalysis.stability] || ''}`}>{aiAnalysis.stability}</p>
                    </div>
                     <div className="p-4 bg-muted/50 rounded-lg md:col-span-1">
                        <p className="text-sm text-muted-foreground">Key Observation</p>
                        <p className="text-lg font-semibold">{aiAnalysis.keyObservation}</p>
                    </div>
                </div>
                 <div className="p-4 border-l-4 border-primary bg-primary/10">
                    <h4 className="font-semibold mb-1">AI Recommendation</h4>
                    <p className="text-sm text-muted-foreground">{aiAnalysis.recommendation}</p>
                </div>
            </div>
           )}
           {!isAnalyzing && (
            <Button onClick={handleRunAnalysis} disabled={historicalReadings.length < 10}>
                <Activity className="mr-2 h-4 w-4" /> Run AI Analysis
            </Button>
           )}
        </CardContent>
      </Card>

      {/* Historical Data Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tremor Trends</CardTitle>
          <CardDescription>A chart showing your recent tremor frequency and amplitude readings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            {isLoadingHistory ? <Skeleton className="h-full w-full" /> : 
            chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" label={{ value: 'Frequency (Hz)', angle: -90, position: 'insideLeft', fill: '#3b82f6' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" label={{ value: 'Amplitude', angle: -90, position: 'insideRight', fill: '#f59e0b' }} />
                  <Tooltip
                     contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="Frequency" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  <Area yAxisId="right" type="monotone" dataKey="Amplitude" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
                <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                    <div>
                        <Info className="mx-auto h-10 w-10 mb-2" />
                        <p>No historical data from your device yet.</p>
                        <p className="text-xs">Data will appear here once your ESP32 device starts saving readings.</p>
                    </div>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
      
       <Card>
          <CardHeader><CardTitle>Recent Readings</CardTitle></CardHeader>
          <CardContent>
            {isLoadingHistory ? (
                 <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Frequency (Hz)</TableHead>
                  <TableHead className="text-right">Amplitude</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicalReadings.slice(0, 10).map(reading => (
                  <TableRow key={reading.id}>
                    <TableCell>{format(new Date(reading.createdAt), 'PP pp')}</TableCell>
                    <TableCell className="text-right font-medium">{reading.frequency.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">{reading.amplitude.toFixed(0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
       </Card>
    </div>
  );
}
