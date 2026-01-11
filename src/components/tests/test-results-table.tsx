'use client';
import { useState, useEffect } from 'react';
import { getAllTests } from '@/lib/actions/data';
import type { TestResult } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Activity, Mic, FileText, Hand } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function TestResultsTable({ userId }: { userId: string }) {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      getAllTests(userId)
        .then((data) => {
          setTests(data);
        })
        .catch((error) => {
          console.error('Failed to fetch tests:', error);
          setTests([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [userId]);

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
      spiral: <Activity className="h-5 w-5" />,
      voice: <Mic className="h-5 w-5" />,
      tapping: <Hand className="h-5 w-5" />,
    };
    return icons[type] || <FileText className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Test Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead className="text-center">Risk Level</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="text-center p-16">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold">No Tests Completed</h3>
        <p className="text-muted-foreground mt-2">
          You have not completed any tests yet.
        </p>
      </div>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Test Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-center">Score</TableHead>
            <TableHead className="text-center">Risk Level</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tests.map((test) => (
            <TableRow key={test.id}>
              <TableCell>
                <div className="flex items-center gap-3 font-medium">
                  <TestIcon type={test.testType} />
                  <span className="capitalize">{test.testType} Test</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(test.createdAt), 'PPP p')}
              </TableCell>
              <TableCell className="text-center font-semibold text-lg">
                {test.overallScore.toFixed(1)}
              </TableCell>
              <TableCell className="text-center">
                <Badge className={getRiskClasses(test.riskLevel)} variant="outline">
                  {test.riskLevel}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/results/${test.id}`)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
