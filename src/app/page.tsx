"use client";

import { useState, useEffect } from 'react';
import type { Leader } from '@/data/leaders';
import { leaders as allLeaders } from '@/data/leaders';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Hero from '@/components/hero';
import FilterDashboard from '@/components/filter-dashboard';
import LeaderList from '@/components/leader-list';
import HowItWorks from '@/components/how-it-works';
import FeaturedLeaders from '@/components/featured-leaders';
import WhyItMatters from '@/components/why-it-matters';

export default function Home() {
  const [filteredLeaders, setFilteredLeaders] = useState<Leader[]>([]);
  const [featuredLeaders, setFeaturedLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    setFilteredLeaders(allLeaders.filter(leader => leader.electionType === 'national'));
    
    const sortedLeaders = [...allLeaders].sort((a, b) => b.rating - a.rating);
    setFeaturedLeaders(sortedLeaders.slice(0, 4));

  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <Hero />
        
        <HowItWorks />

        <FeaturedLeaders leaders={featuredLeaders} />
        
        <WhyItMatters />

        <section id="find-leader-section" className="py-16 md:py-24 bg-secondary/50 scroll-mt-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold">Find & Rate Your Representative</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                        Use the filters below to find leaders at different levels of government.
                    </p>
                </div>
                <FilterDashboard allLeaders={allLeaders} onFilterChange={setFilteredLeaders} />
                <div className="mt-12">
                    <LeaderList leaders={filteredLeaders} />
                </div>
            </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
