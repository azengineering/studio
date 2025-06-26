"use client";

import { Scale } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';

const loadingMessages = [
    "Weighing the scales of democracy...",
    "Gathering public sentiment...",
    "Empowering civic engagement...",
    "Finalizing the report card..."
];

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // This timer simulates loading progress for a better visual effect.
    const progressTimer = setInterval(() => {
        setProgress((prev) => {
            if (prev >= 95) {
                clearInterval(progressTimer);
                return 95;
            }
            return prev + 5;
        });
    }, 200);

    const messageTimer = setInterval(() => {
        setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 3000); // Change message every 3 seconds

    return () => {
        clearInterval(progressTimer);
        clearInterval(messageTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-background via-secondary to-background flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Background shapes */}
      <div className="absolute top-[-50px] left-[-50px] w-48 h-48 bg-primary/5 rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-50px] right-[-50px] w-72 h-72 bg-accent/5 rounded-full animate-pulse [animation-delay:500ms]"></div>
      
      <div className="w-full max-w-md text-center backdrop-blur-sm p-8 rounded-lg">
        <div className="flex flex-col items-center gap-6">
            <div className="p-4 bg-primary/10 rounded-full border border-primary/20 shadow-lg">
                <Scale className="w-20 h-20 text-primary animate-balance" />
            </div>
            <h1 className="text-5xl font-headline font-bold text-primary">PolitiRate</h1>
            <div className="h-12 flex items-center justify-center">
                 <p key={messageIndex} className="text-lg text-muted-foreground animate-fade-in-out">
                    {loadingMessages[messageIndex]}
                 </p>
            </div>
        </div>
        <div className="mt-12 px-4">
            <Progress value={progress} className="h-2 bg-primary/20" />
            <p className="text-sm mt-2 text-muted-foreground">Loading application...</p>
        </div>
      </div>
    </div>
  );
}
