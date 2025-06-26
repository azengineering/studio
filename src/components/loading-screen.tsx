"use client";

import { Scale } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const quotes = [
  {
    quote: "The ballot is stronger than the bullet.",
    author: "Abraham Lincoln"
  },
  {
    quote: "Democracy is not a spectator sport.",
    author: "Marian Wright Edelman"
  },
  {
    quote: "The ignorance of one voter in a democracy impairs the security of all.",
    author: "John F. Kennedy"
  },
  {
    quote: "Let us never forget that government is ourselves and not an alien power over us.",
    author: "Franklin D. Roosevelt"
  },
  {
    quote: "Voting is the expression of our commitment to ourselves, one another, this country, and this world.",
    author: "Sharon Salzberg"
  }
];

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
            clearInterval(progressTimer);
            return 98;
        }
        return prev + 2;
      });
    }, 250); // Slower progress

    const quoteTimer = setInterval(() => {
      setQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }, 4000); // Faster quote change

    return () => {
      clearInterval(progressTimer);
      clearInterval(quoteTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-foreground">
      <Image
        src="https://placehold.co/1920x1080.png"
        alt="Indian Parliament Building"
        fill
        className="object-cover z-0 opacity-10"
        data-ai-hint="parliament democracy"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10"></div>
      
      <div className="z-20 flex flex-col items-center justify-center text-center p-8 w-full h-full">
        <div className="flex items-center gap-4 mb-8">
          <Scale className="w-12 h-12 text-primary" />
          <h1 className="text-6xl font-headline font-bold tracking-tight text-primary">PolitiRate</h1>
        </div>
        
        <div className="relative h-32 w-full max-w-4xl flex items-center justify-center overflow-hidden">
          <div key={quoteIndex} className="absolute w-full animate-fade-in-out-slow">
            <blockquote className="text-3xl font-light italic text-muted-foreground">"{quotes[quoteIndex].quote}"</blockquote>
            <p className="mt-4 text-xl text-muted-foreground/80">- {quotes[quoteIndex].author}</p>
          </div>
        </div>

        <div className="w-full max-w-lg mt-auto mb-16">
          <p className="text-sm text-muted-foreground mb-2">Loading your dashboard...</p>
          <Progress value={progress} className="h-1.5 bg-primary/20 [&>div]:bg-primary" />
        </div>
      </div>
    </div>
  );
}
