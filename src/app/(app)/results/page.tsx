'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getAllTests } from '@/lib/actions/data';
import type { TestResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Activity, ChevronDown, Filter, Mic, FileText, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ResultsPage() {
  const { appUser, loading: authLoading } = useAuth();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'spiral' | 'voice'>('all');
  const router = useRouter();

  useEffect(() => {
    if (appUser) {
      setLoading(true);
      getAllTests(appUser.id).then((data) => {
        setTests(data);
        setLoading(false);
      });
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [appUser, authLoading]);

  const filteredTests = useMemo(() => {
    if (filter === 'all') return tests;
    return tests.filter(test => test.testType === filter);
  }, [tests, filter]);

  const getRiskClasses = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'Moderate': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'High': return 'bg-red-500/10 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };
  
  const TestIcon = ({ type }: { type: string }) => {
    const icons: { [key: string]: JSX.Element } = {
        spiral: <Activity className="h-5 w-5 text-primary" />,
        voice: <Mic className="h-5 w-5 text-primary" />,
    };
    return icons[type] || null;
  }

  const renderSkeleton = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
            <Card key={i}>
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-8 w-24" />
                </CardContent>
            </Card>
        ))}
    </div>
  );

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold font-headline">Test Results</h1>
            <p className="text-muted-foreground">Review your completed assessments.</p>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter: <span className="capitalize ml-1 font-semibold">{filter}</span>
                    <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilter('all')}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('spiral')}>Spiral</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('voice')}>Voice</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {loading || authLoading ? renderSkeleton() : 
        filteredTests.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTests.map((test) => (
                <Card key={test.id} className="flex flex-col hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                             <div className="p-3 bg-muted rounded-full">
                                <TestIcon type={test.testType} />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-semibold capitalize">{test.testType} Test</CardTitle>
                                <p className="text-sm text-muted-foreground">{format(new Date(test.createdAt), 'PPP')}</p>
                            </div>
                        </div>
                         <Badge className={getRiskClasses(test.riskLevel)} variant="outline">
                            {test.riskLevel}
                        </Badge>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-end">
                        <div className="flex items-end justify-between mb-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Score</p>
                                <p className="text-4xl font-bold text-primary">{test.overallScore.toFixed(1)}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/results/${test.id}`)}>
                                View Report <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                ))}
            </div>
        ) : (
            <div className="text-center p-16 bg-card rounded-lg border">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No Tests Found</h3>
                <p className="text-muted-foreground mt-2">
                    You have not completed any {filter !== 'all' ? filter : ''} tests yet.
                </p>
            </div>
        )
      }
    </div>
  );
}
