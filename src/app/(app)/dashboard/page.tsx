'use client';

import { getDashboardStats } from '@/lib/actions/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle,
  Award,
  Shield,
  Activity,
  Mic,
  Hand,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

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
    const { appUser, loading } = useAuth();
    const [stats, setStats] = React.useState<any>(null);
    const [dataLoading, setDataLoading] = React.useState(true);

    React.useEffect(() => {
        if (appUser) {
            setDataLoading(true);
            getDashboardStats(appUser.id).then(data => {
                setStats(data);
                setDataLoading(false);
            });
        }
    }, [appUser]);

    if (loading || !appUser || dataLoading) {
        return (
            <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {[...Array(3)].map((_, i) => (
                     <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <Skeleton className="h-5 w-24" />
                           <Skeleton className="h-5 w-5" />
                        </CardHeader>
                        <CardContent><Skeleton className="h-8 w-20" /></CardContent>
                    </Card>
                ))}
            </div>
             <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Skeleton className="h-8 w-48 mb-4" />
                    <div className="grid md:grid-cols-3 gap-4">
                        <Skeleton className="h-36 w-full" />
                        <Skeleton className="h-36 w-full" />
                        <Skeleton className="h-36 w-full" />
                    </div>
                </div>
                <div>
                    <Skeleton className="h-8 w-48 mb-4" />
                    <Card><CardContent className="p-4 space-y-4"><Skeleton className="h-32 w-full" /></CardContent></Card>
                </div>
            </div>
            </>
        );
    }
    
    const quickStats = [
        { label: 'Total Tests', value: stats.totalTests, icon: CheckCircle, color: 'text-green-400' },
        { label: 'Average Score', value: stats.averageScore.toFixed(1), icon: Award, color: 'text-blue-400' },
        { label: 'Current Risk', value: stats.currentRisk, icon: Shield, color: stats.currentRisk === 'Low' ? 'text-green-400' : stats.currentRisk === 'Moderate' ? 'text-yellow-400' : 'text-red-400' },
    ];

    const riskColorClass = {
        Low: 'bg-green-500/20 text-green-400 border-green-500/30',
        Moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        High: 'bg-red-500/20 text-red-400 border-red-500/30',
        'N/A': 'bg-muted text-muted-foreground',
    };

    return (
        <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {quickStats.map((stat, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${stat.label === 'Current Risk' ? riskColorClass[stat.value] : ''} inline-block p-1 rounded`}>{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-bold font-headline mb-4">Start a New Test</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { id: 'spiral', icon: Activity, title: 'Spiral Test' },
                            { id: 'voice', icon: Mic, title: 'Voice Test' },
                            { id: 'tapping', icon: Hand, title: 'Tapping Test' },
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
                                                        {formatDistanceToNow(test.createdAt.toDate(), { addSuffix: true })}
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