import { TremorPageClient } from './tremor-page-client';

export default function TremorAnalysisPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Real-time Tremor Analysis</h1>
        <p className="text-muted-foreground">
          View live and historical data from your wearable device.
        </p>
      </div>
      <TremorPageClient />
    </div>
  );
}
