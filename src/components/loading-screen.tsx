'use client';

import React, { useState, useEffect } from 'react';

// Loading Screen Component based on user-provided code, adapted for project consistency.
export default function LoadingScreen() {
  const [loadingProgress, setLoadingProgress] = useState(0); // State for loading progress

  // Simulate loading progress for ~5 seconds
  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2; // Increment progress
      setLoadingProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 100); // Update every 100ms for a smoother animation
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-foreground p-6 relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 animate-gradient-shift">
      <div className="relative z-10 text-center animate-fadeInUp max-w-2xl">
        <h1 className="text-6xl md:text-7xl font-extrabold mb-6 text-primary font-headline tracking-tight leading-tight drop-shadow-sm">
          PolitiRate
        </h1>
        <p className="text-xl md:text-2xl mb-12 font-light text-muted-foreground leading-relaxed px-4">
          Connecting citizens with their elected representatives for a transparent and accountable democracy.
        </p>
        <div className="w-full max-w-lg bg-secondary rounded-full h-3 mb-5 overflow-hidden shadow-inner">
          <div
            className="bg-primary h-full rounded-full transition-all duration-150 ease-linear"
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>
        <p className="text-lg md:text-xl font-medium text-muted-foreground">
          Loading your political landscape... <span className="font-bold text-primary">{loadingProgress}%</span>
        </p>
      </div>

      {/* Animations from user-provided code */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 1s ease-out;
        }

        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 10s ease infinite;
        }
      `}</style>
    </div>
  );
};
