'use client';

import { useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import FilterDashboard from '@/components/filter-dashboard';
import LeaderList from '@/components/leader-list';
import { leaders, type Leader } from '@/data/leaders';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/context/language-context';

export default function RateLeaderPage() {
  const [filteredLeaders, setFilteredLeaders] = useState<Leader[]>(leaders.filter(l => l.electionType === 'national'));
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-8 max-w-3xl">
          <h1 className="font-headline text-3xl font-extrabold text-primary">{t('findAndRate.heading')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('findAndRate.subheading')}
          </p>
        </div>
        
        <FilterDashboard allLeaders={leaders} onFilterChange={setFilteredLeaders} />

        <div className="mt-12">
          {filteredLeaders.length > 0 && (
            <>
              <h2 className="text-2xl font-bold font-headline mb-4">
                {t('leaderList.resultsTitle')}
              </h2>
              <Separator className="mb-8" />
            </>
          )}
          <LeaderList leaders={filteredLeaders} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
