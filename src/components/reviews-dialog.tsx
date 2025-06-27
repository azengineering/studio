
'use client';

import { useState, useEffect } from 'react';
import { Star, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getReviewsForLeader, type Leader, type Review } from '@/data/leaders';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

interface ReviewsDialogProps {
  leader: Leader;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReviewItem = ({ review }: { review: Review }) => {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <p className="font-semibold text-sm">{review.userName}</p>
                </div>
                <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={cn(
                            'h-4 w-4',
                            i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/50'
                            )}
                        />
                    ))}
                </div>
            </div>
            {review.comment && <p className="text-muted-foreground text-sm pl-7">{review.comment}</p>}
            <p className="text-xs text-muted-foreground/80 pl-7">{formatDistanceToNow(new Date(review.updatedAt), { addSuffix: true })}</p>
        </div>
    )
};

const ReviewSkeleton = () => (
    <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-full ml-7" />
                <Skeleton className="h-4 w-4/5 ml-7" />
            </div>
        ))}
    </div>
);

export default function ReviewsDialog({ leader, open, onOpenChange }: ReviewsDialogProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    if (open) {
      const fetchReviews = async () => {
        setIsLoading(true);
        const fetchedReviews = await getReviewsForLeader(leader.id);
        setReviews(fetchedReviews);
        setIsLoading(false);
      };
      fetchReviews();
    }
  }, [open, leader.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('reviewsDialog.title').replace('{leaderName}', leader.name)}</DialogTitle>
          <DialogDescription>
            <span className="flex items-center gap-2">
                {t('reviewsDialog.description')}
                <Badge variant="secondary">{leader.reviewCount} Reviews</Badge>
            </span>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 pr-4 -mr-4">
          <div className="space-y-6">
            {isLoading ? (
              <ReviewSkeleton />
            ) : reviews.length > 0 ? (
              reviews.map((review, index) => (
                <div key={index}>
                  <ReviewItem review={review} />
                  {index < reviews.length - 1 && <Separator className="my-4" />}
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-16">{t('reviewsDialog.noReviews')}</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
