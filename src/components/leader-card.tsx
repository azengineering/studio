'use client';

import Image from 'next/image';
import type { Leader } from '@/data/leaders';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare, Twitter, Landmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/language-context';
import Link from 'next/link';
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
        <div className="flex gap-4 p-4 items-start bg-secondary/30 border-b">
            <Image
                src={leader.photoUrl || 'https://placehold.co/400x400.png'}
                alt={`Portrait of ${leader.name}`}
                width={80}
                height={80}
                className="rounded-full border-2 border-primary/50 object-cover"
                data-ai-hint={`${leader.gender} indian politician`}
            />
            <div className="flex-1 space-y-2">
                {/* Row 1 */}
                <div>
                    <h2 className="font-headline text-xl font-bold">{leader.name}</h2>
                    <p className="text-sm text-muted-foreground">({genderText}), {leader.age} years old</p>
                </div>
                 {/* Rating */}
                <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-foreground">{leader.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({leader.reviewCount} {t('leaderCard.reviews')})</span>
                </div>
            </div>
        </div>
      
        <CardContent className="p-4 flex-grow space-y-3">
            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                    <p className="font-semibold text-muted-foreground">Party</p>
                    <p>{leader.partyName}</p>
                </div>
                <div>
                    <p className="font-semibold text-muted-foreground">Election</p>
                    <p className="capitalize">{t(`filterDashboard.${leader.electionType}`)}</p>
                </div>
                <div>
                    <p className="font-semibold text-muted-foreground">State</p>
                    <p>{leader.location.state}</p>
                </div>
                <div>
                    <p className="font-semibold text-muted-foreground">Constituency</p>
                    <p>{leader.constituency}</p>
                </div>
            </div>
        </CardContent>

        <CardFooter className="p-4 bg-secondary/50 border-t">
            <div className="w-full grid grid-cols-2 gap-2">
                 {/* Row 3 */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" disabled={!leader.previousElections || leader.previousElections.length === 0}>
                            <Landmark className="mr-2 h-4 w-4" /> Election Records
                        </Button>
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
                
                {leader.twitterUrl ? (
                    <Button variant="outline" asChild>
                       <Link href={leader.twitterUrl} target="_blank" rel="noopener noreferrer">
                            <Twitter className="mr-2 h-4 w-4" /> X / Twitter
                       </Link>
                    </Button>
                ) : (
                     <Button variant="outline" disabled>
                        <Twitter className="mr-2 h-4 w-4" /> No X / Twitter
                    </Button>
                )}

                <Button className="w-full col-span-1">
                    <Star className="mr-2 h-4 w-4" /> {t('leaderCard.rate')}
                </Button>
                <Button variant="outline" className="w-full col-span-1">
                    <MessageSquare className="mr-2 h-4 w-4" /> {t('leaderCard.comment')}
                </Button>
            </div>
        </CardFooter>
    </Card>
  );
}
