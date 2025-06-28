
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import LeaderList from '@/components/leader-list';
import { getLeaders, type Leader } from '@/data/leaders';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/context/language-context';
import SearchFilter from '@/components/search-filter';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ElectionType = 'national' | 'state' | 'panchayat' | '';

export default function RateLeaderPage() {
  const { t } = useLanguage();
  const [allLeaders, setAllLeaders] = useState<Leader[]>([]);
  const [filteredLeaders, setFilteredLeaders] = useState<Leader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user } = useAuth();
  const router = useRouter();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  useEffect(() => {
    const fetchAndFilterLeaders = async () => {
      setIsLoading(true);
      const leadersFromStorage = await getLeaders();
      setAllLeaders(leadersFromStorage); // Keep the full list for searching
      
      if (user) {
        const { mpConstituency, mlaConstituency, panchayat, state } = user;
        
        const lowerMp = mpConstituency?.trim().toLowerCase();
        const lowerMla = mlaConstituency?.trim().toLowerCase();
        const lowerPanchayat = panchayat?.trim().toLowerCase();
        const userState = state?.trim();

        const locationBasedLeaders = leadersFromStorage.filter(leader => {
          const leaderConstituency = leader.constituency.trim().toLowerCase();
          const leaderState = leader.location.state?.trim();

          // 1. Match based on user's state
          if (userState && leaderState === userState) {
            return true;
          }

          // 2. Match based on specific constituencies
          if (leader.electionType === 'national' && lowerMp && leaderConstituency === lowerMp) {
            return true;
          }
          if (leader.electionType === 'state' && lowerMla && leaderConstituency === lowerMla) {
            return true;
          }
          if (leader.electionType === 'panchayat' && lowerPanchayat && leaderConstituency === lowerPanchayat) {
            return true;
          }

          return false;
        });

        const uniqueLeaders = Array.from(new Set(locationBasedLeaders.map(l => l.id))).map(id => locationBasedLeaders.find(l => l.id === id)!);
        
        if (uniqueLeaders.length > 0) {
            setFilteredLeaders(uniqueLeaders);
        } else {
            // If user is logged in but has no location info set or no matches found, show all.
            setFilteredLeaders(leadersFromStorage);
        }

      } else {
        // If user is not logged in, show all leaders.
        setFilteredLeaders(leadersFromStorage);
      }

      setIsLoading(false);
    };
    fetchAndFilterLeaders();
  }, [user]);

  const handleAddLeaderClick = () => {
    if (user) {
      router.push('/add-leader');
    } else {
      setShowLoginDialog(true);
    }
  };

  const handleSearch = async (filters: { electionType: ElectionType; searchTerm: string; candidateName: string; }) => {
    setIsLoading(true);
    const { electionType, searchTerm, candidateName } = filters;

    // Use a temporary array for all leaders to ensure we have the latest data
    const currentLeaders = await getLeaders();
    setAllLeaders(currentLeaders);

    const trimmedCandidateName = candidateName.trim().toLowerCase();
    const trimmedSearchTerm = searchTerm.trim().toLowerCase();

    let results = currentLeaders;

    if (trimmedCandidateName) {
      results = currentLeaders.filter(leader => 
        leader.name.toLowerCase().includes(trimmedCandidateName)
      );
    } else {
      let locationFiltered = currentLeaders;

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
    setIsLoading(false);
  };

  const LeaderListSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex flex-col space-y-3">
          <Skeleton className="h-[125px] w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-8 flex justify-between items-start gap-4">
          <div className="max-w-3xl">
            <h1 className="font-headline text-3xl font-extrabold text-primary">{t('findAndRate.heading')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('findAndRate.subheading')}
            </p>
          </div>
          <Button onClick={handleAddLeaderClick} className="hidden sm:inline-flex">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('hero.addNewLeader')}
          </Button>
        </div>

        <SearchFilter onSearch={handleSearch} />
        
        <div className="mt-12">
          {filteredLeaders.length > 0 && !isLoading && (
            <>
              <h2 className="text-2xl font-bold font-headline mb-4">
                {t('leaderList.resultsTitle')}
              </h2>
              <Separator className="mb-8" />
            </>
          )}
          {isLoading ? <LeaderListSkeleton /> : <LeaderList leaders={filteredLeaders} />}
        </div>
        
        <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('auth.requiredTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('auth.requiredDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('auth.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => router.push('/login')}>
                {t('auth.login')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
      <Footer />
    </div>
  );
}
