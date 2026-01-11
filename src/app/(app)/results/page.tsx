'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getAllTests } from '@/lib/actions/data';
import type { TestResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Activity, ChevronDown, Filter, Hand, Mic, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ResultsPage() {
  const { appUser, loading: authLoading } = useAuth();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'spiral' | 'voice' | 'tapping'>('all');
  const router = useRouter();

  useEffect(() => {
    if (appUser) {
      setLoading(true);
      getAllTests(appUser.id).then((data) => {
        setTests(data);
        setLoading(false);
      });
    }
  }, [appUser]);

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
    const icons = {
        spiral: <Activity className="h-5 w-5 text-primary" />,
        voice: <Mic className="h-5 w-5 text-primary" />,
        tapping: <Hand className="h-5 w-5 text-primary" />,
    };
    return icons[type] || null;
  }

  const renderSkeleton = () => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead className="w-[250px]">Test Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead className="text-right">Overall Score</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
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
                <DropdownMenuItem onClick={() => setFilter('tapping')}>Tapping</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading || authLoading ? renderSkeleton() : 
            filteredTests.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[250px]">Test Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Risk Level</TableHead>
                        <TableHead className="text-right">Overall Score</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTests.map((test) => (
                        <TableRow key={test.id} onClick={() => router.push(`/results/${test.id}`)} className="cursor-pointer">
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded-full">
                                        <TestIcon type={test.testType} />
                                    </div>
                                    <span className="capitalize">{test.testType} Test</span>
                                </div>
                            </TableCell>
                            <TableCell>{format(new Date(test.createdAt), 'PPP p')}</TableCell>
                            <TableCell>
                            <Badge className={getRiskClasses(test.riskLevel)} variant="outline">
                                {test.riskLevel}
                            </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{test.overallScore.toFixed(1)} / 100</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center p-16">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">No Tests Found</h3>
                    <p className="text-muted-foreground mt-2">
                        You have not completed any {filter !== 'all' ? filter : ''} tests yet.
                    </p>
                </div>
            )
          }
        </CardContent>
      </Card>
    </div>
  );
}
