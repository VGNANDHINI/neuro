import { VoiceTestClient } from '@/components/tests/voice-test-client';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function VoiceTestPage() {
  return (
    <div className="p-4 md:p-8">
        <div className="flex items-center mb-6">
            <Link href="/dashboard" className="p-2 hover:bg-muted rounded-full mr-2">
                <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
                <h1 className="text-3xl font-bold font-headline">Voice Analysis Test</h1>
                <p className="text-muted-foreground">Record a short phrase to analyze vocal biomarkers.</p>
            </div>
        </div>
      <VoiceTestClient />
    </div>
  );
}
