"use client";

import { Scale } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // This timer simulates loading progress for a better visual effect.
    const timer = setInterval(() => {
        setProgress((prev) => {
            if (prev >= 95) {
                clearInterval(timer);
                return 95;
            }
            return prev + 5;
        });
    }, 200);

    return () => {
        clearInterval(timer);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      <div className="w-full max-w-sm text-center">
        <div className="flex flex-col items-center gap-6">
            <div className="p-4 bg-primary/10 rounded-full">
                <Scale className="w-20 h-20 text-primary animate-balance" />
            </div>
            <h1 className="text-5xl font-headline font-bold text-primary">PolitiRate</h1>
            <p className="text-lg text-muted-foreground">Weighing the scales of democracy...</p>
        </div>
        <div className="mt-12 px-4">
            <Progress value={progress} className="h-2 bg-primary/20" />
            <p className="text-sm mt-2 text-muted-foreground">Loading application...</p>
        </div>
      </div>
    </div>
  );
}
