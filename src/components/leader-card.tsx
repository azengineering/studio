
'use client';

import Image from 'next/image';
import React, { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Leader as LeaderType } from '@/data/leaders';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Twitter, Eye, Edit, ChevronDown } from 'lucide-react';
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
import ReviewsDialog from './reviews-dialog';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Separator } from './ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { cn } from '@/lib/utils';

interface LeaderCardProps {
  leader: LeaderType;
  isEditable?: boolean;
  onEdit?: () => void;
  variant?: 'default' | 'compact';
}

export default function LeaderCard({ leader: initialLeader, isEditable = false, onEdit, variant = 'default' }: LeaderCardProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [leader, setLeader] = useState(initialLeader);
  const [isRatingDialogOpen, setRatingDialogOpen] = useState(false);
  const [isReviewsDialogOpen, setReviewsDialogOpen] = useState(false);
  const [isLoginAlertOpen, setLoginAlertOpen] = useState(false);

  const genderText = leader.gender.charAt(0).toUpperCase() + leader.gender.slice(1);
  const isCompact = variant === 'compact';

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
  
  const electionPerformance = useMemo(() => {
    if (!leader.previousElections || leader.previousElections.length === 0) {
      return null;
    }
    const total = leader.previousElections.length;
    const wins = leader.previousElections.filter(e => e.status === 'winner').length;
    const losses = total - wins;
    return {
      total,
      wins,
      losses,
      data: [
        { name: 'Wins', value: wins, color: '#22c55e' }, // green-500
        { name: 'Losses', value: losses, color: '#ef4444' }, // red-500
      ],
    };
  }, [leader.previousElections]);

  return (
    <>
      <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg rounded-xl border">
        <CardContent className={cn("p-4 flex-grow flex flex-col", isCompact && "p-3")}>
          <div className="flex gap-4 items-start mb-4">
              <Image
                  src={leader.photoUrl || 'https://placehold.co/400x400.png'}
                  alt={`Portrait of ${leader.name}`}
                  width={isCompact ? 48 : 64}
                  height={isCompact ? 48 : 64}
                  className="rounded-full border-2 border-primary/50 object-cover"
                  data-ai-hint={`${leader.gender} indian politician`}
              />
              <div className="flex-1">
                  <div className="flex justify-between items-start">
                      <h2 className={cn("font-headline font-bold text-xl", isCompact && "text-base")}>
                          {leader.name}
                      </h2>
                      {isEditable && onEdit && (
                        <Button variant="ghost" size="icon" className={cn("h-8 w-8", isCompact && "h-7 w-7")} onClick={onEdit}>
                            <Edit className="h-4 w-4 text-primary" />
                            <span className="sr-only">Edit Leader</span>
                        </Button>
                      )}
                  </div>
                  <p className={cn("text-sm text-muted-foreground", isCompact && "text-xs")}>
                      {genderText}, {leader.age} yrs old
                  </p>
                  <div className="flex items-center gap-1 text-amber-500 mt-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span className={cn("font-bold text-foreground text-sm", isCompact && "text-xs")}>{leader.rating.toFixed(1)}</span>
                       <button
                          onClick={() => !isCompact && leader.reviewCount > 0 && setReviewsDialogOpen(true)}
                          className={cn("flex items-center gap-1 text-muted-foreground text-xs ml-1 hover:underline hover:text-primary disabled:no-underline disabled:cursor-default", isCompact && "pointer-events-none")}
                          disabled={leader.reviewCount === 0}
                          aria-label={`View ${leader.reviewCount} reviews`}
                        >
                          <span>({leader.reviewCount} {t('leaderCard.reviews')})</span>
                          {!isCompact && leader.reviewCount > 0 && <Eye className="h-3 w-3" />}
                        </button>
                  </div>
              </div>
          </div>

          <div className={cn("space-y-2 text-sm border-t pt-4 flex-grow", isCompact && "space-y-1 text-xs pt-2")}>
              <div className="flex items-baseline gap-2">
                  <span className="text-muted-foreground">Party:</span>
                  <p className="font-semibold text-foreground truncate">{leader.partyName}</p>
              </div>
               <div className="flex items-baseline gap-2">
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-semibold capitalize text-foreground">{t(`filterDashboard.${leader.electionType}`)}</p>
              </div>
              <div className="flex items-baseline gap-2">
                  <span className="text-muted-foreground">State:</span>
                  <p className="font-semibold text-foreground">{leader.location.state}</p>
              </div>
              <div className="flex items-baseline gap-2">
                  <span className="text-muted-foreground">Constituency:</span>
                  <p className="font-semibold text-foreground truncate">{leader.constituency}</p>
              </div>
          </div>

          {!isCompact && (
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
                           <AlertDialogContent className="sm:max-w-3xl">
                              <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Election History for <span className="text-primary font-bold">{leader.name}</span>
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This table shows the past election participation records available for this leader.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              
                              <div className="max-h-[40vh] overflow-y-auto">
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
                                                    {election.status === 'winner' ? (
                                                        <Badge className="capitalize bg-green-600 hover:bg-green-700 text-primary-foreground border-transparent">
                                                            {election.status}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="destructive" className="capitalize">
                                                            {election.status}
                                                        </Badge>
                                                    )}
                                                  </TableCell>
                                              </TableRow>
                                          ))}
                                      </TableBody>
                                  </Table>
                              </div>

                              {electionPerformance && (
                                <Collapsible className="mt-4">
                                  <CollapsibleTrigger asChild>
                                      <Button variant="link" className="text-primary p-0 h-auto flex items-center gap-1 data-[state=open]:font-bold text-sm">
                                          View Performance Analysis
                                          <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                                      </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-4 animate-in fade-in-0 zoom-in-95">
                                      <Card className="bg-secondary/30">
                                          <CardHeader>
                                              <CardTitle className="text-center text-xl font-headline">Performance Analysis</CardTitle>
                                          </CardHeader>
                                          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                              <div className="w-full h-52">
                                                  <ResponsiveContainer width="100%" height="100%">
                                                      <PieChart>
                                                          <Pie
                                                              data={electionPerformance.data}
                                                              dataKey="value"
                                                              nameKey="name"
                                                              cx="50%"
                                                              cy="50%"
                                                              outerRadius={80}
                                                              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                                          >
                                                              {electionPerformance.data.map((entry) => (
                                                                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                                                              ))}
                                                          </Pie>
                                                          <Tooltip
                                                              cursor={{ fill: 'hsla(var(--muted))' }}
                                                              contentStyle={{
                                                                  background: 'hsl(var(--background))',
                                                                  borderRadius: 'var(--radius)',
                                                                  border: '1px solid hsl(var(--border))'
                                                              }}
                                                          />
                                                          <Legend iconType="circle" />
                                                      </PieChart>
                                                  </ResponsiveContainer>
                                              </div>
                                              <div className="space-y-4">
                                                  <p className="text-lg font-bold text-center md:text-left">Total Elections Fought: {electionPerformance.total}</p>
                                                  <Separator />
                                                  <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                                                    <p className="flex items-center gap-2 text-lg"><span className="w-3 h-3 rounded-full bg-green-500"></span> <span className="font-bold">{electionPerformance.wins}</span> Wins</p>
                                                    <p className="flex items-center gap-2 text-lg"><span className="w-3 h-3 rounded-full bg-red-500"></span> <span className="font-bold">{electionPerformance.losses}</span> Losses</p>
                                                  </div>
                                              </div>
                                          </CardContent>
                                      </Card>
                                  </CollapsibleContent>
                                </Collapsible>
                              )}

                              <AlertDialogFooter>
                                  <AlertDialogCancel>Close</AlertDialogCancel>
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
          )}
        </CardContent>

        {!isCompact && (
        <CardFooter className="p-2 bg-secondary/50 border-t flex justify-center">
            <Button size="sm" className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-px" onClick={handleRateClick}>
                <Star className="mr-2 h-4 w-4" /> {t('leaderCard.addRatingAndComment')}
            </Button>
        </CardFooter>
        )}
      </Card>

      {!isCompact && user && (
          <RatingDialog
              leader={leader}
              open={isRatingDialogOpen}
              onOpenChange={setRatingDialogOpen}
              onRatingSuccess={handleRatingSuccess}
          />
      )}

      {!isCompact && (
        <ReviewsDialog 
          leader={leader} 
          open={isReviewsDialogOpen} 
          onOpenChange={setReviewsDialogOpen}
          onAddReview={() => {
              setReviewsDialogOpen(false);
              setRatingDialogOpen(true);
          }}
        />
      )}

      {!isCompact && (
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
                <AlertDialogAction onClick={() => router.push(`/login?redirect=${pathname}`)}>
                    {t('auth.login')}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
