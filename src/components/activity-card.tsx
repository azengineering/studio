import Image from 'next/image';
import Link from 'next/link';
import { Star, Edit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import type { UserActivity } from '@/data/leaders';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';

interface ActivityCardProps {
  activity: UserActivity;
  onEdit: () => void;
}

export default function ActivityCard({ activity, onEdit }: ActivityCardProps) {
  const { t } = useLanguage();

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4 p-4 bg-card">
        <Avatar className="h-12 w-12 border-2 border-primary/50">
          <AvatarImage src={activity.leaderPhotoUrl || 'https://placehold.co/400x400.png'} alt={activity.leaderName} data-ai-hint="politician" />
          <AvatarFallback>{activity.leaderName[0]}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg font-headline">{activity.leaderName}</CardTitle>
           <p className="text-sm text-muted-foreground">{t('myActivitiesPage.reviewedOn')} {formatDistanceToNow(new Date(activity.updatedAt), { addSuffix: true })}</p>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{t('myActivitiesPage.yourRating')}</p>
            <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={cn(
                        'h-5 w-5',
                        i < activity.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'
                        )}
                    />
                ))}
            </div>
        </div>
        {activity.comment && (
            <div>
                 <p className="text-sm font-medium text-muted-foreground mb-1">{t('myActivitiesPage.yourComment')}</p>
                <blockquote className="border-l-2 pl-3 text-sm italic text-foreground">
                    “{activity.comment}”
                </blockquote>
            </div>
        )}
      </CardContent>
       <CardFooter className="bg-secondary/50 p-2 flex justify-end">
            <Button onClick={onEdit} variant="ghost" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                {t('myActivitiesPage.editRatingButton')}
            </Button>
      </CardFooter>
    </Card>
  );
}
