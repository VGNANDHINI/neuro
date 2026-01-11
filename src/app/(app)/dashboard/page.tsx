import { AuthGuard } from '@/components/auth-guard';
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
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { redirect } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cookies } from 'next/headers';
import { getAppUser } from '@/lib/actions/data';

async function getUserId() {
    // This is a placeholder for a proper server-side session management
    // In a real app, you would get this from an encrypted cookie or session store
    // For now, we are simulating this.
    // This will break in a real deployed environment without a proper session implementation.
    return '...'; // This part needs a real user ID provider on the server.
}

export default async function DashboardPage() {
    // This is a temporary solution for getting user on server components.
    // Ideally, we'd have a server-side session.
    // This will not work correctly without a way to get the current user's ID on the server.
    // I'm assuming a client component wrapper would provide this.
    // Let's refactor to use a client component to fetch user-specific data.

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

// A client component to fetch and display data
function DashboardContent() {
    'use client';
    const { appUser, loading } = useAuth();
    const [stats, setStats] = React.useState(null);

    React.useEffect(() => {
        if (appUser) {
            getDashboardStats(appUser.id).then(setStats);
        }
    }, [appUser]);

    if (loading || !appUser || !stats) {
        return (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader><div className="h-6 w-3/4 bg-muted rounded"></div></CardHeader>
                        <CardContent><div className="h-10 w-1/2 bg-muted rounded"></div></CardContent>
                    </Card>
                ))}
            </div>
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

import * as React from 'react';
