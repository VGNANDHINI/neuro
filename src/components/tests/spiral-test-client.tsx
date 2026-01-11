'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, RotateCcw, Download, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { analyzeAndSaveSpiralTest } from '@/lib/actions/data';
import { Progress } from '@/components/ui/progress';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import { useRouter } from 'next/navigation';

type Point = { x: number; y: number; timestamp: number };

export function SpiralTestClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [testState, setTestState] = useState<'idle' | 'countdown' | 'drawing' | 'analyzing' | 'results'>('idle');
  const [points, setPoints] = useState<Point[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [analysis, setAnalysis] = useState<any>(null);

  const { appUser } = useAuth();
  const router = useRouter();

  const drawReferenceSpiral = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const centerX = 300;
    const centerY = 300;
    let angle = 0;
    let radius = 5;

    ctx.strokeStyle = 'hsl(var(--border))';
    ctx.lineWidth = 40;
    ctx.setLineDash([5, 10]);
    ctx.beginPath();

    for (let i = 0; i < 720; i++) {
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);

      angle += 0.1;
      radius += 0.35;
    }
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw start circle
    ctx.fillStyle = 'hsl(var(--primary))';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
    ctx.fill();

  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawReferenceSpiral(ctx);
      }
    }
  }, [drawReferenceSpiral]);

  useEffect(() => {
    if (testState !== 'countdown') return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setTestState('drawing');
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawReferenceSpiral(ctx);
        }
      }
    }
  }, [testState, countdown, drawReferenceSpiral]);

  const startTest = () => {
    setCountdown(3);
    setTestState('countdown');
  };

  const getCanvasCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    if (testState !== 'drawing') return;
    const coords = getCanvasCoordinates(event);
    if (!coords) return;

    setIsDrawing(true);
    const newPoint = { ...coords, timestamp: Date.now() };
    setPoints([newPoint]);

    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(newPoint.x, newPoint.y);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || testState !== 'drawing') return;
    const coords = getCanvasCoordinates(event);
    if (!coords) return;

    const newPoint = { ...coords, timestamp: Date.now() };
    setPoints(prev => [...prev, newPoint]);

    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.strokeStyle = 'hsl(var(--primary))';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(newPoint.x, newPoint.y);
    ctx.stroke();
  };

  const stopDrawing = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (points.length > 50) {
      setTestState('analyzing');
      if (appUser) {
        const result = await analyzeAndSaveSpiralTest(points);
        if ('error' in result) {
            // handle error
            setTestState('idle');
        } else {
            setAnalysis(result);
            setTestState('results');
        }
      }
    }
  };

  const resetTest = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx && drawReferenceSpiral(ctx);
    }
    setTestState('idle');
    setPoints([]);
    setAnalysis(null);
    setIsDrawing(false);
  };

  const chartData = analysis ? [
      { subject: 'Smoothness', value: analysis.smoothnessScore, fullMark: 100 },
      { subject: 'Speed', value: analysis.speedScore, fullMark: 100 },
      { subject: 'Consistency', value: analysis.consistencyScore, fullMark: 100 },
      { subject: 'Steadiness', value: 100 - analysis.tremorScore, fullMark: 100 },
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
        <Card className="relative">
          <CardContent className="p-4">
          {(testState === 'countdown' && countdown > 0) && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-lg">
                <div className="text-center">
                <div className="text-8xl font-bold text-primary mb-4 animate-pulse">{countdown}</div>
                <p className="text-xl text-muted-foreground">Get ready...</p>
                </div>
            </div>
            )}
            <canvas
              ref={canvasRef}
              width={600}
              height={600}
              className="border-2 border-dashed border-border rounded-lg cursor-crosshair w-full aspect-square"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {testState === 'idle' && (
          <Card>
            <CardHeader>
              <CardTitle>Start Your Test</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">Click the button below to begin the 3-second countdown.</p>
              <Button size="lg" onClick={startTest}>
                <Play className="mr-2 h-5 w-5" /> Start Test
              </Button>
            </CardContent>
          </Card>
        )}
        
        {(testState === 'drawing' || testState === 'analyzing') && (
            <Card>
                <CardHeader><CardTitle>Test in Progress</CardTitle></CardHeader>
                <CardContent className="text-center">
                    {testState === 'drawing' ? (
                        <>
                        <p className="text-muted-foreground mb-4">Trace the spiral from the center outwards.</p>
                        <p className="text-2xl font-bold font-headline">{points.length} points recorded</p>
                        </>
                    ) : (
                        <>
                            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
                            <p className="text-lg font-semibold">Analyzing your drawing...</p>
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
