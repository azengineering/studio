"use client";

import { useState, useEffect } from 'react';
import type { Leader } from '@/data/leaders';
import { leaders as allLeaders } from '@/data/leaders';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Hero from '@/components/hero';
import FilterDashboard from '@/components/filter-dashboard';
import LeaderList from '@/components/leader-list';

export default function Home() {
  const [filteredLeaders, setFilteredLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    // Set initial state for leaders
    setFilteredLeaders(allLeaders.filter(leader => leader.electionType === 'national'));
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Hero />
        <div className="mt-12">
          <FilterDashboard allLeaders={allLeaders} onFilterChange={setFilteredLeaders} />
        </div>
        <div className="mt-8">
          <LeaderList leaders={filteredLeaders} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
