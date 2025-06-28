
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Star, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getReviewsForLeader, type Leader, type Review } from '@/data/leaders';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

const LinkRenderer = ({ text }: { text: string | null }) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, index) =>
        urlRegex.test(part) ? (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {part}
          </a>
        ) : (
          part
        )
      )}
    </>
  );
};

const ReviewItem = ({ review }: { review: Review }) => {
    const { t } = useLanguage();
    const [isNameVisible, setIsNameVisible] = useState(false);

    return (
        <div className="flex flex-col gap-2">
            {/* User row */}
            {isNameVisible ? (
                <p className="font-semibold text-sm flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    {review.userName}
                </p>
            ) : (
                <button onClick={() => setIsNameVisible(true)} className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors w-fit">
                    <User className="h-5 w-5" />
                    <span className="text-sm font-semibold hover:underline">{t('reviewsDialog.anonymous')}</span>
                </button>
            )}
            
            {/* Main content row (social, rating, time) */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                 <div className="flex items-center gap-2 flex-wrap">
                    {review.socialBehaviour && (
                      <Badge variant="secondary" className="capitalize">{review.socialBehaviour.replace('-', ' ')}</Badge>
                    )}
                    <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={cn('h-4 w-4', i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30')} />
                        ))}
                    </div>
                </div>
                 <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(review.updatedAt), { addSuffix: true })}</p>
            </div>
            
            {/* Comment */}
            {review.comment && (
              <p className="text-sm text-muted-foreground break-words pt-1">
                <LinkRenderer text={review.comment} />
              </p>
            )}
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

type SortOrder = 'latest' | 'oldest' | 'top-rated' | 'lowest-rated';

interface ReviewsDialogProps {
  leader: Leader;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddReview: () => void;
}


export default function ReviewsDialog({ leader, open, onOpenChange, onAddReview }: ReviewsDialogProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');

  useEffect(() => {
    if (open) {
      const fetchReviews = async () => {
        setIsLoading(true);
        const fetchedReviews = await getReviewsForLeader(leader.id);
        setReviews(fetchedReviews);
        setIsLoading(false);
      };
      fetchReviews();
    } else {
        // Reset sort order when dialog is closed
        setSortOrder('latest');
    }
  }, [open, leader.id]);
  
  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
        switch (sortOrder) {
            case 'top-rated':
                return b.rating - a.rating;
            case 'lowest-rated':
                return a.rating - b.rating;
            case 'oldest':
                return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
            case 'latest':
            default:
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
    });
  }, [reviews, sortOrder]);
  
  const SortButton = ({ value, label }: { value: SortOrder, label: string }) => (
    <Button 
        variant={sortOrder === value ? 'default' : 'ghost'} 
        size="sm"
        onClick={() => setSortOrder(value)}
    >
        {label}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t('reviewsDialog.title')} <span className="font-bold text-primary">{leader.name}</span>
          </DialogTitle>
          <DialogDescription>
            <span className="flex items-center gap-2">
                {t('reviewsDialog.description')}
                <Badge className="bg-amber-200 text-amber-800 hover:bg-amber-300">{leader.reviewCount} {t('reviewsDialog.reviews')}</Badge>
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2 border-y">
            <div className="flex flex-wrap gap-2 items-center">
                <SortButton value="latest" label={t('reviewsDialog.latest')} />
                <SortButton value="top-rated" label={t('reviewsDialog.topRated')} />
                <SortButton value="lowest-rated" label={t('reviewsDialog.lowestRated')} />
                <SortButton value="oldest" label={t('reviewsDialog.oldest')} />
            </div>
        </div>

        <ScrollArea className="h-96 pr-4 -mr-4">
          <div className="space-y-6">
            {isLoading ? (
              <ReviewSkeleton />
            ) : sortedReviews.length > 0 ? (
              sortedReviews.map((review, index) => (
                <div key={`${review.userName}-${review.updatedAt}-${index}`}>
                  <ReviewItem review={review} />
                  {index < sortedReviews.length - 1 && <Separator className="my-4" />}
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-16">{t('reviewsDialog.noReviews')}</p>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
            <Button onClick={onAddReview}>
                {t('reviewsDialog.addYourReview')}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
