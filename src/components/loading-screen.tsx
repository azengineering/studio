'use client';

import React, { useState, useEffect } from 'react';

const quotes = [
  { text: "The ballot is stronger than the bullet.", author: "Abraham Lincoln" },
  { text: "In a democracy, the well-being, individuality and happiness of every citizen is important.", author: "A. P. J. Abdul Kalam" },
  { text: "Let us not seek the Republican answer or the Democratic answer, but the right answer.", author: "John F. Kennedy" },
];


// Welcome Page Component (Enhanced, No Blinking Loader - as preferred by user)
const LoadingScreen = () => {
  const [loadingProgress, setLoadingProgress] = useState(0); // State for loading progress
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Simulate loading progress
  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5; // Increment progress
      setLoadingProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 250); // Each step takes 250ms, for a total of 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Cycle through quotes
  useEffect(() => {
    const quoteInterval = setInterval(() => {
        setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }, 2500); // Change quote every 2.5 seconds, matching the animation duration

    return () => clearInterval(quoteInterval);
  }, []);


  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-gray-800 p-6 relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 animate-gradient-shift">
      {/* Decorative elements for subtle motion/depth */}
      <div className="absolute inset-0 z-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="20" cy="20" r="15" fill="url(#grad1)" className="animate-float" style={{ animationDelay: '0s' }} />
          <circle cx="80" cy="50" r="20" fill="url(#grad1)" className="animate-float" style={{ animationDelay: '2s' }} />
          <circle cx="50" cy="85" r="18" fill="url(#grad1)" className="animate-float" style={{ animationDelay: '4s' }} />
        </svg>
      </div>

      <div className="relative z-10 text-center animate-fadeInUp max-w-2xl">
        <h1 className="text-6xl md:text-7xl font-extrabold mb-6 text-blue-800 font-inter tracking-tight leading-tight drop-shadow-sm">
          LeaderMetrics
        </h1>
        <p className="text-xl md:text-2xl mb-12 font-light text-gray-700 leading-relaxed px-4">
          Connecting citizens with their elected representatives for a transparent and accountable democracy.
        </p>
        <div className="w-full max-w-lg bg-gray-200 rounded-full h-3 mb-5 overflow-hidden shadow-inner">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-150 ease-linear"
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>
        <p className="text-lg md:text-xl font-medium text-gray-600">
          Loading your political landscape... <span className="font-bold text-blue-700">{loadingProgress}%</span>
        </p>

        {/* Quotes Section */}
        <div className="mt-12 h-24 flex items-center justify-center px-4">
            <div className="text-center animate-quote-cycle">
                <p className="text-lg italic text-gray-600">"{quotes[currentQuoteIndex].text}"</p>
                <p className="text-md font-semibold text-gray-700 mt-2">- {quotes[currentQuoteIndex].author}</p>
            </div>
        </div>
      </div>

      {/* Tailwind CSS keyframes for animation */}
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

        @keyframes float {
          0% { transform: translateY(0px) translateX(0px); opacity: 0.1; }
          50% { transform: translateY(-10px) translateX(5px); opacity: 0.15; }
          100% { transform: translateY(0px) translateX(0px); opacity: 0.1; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes quote-cycle {
          0%, 100% { opacity: 0; transform: translateY(10px); }
          20%, 80% { opacity: 1; transform: translateY(0); }
        }
        .animate-quote-cycle {
          animation: quote-cycle 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
