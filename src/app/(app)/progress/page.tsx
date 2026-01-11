'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getProgressData } from '@/lib/actions/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, BarChart3, CheckCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ProgressPage() {
  const { appUser, loading: authLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30'); 

  useEffect(() => {
    if (appUser) {
      setLoading(true);
      getProgressData(appUser.id, timeframe).then((result) => {
        setData(result);
        setLoading(false);
      });
    }
  }, [appUser, timeframe]);

  if (loading || authLoading) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-6 w-64 mb-8" />
        <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card><Skeleton className="h-24 w-full" /></Card>
            <Card><Skeleton className="h-24 w-full" /></Card>
            <Card><Skeleton className="h-24 w-full" /></Card>
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          <p className="label font-bold">{`${label}`}</p>
          {payload.map(pld => (
            pld.value &&
            <p key={pld.dataKey} style={{ color: pld.color }}>
              <span className="capitalize">{pld.name}: </span>
              <strong>{pld.value.toFixed(1)}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Your Progress</h1>
          <p className="text-muted-foreground">Track your test scores over time.</p>
        </div>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px] mt-4 md:mt-0">
            <SelectValue placeholder="Timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{data?.stats?.total || 0}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{data?.stats?.average?.toFixed(1) || 'N/A'}</div>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trend</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${data?.stats?.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>{data?.stats?.trend.toFixed(1) || '0.0'}%</div>
                <p className="text-xs text-muted-foreground">vs. previous period</p>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Score History</CardTitle>
          <CardDescription>Shows average scores for each test type per day.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            {data && data.progress.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.progress}>
                    <defs>
                        <linearGradient id="colorSpiral" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorVoice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                        </linearGradient>
                         <linearGradient id="colorTapping" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ffc658" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="spiral" stroke="#8884d8" fill="url(#colorSpiral)" name="Spiral Test" connectNulls />
                    <Area type="monotone" dataKey="voice" stroke="#82ca9d" fill="url(#colorVoice)" name="Voice Test" connectNulls />
                    <Area type="monotone" dataKey="tapping" stroke="#ffc658" fill="url(#colorTapping)" name="Tapping Test" connectNulls />
                </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex h-full items-center justify-center text-center">
                    <div>
                        <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold">Not Enough Data</h3>
                        <p className="text-muted-foreground mt-2">Complete more tests to see your progress chart.</p>
                    </div>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
