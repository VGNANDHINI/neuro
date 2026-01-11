'use client';
import { Logo } from '@/components/logo';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import type { AppUser, TestResult } from '@/lib/types';
import { format } from 'date-fns';
import { Activity, Hand, Mic } from 'lucide-react';

interface ReportLayoutProps {
  user: AppUser;
  test: TestResult;
  chartData: { subject: string; value: number; fullMark: number }[];
  scoreCards: { label: string; value: number | string | undefined }[];
}

export function ReportLayout({ user, test, chartData, scoreCards }: ReportLayoutProps) {
  const getRiskClasses = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const testIcons: { [key: string]: React.ReactNode } = {
    spiral: <Activity className="h-6 w-6" />,
    voice: <Mic className="h-6 w-6" />,
    tapping: <Hand className="h-6 w-6" />,
  };
  
  return (
    <div className="bg-white text-gray-900 font-sans p-4">
      <header className="mb-8">
        <div className="flex justify-between items-start pb-4 border-b-2 border-gray-200">
            <div>
                <Logo className="text-black"/>
                <p className="text-gray-500 text-sm mt-1">Neurological Health Assessment Report</p>
            </div>
            <div className="text-right">
                <p className="font-bold">Report Generated</p>
                <p className="text-sm text-gray-600">{format(new Date(), 'MMMM d, yyyy')}</p>
            </div>
        </div>
      </header>
      
      <main>
        <section className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Patient Information</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div><span className="font-semibold">Name:</span> {user.name}</div>
            <div><span className="font-semibold">Email:</span> {user.email}</div>
            <div><span className="font-semibold">Age:</span> {user.age || 'N/A'}</div>
            <div><span className="font-semibold">Gender:</span> {user.gender || 'N/A'}</div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Test Result Details</h2>
          
          <Card className="mb-6 bg-white border-gray-200 shadow-md">
            <CardHeader className="flex flex-row items-start justify-between bg-gray-50">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="text-blue-600">{testIcons[test.testType]}</div>
                        <h3 className="text-2xl font-bold capitalize">{test.testType} Test Report</h3>
                    </div>
                    <CardDescription className="text-gray-600 mt-1">
                        Test taken on {format(new Date(test.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                    </CardDescription>
                </div>
                <Badge className={`px-3 py-1 text-base ${getRiskClasses(test.riskLevel)}`} variant="outline">
                    {test.riskLevel} Risk
                </Badge>
            </CardHeader>
          </Card>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-3 lg:col-span-2">
                <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader><CardTitle>Score Breakdown</CardTitle></CardHeader>
                    <CardContent>
                        <div className="w-full h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                    <PolarGrid stroke="#e5e7eb" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 14 }} />
                                    <Radar name="Score" dataKey="value" stroke="#2E47CC" fill="#2E47CC" fillOpacity={0.6} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="col-span-3 lg:col-span-1 space-y-6">
                <Card className="bg-white border-gray-200 shadow-md text-center">
                    <CardHeader><CardTitle>Overall Score</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-7xl font-bold text-blue-700">
                            {test.overallScore.toFixed(1)}
                        </p>
                        <p className="text-gray-500">out of 100</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader><CardTitle>AI-Generated Recommendation</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-gray-600 text-sm">{test.recommendation}</p>
                    </CardContent>
                </Card>
            </div>
          </div>
          
          <Card className="mt-6 bg-white border-gray-200 shadow-md">
            <CardHeader><CardTitle>Detailed Metrics</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {scoreCards.map(metric => (
                    <div key={metric.label} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-500">{metric.label}</p>
                        <p className="text-2xl font-bold text-gray-800">{metric.value}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
        </section>
      </main>

      <footer className="mt-12 pt-4 border-t-2 border-gray-200 text-center">
        <p className="text-xs text-gray-500">
            Disclaimer: NeuroAI Health is not a medical device and should not be used for diagnosis. This report is for informational purposes only. Always consult with a qualified healthcare professional for any health concerns.
        </p>
         <p className="text-xs text-gray-500 mt-1">&copy; {new Date().getFullYear()} NeuroAI Health. All rights reserved.</p>
      </footer>
    </div>
  );
}
