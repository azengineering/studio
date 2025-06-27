import Image from 'next/image';
import type { Leader } from '@/data/leaders';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/language-context';

interface LeaderCardProps {
  leader: Leader;
}

export default function LeaderCard({ leader }: LeaderCardProps) {
  const { t } = useLanguage();
  
  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex-row gap-4 items-start p-4">
        <Image
          src={leader.photoUrl}
          alt={`Portrait of ${leader.name}`}
          width={80}
          height={80}
          className="rounded-full border-2 border-primary/50 object-cover"
          data-ai-hint={`${leader.gender} indian politician`}
        />
        <div className="flex-1">
          <CardTitle className="font-headline text-xl">{leader.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{leader.partyName}</p>
          <p className="text-sm text-muted-foreground">{leader.constituency}</p>
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <Badge variant="secondary" className="capitalize">{t(`filterDashboard.${leader.electionType}`)}</Badge>
            {leader.location.state && <Badge variant="outline">{leader.location.state}</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="font-bold text-foreground">{leader.rating.toFixed(1)}</span>
            <span>({leader.reviewCount} {t('leaderCard.reviews')})</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-secondary/50">
        <div className="w-full flex gap-2">
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
