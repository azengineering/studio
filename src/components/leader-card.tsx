
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Leader as LeaderType } from '@/data/leaders';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Twitter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/language-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from '@/context/auth-context';
import RatingDialog from './rating-dialog';

interface LeaderCardProps {
  leader: LeaderType;
}

export default function LeaderCard({ leader: initialLeader }: LeaderCardProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const [leader, setLeader] = useState(initialLeader);
  const [isRatingDialogOpen, setRatingDialogOpen] = useState(false);
  const [isLoginAlertOpen, setLoginAlertOpen] = useState(false);

  const genderText = leader.gender.charAt(0).toUpperCase() + leader.gender.slice(1);

  const handleRateClick = () => {
    if (user) {
      setRatingDialogOpen(true);
    } else {
      setLoginAlertOpen(true);
    }
  };

  const handleRatingSuccess = (updatedLeader: LeaderType) => {
    setLeader(updatedLeader);
  };

  return (
    <>
      <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg rounded-xl border">
        <CardContent className="p-4 flex-grow flex flex-col">
          <div className="flex gap-4 items-start mb-4">
              <Image
                  src={leader.photoUrl || 'https://placehold.co/400x400.png'}
                  alt={`Portrait of ${leader.name}`}
                  width={64}
                  height={64}
                  className="rounded-full border-2 border-primary/50 object-cover"
                  data-ai-hint={`${leader.gender} indian politician`}
              />
              <div className="flex-1">
                  <div className="flex justify-between items-start">
                      <h2 className="font-headline text-xl font-bold">
                          {leader.name}
                      </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                      {genderText}, {leader.age} yrs old
                  </p>
                  <div className="flex items-center gap-1 text-amber-500 mt-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-bold text-foreground text-sm">{leader.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground text-xs ml-1">({leader.reviewCount} {t('leaderCard.reviews')})</span>
                  </div>
              </div>
          </div>

          <div className="space-y-2 text-sm border-t pt-4 flex-grow">
              <div className="flex items-baseline gap-2">
                  <span className="text-muted-foreground">Party Name:</span>
                  <p className="font-semibold text-foreground">{leader.partyName}</p>
              </div>
               <div className="flex items-baseline gap-2">
                  <span className="text-muted-foreground">Election Type:</span>
                  <p className="font-semibold capitalize text-foreground">{t(`filterDashboard.${leader.electionType}`)}</p>
              </div>
              <div className="flex items-baseline gap-2">
                  <span className="text-muted-foreground">State:</span>
                  <p className="font-semibold text-foreground">{leader.location.state}</p>
              </div>
              <div className="flex items-baseline gap-2">
                  <span className="text-muted-foreground">Constituency:</span>
                  <p className="font-semibold text-foreground">{leader.constituency}</p>
              </div>
          </div>

          <div className="border-t pt-4 mt-auto">
              <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-4">
                      {leader.manifestoUrl && (
                          <a href={leader.manifestoUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                              Manifesto
                          </a>
                      )}
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <button
                                  disabled={!leader.previousElections || leader.previousElections.length === 0}
                                  className="font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                              >
                                  Election Records
                              </button>
                          </AlertDialogTrigger>
                           <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Election History for {leader.name}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This table shows the past election participation records available for this leader.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="max-h-[60vh] overflow-y-auto">
                                  <Table>
                                      <TableHeader>
                                          <TableRow>
                                              <TableHead>Year</TableHead>
                                              <TableHead>Election</TableHead>
                                              <TableHead>Party</TableHead>
                                              <TableHead>Constituency</TableHead>
                                              <TableHead>Status</TableHead>
                                          </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                          {leader.previousElections.map((election, index) => (
                                              <TableRow key={index}>
                                                  <TableCell>{election.electionYear}</TableCell>
                                                  <TableCell className="capitalize">{election.electionType}</TableCell>
                                                  <TableCell>{election.partyName}</TableCell>
                                                  <TableCell>{election.constituency}</TableCell>
                                                  <TableCell>
                                                      <Badge variant={election.status === 'winner' ? 'default' : 'destructive'} className="capitalize">
                                                          {election.status}
                                                      </Badge>
                                                  </TableCell>
                                              </TableRow>
                                          ))}
                                      </TableBody>
                                  </Table>
                              </div>
                              <AlertDialogFooter>
                                  <AlertDialogAction>Close</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                  </div>
                   {leader.twitterUrl && (
                      <a href={leader.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                          <Twitter className="h-4 w-4" />
                          <span className="sr-only">X/Twitter Profile</span>
                      </a>
                  )}
              </div>
          </div>
        </CardContent>

        <CardFooter className="p-2 bg-secondary/50 border-t">
            <Button size="sm" className="w-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-px" onClick={handleRateClick}>
                <Star className="mr-2 h-4 w-4" /> {t('leaderCard.ratesAndComment')}
            </Button>
        </CardFooter>
      </Card>

      {user && (
          <RatingDialog
              leader={leader}
              open={isRatingDialogOpen}
              onOpenChange={setRatingDialogOpen}
              onRatingSuccess={handleRatingSuccess}
          />
      )}

      <AlertDialog open={isLoginAlertOpen} onOpenChange={setLoginAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle>{t('auth.requiredTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                  {t('auth.rateLoginRequired')}
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
    </>
  );
}
