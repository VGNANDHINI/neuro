'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle,
  Award,
  Shield,
  Activity,
  Mic,
  Hand,
  Timer,
  ChevronRight,
  FileText,
  Waves,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

function LiveTremorStatus() {
  const { appUser } = useAuth();
  const [status, setStatus] = useState<'listening' | 'no-data' | 'receiving'>('listening');

  useEffect(() => {
    if (!appUser) return;
    const docRef = doc(db, 'tremor_live', appUser.id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().tremor_frequency) {
        setStatus('receiving');
      } else {
        setStatus('no-data');
      }
    }, (error) => {
      console.error("Error listening to live tremor data:", error);
      setStatus('no-data');
    });
    return () => unsubscribe();
  }, [appUser]);

  const statusInfo = {
      receiving: { text: "Live data receiving", color: "text-green-400", pulse: true },
      listening: { text: "Connecting to device...", color: "text-yellow-400", pulse: false },
      'no-data': { text: "Device not connected", color: "text-muted-foreground", pulse: false },
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Live Tremor Status</CardTitle>
        <Waves className="h-5 w-5 text-blue-400" />
      </CardHeader>
      <CardContent>
        {status === 'listening' ? (
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${status === 'receiving' ? 'bg-green-500 animate-pulse' : 'bg-muted'}`}></div>
              <p className={statusInfo[status].color}>{statusInfo[status].text}</p>
            </div>
            <Button asChild variant="outline" className="w-full mt-4">
                <Link href="/tremor">View Full Analysis <ChevronRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}


export default function DashboardPage() {
    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold font-headline mb-8">Dashboard</h1>
            <p className="text-muted-foreground -mt-8 mb-8">
                A quick overview of your health status.
            </p>
            <DashboardContent />
        </div>
    );
}

function DashboardContent() {
    const fakeStats = {
      totalTests: 12,
      averageScore: 82.4,
      currentRisk: 'Low',
      recentTests: [
        { id: '1', testType: 'spiral', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), riskLevel: 'Low' },
        { id: '2', testType: 'voice', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), riskLevel: 'Low' },
        { id: '3', testType: 'tapping', createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), riskLevel: 'Moderate' },
        { id: '4', testType: 'spiral', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), riskLevel: 'Low' },
      ],
    };

    const stats = fakeStats;
    
    const quickStats = [
        { label: 'Total Tests', value: stats.totalTests, icon: CheckCircle, color: 'text-green-400' },
        { label: 'Average Score', value: stats.averageScore.toFixed(1), icon: Award, color: 'text-blue-400' },
        { label: 'Current Risk', value: stats.currentRisk, icon: Shield, color: stats.currentRisk === 'Low' ? 'text-green-400' : stats.currentRisk === 'Moderate' ? 'text-yellow-400' : 'text-red-400' },
    ];

    const riskColorClass: { [key: string]: string } = {
        Low: 'bg-green-500/20 text-green-400 border-green-500/30',
        Moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        High: 'bg-red-500/20 text-red-400 border-red-500/30',
        'N/A': 'bg-muted text-muted-foreground',
    };

    return (
        <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {quickStats.map((stat, i) => (
                    <Card key={i} className="hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                           {stat.label === 'Total Tests' ? (
                                <Link href="/results">
                                    <div className={`text-2xl font-bold`}>{stat.value}</div>
                                </Link>
                           ) : (
                             <div className={`text-2xl font-bold ${stat.label === 'Current Risk' ? riskColorClass[stat.value] : ''} inline-block p-1 rounded`}>{stat.value}</div>
                           )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <LiveTremorStatus />

                    <div>
                        <h2 className="text-xl font-bold font-headline mb-4">Start a New Test</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { id: 'spiral', icon: Activity, title: 'Spiral Test' },
                                { id: 'voice', icon: Mic, title: 'Voice Test' },
                                { id: 'tapping', icon: Hand, title: 'Tapping Test' },
                                { id: 'reaction', icon: Timer, title: 'Reaction Test' },
                            ].map((action) => (
                                <Link href={`/tests/${action.id}`} key={action.id} className="group">
                                    <Card className="h-full hover:border-primary transition-colors">
                                        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                                <action.icon className="w-8 h-8 text-primary" />
                                            </div>
                                            <p className="font-semibold">{action.title}</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold font-headline">Recent Activity</h2>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/results">
                                View All <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                        </Button>
                    </div>
                    <Card>
                        <CardContent className="p-4 space-y-4">
                            {stats.recentTests.length > 0 ? (
                                stats.recentTests.map((test) => (
                                    <Link href={`/results/${test.id}`} key={test.id} className="block p-3 rounded-lg hover:bg-muted">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-primary/10 p-2 rounded-full">
                                                    {test.testType === 'spiral' ? <Activity className="h-5 w-5 text-primary" /> : test.testType === 'voice' ? <Mic className="h-5 w-5 text-primary" /> : <Hand className="h-5 w-5 text-primary" />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold capitalize">{test.testType} Test</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(test.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={riskColorClass[test.riskLevel]}>{test.riskLevel}</Badge>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground p-8">
                                    <FileText className="mx-auto h-8 w-8 mb-2" />
                                    <p>No tests completed yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
