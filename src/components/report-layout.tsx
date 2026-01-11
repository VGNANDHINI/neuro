'use client';
import { Logo } from '@/components/logo';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
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
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low':
        return '#10B981'; // Green-500
      case 'Moderate':
        return '#F59E0B'; // Amber-500
      case 'High':
        return '#EF4444'; // Red-500
      default:
        return '#6B7280'; // Gray-500
    }
  };

  const testIcons: { [key: string]: React.ReactNode } = {
    spiral: <Activity className="h-6 w-6" />,
    voice: <Mic className="h-6 w-6" />,
    tapping: <Hand className="h-6 w-6" />,
  };
  
  return (
    <div className="bg-white text-black font-sans p-4">
      <header className="mb-8 pb-4 border-b-2 border-gray-200">
        <div className="flex justify-between items-start">
            <div>
                <Logo className="text-black"/>
                <p className="text-gray-600 text-sm mt-1">Neurological Health Assessment Report</p>
            </div>
            <div className="text-right">
                <p className="font-bold">Report Generated</p>
                <p className="text-sm text-gray-600">{format(new Date(), 'MMMM d, yyyy')}</p>
            </div>
        </div>
      </header>
      
      <main>
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3 pb-2 border-b">Patient Information</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div><span className="font-semibold">Name:</span> {user.name}</div>
            <div><span className="font-semibold">Email:</span> {user.email}</div>
            <div><span className="font-semibold">Age:</span> {user.age || 'N/A'}</div>
            <div><span className="font-semibold">Gender:</span> {user.gender || 'N/A'}</div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 pb-2 border-b">Test Result Details</h2>
          
          <div className="mb-6">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="text-blue-600">{testIcons[test.testType]}</div>
                        <h3 className="text-2xl font-bold capitalize">{test.testType} Test Report</h3>
                    </div>
                    <p className="text-gray-600 mt-1">
                        Test taken on {format(new Date(test.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                </div>
                <div className="text-right">
                    <p className="font-semibold">Risk Level</p>
                    <p className="text-lg font-bold" style={{ color: getRiskColor(test.riskLevel) }}>
                        {test.riskLevel} Risk
                    </p>
                </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2">
                <h3 className="text-lg font-bold mb-2">Score Breakdown</h3>
                <div className="w-full h-80 border rounded-lg p-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 14 }} />
                            <Radar name="Score" dataKey="value" stroke="#2E47CC" fill="#2E47CC" fillOpacity={0.6} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="col-span-1 space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-center mb-2">Overall Score</h3>
                    <div className="text-center">
                        <p className="text-7xl font-bold text-blue-700">
                            {test.overallScore.toFixed(1)}
                        </p>
                        <p className="text-gray-500">out of 100</p>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-bold mb-2">AI-Generated Recommendation</h3>
                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg border">{test.recommendation}</p>
                </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-2">Detailed Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {scoreCards.map(metric => (
                    <div key={metric.label} className="p-3 bg-gray-50 rounded-lg border">
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
