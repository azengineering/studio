'use client';

import Image from 'next/image';
import type { Leader } from '@/data/leaders';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare } from 'lucide-react';
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

interface LeaderCardProps {
  leader: Leader;
}

export default function LeaderCard({ leader }: LeaderCardProps) {
  const { t } = useLanguage();

  const genderText = leader.gender.charAt(0).toUpperCase() + leader.gender.slice(1);

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-4 flex-grow space-y-3">
        <div className="flex gap-4 items-start">
            <Image
                src={leader.photoUrl || 'https://placehold.co/400x400.png'}
                alt={`Portrait of ${leader.name}`}
                width={64}
                height={64}
                className="rounded-full border-2 border-primary/50 object-cover"
                data-ai-hint={`${leader.gender} indian politician`}
            />
            <div className="flex-1 space-y-2">
                {/* Row 1 */}
                <h2 className="font-headline text-lg font-bold leading-tight">
                    {leader.name}
                    <span className="text-sm font-normal text-muted-foreground ml-1">({genderText}, {leader.age} yrs)</span>
                </h2>

                 {/* Rating */}
                <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-foreground">{leader.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({leader.reviewCount} {t('leaderCard.reviews')})</span>
                </div>
            </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 pt-2 text-sm">
            <span className="font-semibold text-muted-foreground">Party</span>
            <span className="text-foreground">{leader.partyName}</span>

            <span className="font-semibold text-muted-foreground">Type</span>
            <span className="text-foreground capitalize">{t(`filterDashboard.${leader.electionType}`)}</span>
            
            <span className="font-semibold text-muted-foreground">State</span>
            <span className="text-foreground">{leader.location.state}</span>

            <span className="font-semibold text-muted-foreground">Constituency</span>
            <span className="text-foreground truncate">{leader.constituency}</span>
        </div>

      </CardContent>

      <CardFooter className="p-4 bg-secondary/50 border-t flex-col items-stretch gap-3">
        {/* Row 3 */}
        {leader.manifestoUrl && (
            <a
                href={leader.manifestoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm w-full text-left font-medium text-primary hover:underline"
            >
                View Manifesto
            </a>
        )}
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <button
                    disabled={!leader.previousElections || leader.previousElections.length === 0}
                    className="text-sm w-full text-left font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
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
        
        <div className="w-full grid grid-cols-2 gap-2">
            <Button className="w-full">
                <Star className="mr-2 h-4 w-4" /> {t('leaderCard.rate')}
            </Button>
            <Button variant="outline" className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" /> {t('leaderCard.comment')}
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
