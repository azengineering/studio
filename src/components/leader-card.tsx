
'use client';

import Image from 'next/image';
import type { Leader } from '@/data/leaders';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare, Twitter } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from './ui/separator';

interface LeaderCardProps {
  leader: Leader;
}

export default function LeaderCard({ leader }: LeaderCardProps) {
  const { t } = useLanguage();

  const genderText = leader.gender.charAt(0).toUpperCase() + leader.gender.slice(1);

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-xl border">
      <CardContent className="p-4 flex-grow flex flex-col">
        {/* --- Header part --- */}
        <div className="flex gap-4 items-start">
            <Image
                src={leader.photoUrl || 'https://placehold.co/400x400.png'}
                alt={`Portrait of ${leader.name}`}
                width={64}
                height={64}
                className="rounded-full border-2 border-primary/50 object-cover"
                data-ai-hint={`${leader.gender} indian politician`}
            />
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-headline text-xl font-bold leading-tight">
                        {leader.name}
                    </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                    {genderText}, {leader.age} yrs old
                </p>
                <div className="flex items-center gap-1 text-amber-500 pt-1">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold text-foreground text-sm">{leader.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground text-xs ml-1">({leader.reviewCount} {t('leaderCard.reviews')})</span>
                </div>
            </div>
        </div>

        {/* --- Details part --- */}
        <div className="space-y-2 text-sm border-t pt-4 mt-4 flex-grow">
            <div className="flex">
                <span className="w-28 font-medium text-muted-foreground">Election Type</span>
                <Badge variant="secondary" className="capitalize">{t(`filterDashboard.${leader.electionType}`)}</Badge>
            </div>
            <div className="flex">
                <span className="w-28 font-medium text-muted-foreground">Party</span>
                <span className="text-foreground font-semibold">{leader.partyName}</span>
            </div>
            <div className="flex">
                <span className="w-28 font-medium text-muted-foreground">State</span>
                <span className="text-foreground font-semibold">{leader.location.state}</span>
            </div>
            <div className="flex">
                <span className="w-28 font-medium text-muted-foreground">Constituency</span>
                <span className="text-foreground font-semibold truncate">{leader.constituency}</span>
            </div>
        </div>
        
        <Separator className="my-4"/>

        {/* --- Links part --- */}
        <div className="flex items-center justify-between text-sm">
            <div className="flex gap-4">
                 {leader.manifestoUrl && (
                    <a
                        href={leader.manifestoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                    >
                        Manifesto
                    </a>
                )}
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <button
                            disabled={!leader.previousElections || leader.previousElections.length === 0}
                            className="font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                        >
                            Records
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

      </CardContent>

      <CardFooter className="p-2 bg-secondary/50 border-t">
        <div className="w-full grid grid-cols-2 gap-2">
            <Button size="sm">
                <Star className="mr-2 h-4 w-4" /> {t('leaderCard.rate')}
            </Button>
            <Button variant="outline" size="sm">
                <MessageSquare className="mr-2 h-4 w-4" /> {t('leaderCard.comment')}
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
