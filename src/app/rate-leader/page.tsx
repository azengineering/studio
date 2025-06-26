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
      <main className="flex-grow">
        <section className="bg-secondary/50 py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-primary">{t('findAndRate.heading')}</h1>
              <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
                {t('findAndRate.subheading')}
              </p>
            </div>
            <FilterDashboard allLeaders={leaders} onFilterChange={setFilteredLeaders} />
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {filteredLeaders.length > 0 && (
              <>
                <h2 className="text-2xl md:text-3xl font-bold font-headline mb-8">
                  {t('leaderList.resultsTitle')}
                </h2>
                <Separator className="mb-8" />
              </>
            )}
            <LeaderList leaders={filteredLeaders} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
