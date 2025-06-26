'use client';

import { useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Hero from '@/components/hero';
import HowItWorks from '@/components/how-it-works';
import WhyItMatters from '@/components/why-it-matters';
import FeaturedLeaders from '@/components/featured-leaders';
import FilterDashboard from '@/components/filter-dashboard';
import LeaderList from '@/components/leader-list';
import { leaders, type Leader } from '@/data/leaders';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/context/language-context';

const topRatedLeaders = [...leaders].sort((a, b) => b.rating - a.rating).slice(0, 4);

export default function Home() {
  const [filteredLeaders, setFilteredLeaders] = useState<Leader[]>(leaders.filter(l => l.electionType === 'national'));
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <Hero />
        <HowItWorks />
        <FeaturedLeaders leaders={topRatedLeaders} />
        <WhyItMatters />

        <section id="find-leader-section" className="py-16 md:py-24 bg-background scroll-mt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl md:text-4xl font-extrabold">{t('findAndRate.heading')}</h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                {t('findAndRate.subheading')}
              </p>
            </div>
            <FilterDashboard allLeaders={leaders} onFilterChange={setFilteredLeaders} />
            <Separator className="my-12" />
            <LeaderList leaders={filteredLeaders} />
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
