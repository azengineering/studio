'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import LeaderList from '@/components/leader-list';
import { getLeaders, type Leader } from '@/data/leaders';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/context/language-context';
import SearchFilter from '@/components/search-filter';

type ElectionType = 'national' | 'state' | 'panchayat' | '';

export default function RateLeaderPage() {
  const { t } = useLanguage();
  const [allLeaders, setAllLeaders] = useState<Leader[]>([]);
  const [filteredLeaders, setFilteredLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    const fetchLeaders = async () => {
      const leadersFromStorage = await getLeaders();
      setAllLeaders(leadersFromStorage);
      setFilteredLeaders(leadersFromStorage);
    };
    fetchLeaders();
  }, []);

  const handleSearch = (filters: { electionType: ElectionType; searchTerm: string; candidateName: string; }) => {
    const { electionType, searchTerm, candidateName } = filters;

    const trimmedCandidateName = candidateName.trim().toLowerCase();
    const trimmedSearchTerm = searchTerm.trim().toLowerCase();

    let results = allLeaders;

    if (trimmedCandidateName) {
      // If candidate name is provided, use it as the primary filter.
      results = allLeaders.filter(leader => 
        leader.name.toLowerCase().includes(trimmedCandidateName)
      );
    } else {
      // Otherwise, filter by election type and constituency.
      let locationFiltered = allLeaders;

      if (electionType) {
        locationFiltered = locationFiltered.filter(leader => leader.electionType === electionType);
      }
      
      if (trimmedSearchTerm) {
        locationFiltered = locationFiltered.filter(leader => 
          leader.constituency.toLowerCase().includes(trimmedSearchTerm)
        );
      }
      results = locationFiltered;
    }

    setFilteredLeaders(results);
  };

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

        <SearchFilter onSearch={handleSearch} />
        
        <div className="mt-12">
          {allLeaders.length > 0 && (
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
