'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getAllTests } from '@/lib/actions/data';
import type { TestResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Activity, ChevronDown, Filter, Mic, FileText, ChevronRight, Hand } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ResultsPage() {
  const { appUser, loading: authLoading } = useAuth();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Only fetch tests if auth is finished and we have a user
    if (!authLoading && appUser) {
      setPageLoading(true);
      getAllTests(appUser.id)
        .then((data) => {
          setTests(data);
        })
        .finally(() => {
          setPageLoading(false);
        });
    } else if (!authLoading && !appUser) {
      // If auth is done and there's no user, stop loading.
      setPageLoading(false);
    }
  }, [appUser, authLoading]);

  const getRiskClasses = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'Moderate':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'High':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const TestIcon = ({ type }: { type: string }) => {
    const icons: { [key: string]: JSX.Element } = {
      spiral: <Activity className="h-5 w-5 text-primary" />,
      voice: <Mic className="h-5 w-5 text-primary" />,
      tapping: <Hand className="h-5 w-5 text-primary" />,
    };
    return icons[type] || <FileText className="h-5 w-5 text-primary" />;
  };

  const renderSkeleton = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-20" />
              </div>
              <Skeleton className="h-9 w-28" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="p-4 md:p-8">
      {pageLoading ? (
        renderSkeleton()
      ) : tests.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <Card
              key={test.id}
              className="flex flex-col hover:border-primary/50 transition-colors"
            >
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-muted rounded-full">
                    <TestIcon type={test.testType} />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold capitalize">
                      {test.testType} Test
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(test.createdAt), 'PPP')}
                    </p>
                  </div>
                </div>
                <Badge className={getRiskClasses(test.riskLevel)} variant="outline">
                  {test.riskLevel}
                </Badge>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-end">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="text-4xl font-bold text-primary">
                      {test.overallScore.toFixed(1)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/results/${test.id}`)}
                  >
                    View Report <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
            <CardContent className="p-16 text-center">
                 <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No Tests Completed</h3>
                <p className="text-muted-foreground mt-2">
                    You have not completed any tests yet.
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
