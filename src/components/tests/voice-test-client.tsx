'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mic, CheckCircle, Loader2, RotateCcw, Play } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { analyzeAndSaveVoiceTest } from '@/lib/actions/data';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';


export function VoiceTestClient() {
  const [isRecording, setIsRecording] = useState(false);
  const [testState, setTestState] = useState<'idle' | 'recording' | 'analyzing' | 'results'>('idle');
  const [analysis, setAnalysis] = useState<any>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [audioVisualData, setAudioVisualData] = useState<{name: string, value: number}[]>([]);


  const { appUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const visualizeAudio = useCallback(() => {
    if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const newData = Array.from(dataArrayRef.current.slice(0, 32)).map((value, i) => ({
            name: `F${i}`,
            value: value,
        }));
        setAudioVisualData(newData);
        animationFrameRef.current = requestAnimationFrame(visualizeAudio);
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          if (appUser) {
            const result = await analyzeAndSaveVoiceTest(appUser.id, appUser.email, base64Audio);
             if ('error' in result) {
                toast({ variant: 'destructive', title: 'Analysis Failed', description: result.error });
                setTestState('idle');
            } else {
                setAnalysis(result);
                setTestState('results');
            }
          }
        };
        stream.getTracks().forEach(track => track.stop());
        if(audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTestState('recording');
      setRecordingTime(0);
      visualizeAudio();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Microphone Error', description: 'Could not access microphone. Please check permissions.' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setTestState('analyzing');
      if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const resetTest = () => {
    setTestState('idle');
    setAnalysis(null);
    setRecordingTime(0);
    setIsRecording(false);
  };
  
  const chartData = analysis ? [
    { name: 'Pitch', score: analysis.pitch_score },
    { name: 'Volume', score: analysis.volume_score },
    { name: 'Clarity', score: analysis.clarity_score },
    { name: 'Tremor', score: analysis.tremor_score, inverse: true },
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
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent className="p-8 md:p-12 text-center">
          {testState === 'idle' && (
            <>
              <CardTitle className="text-2xl mb-2 font-headline">Instructions</CardTitle>
              <CardDescription className="mb-6">Record yourself saying the phrase below clearly.</CardDescription>
              <div className="p-6 bg-muted rounded-lg my-8">
                <p className="text-2xl font-semibold text-foreground">"The quick brown fox jumps over the lazy dog."</p>
              </div>
              <Button size="lg" onClick={startRecording}>
                <Mic className="mr-2 h-5 w-5" />
                Start Recording
              </Button>
            </>
          )}

          {testState === 'recording' && (
            <>
              <div className="w-32 h-32 mx-auto rounded-full flex items-center justify-center bg-red-500/10 mb-4">
                  <Mic className="w-16 h-16 text-red-400 animate-pulse" />
              </div>
              <p className="text-2xl font-semibold mb-2">Recording... {recordingTime}s</p>
              <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={audioVisualData}>
                        <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                </ResponsiveContainer>
              </div>
              <Button size="lg" variant="destructive" onClick={stopRecording} className="mt-4">
                Stop Recording
              </Button>
            </>
          )}

          {testState === 'analyzing' && (
            <>
              <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary mb-4" />
              <p className="text-xl font-semibold">Analyzing your voice...</p>
              <p className="text-muted-foreground">This may take a few seconds.</p>
            </>
          )}

          {testState === 'results' && analysis && (
            <div className="space-y-6">
                <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                    <h3 className="text-2xl font-bold font-headline">Analysis Complete</h3>
                </div>

                <div className={`p-4 rounded-lg border text-center ${getRiskClasses(analysis.risk_level)}`}>
                    <p className="text-sm font-medium">Risk Level</p>
                    <p className="text-2xl font-bold">{analysis.risk_level}</p>
                </div>

                <div className="text-center">
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                    <p className="text-5xl font-bold font-headline text-primary">
                        {analysis.overall_score.toFixed(1)}<span className="text-2xl text-muted-foreground">/100</span>
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    {chartData.map(item => (
                        <div key={item.name} className="p-4 bg-muted/50 rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">{item.name}</p>
                            <p className={`text-2xl font-bold ${item.inverse && item.score > 40 ? 'text-destructive' : 'text-primary'}`}>
                                {item.score.toFixed(1)}%
                            </p>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-muted/50 rounded-lg text-left">
                  <h4 className="font-semibold mb-2">Recommendation</h4>
                  <p className="text-sm text-muted-foreground">{analysis.recommendation}</p>
                </div>

                <div className="flex gap-4">
                    <Button variant="outline" onClick={resetTest} className="w-full">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Test Again
                    </Button>
                    <Button onClick={() => router.push(`/results/${analysis.id}`)} className="w-full">
                        View Full Report
                    </Button>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
