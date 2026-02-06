'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Waves, Zap } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export function LiveTremorMonitor() {
  const { appUser } = useAuth();
  const [tremorData, setTremorData] = useState<{ frequency: number; amplitude: number } | null>(null);
  const [status, setStatus] = useState<'listening' | 'no-data' | 'receiving'>('listening');

  useEffect(() => {
    if (!appUser) return;

    const docRef = doc(db, 'tremor_live', appUser.id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTremorData({
          frequency: data.tremor_frequency || 0,
          amplitude: data.tremor_amplitude || 0,
        });
        setStatus('receiving');
      } else {
        setStatus('no-data');
        setTremorData(null);
      }
    }, (error) => {
      console.error("Error listening to live tremor data:", error);
      setStatus('no-data');
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [appUser]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Tremor Monitoring</CardTitle>
      </CardHeader>
      <CardContent>
        {status === 'listening' && (
            <div className="flex flex-col items-center justify-center h-24">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        )}
        {status === 'no-data' && (
            <div className="text-center text-muted-foreground p-4">
                <p>No live data from device.</p>
                <p className="text-xs">Waiting for ESP32 device to connect and send data...</p>
            </div>
        )}
        {status === 'receiving' && tremorData && (
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Frequency</p>
              <div className="flex items-center justify-center gap-2">
                <Waves className="h-6 w-6 text-blue-400" />
                <p className="text-3xl font-bold font-headline">
                  {tremorData.frequency.toFixed(2)} <span className="text-lg">Hz</span>
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amplitude</p>
               <div className="flex items-center justify-center gap-2">
                 <Zap className="h-6 w-6 text-yellow-400" />
                <p className="text-3xl font-bold font-headline">
                  {Math.round(tremorData.amplitude)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
