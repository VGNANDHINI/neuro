'use client';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { TestResultsTable } from '@/components/tests/test-results-table';

export default function ResultsPage() {
  const { appUser, loading: authLoading } = useAuth();

  // Show a skeleton loader while authentication is in progress
  if (authLoading) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-3xl font-bold font-headline mb-8">All Test Results</h1>
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
      </div>
    );
  }

  // Once authentication is resolved, render the results table component
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold font-headline mb-8">All Test Results</h1>
      {appUser ? (
        <TestResultsTable userId={appUser.id} />
      ) : (
        <p className="text-muted-foreground">Please log in to see your test results.</p>
      )}
    </div>
  );
}
