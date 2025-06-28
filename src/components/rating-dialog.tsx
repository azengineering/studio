
'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Leader } from '@/data/leaders';
import { submitRatingAndComment } from '@/data/leaders';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface RatingDialogProps {
  leader: Leader;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRatingSuccess: (updatedLeader: Leader) => void;
  initialRating?: number | null;
  initialComment?: string | null;
}

export default function RatingDialog({ leader, open, onOpenChange, onRatingSuccess, initialRating = 0, initialComment = '' }: RatingDialogProps) {
  const [rating, setRating] = useState(initialRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(initialComment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      setRating(initialRating || 0);
      setComment(initialComment || '');
    } else {
      // Reset after a short delay to allow the dialog to close smoothly
      setTimeout(() => {
        setRating(0);
        setHoverRating(0);
        setComment('');
      }, 200);
    }
  }, [open, initialRating, initialComment]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        variant: 'destructive',
        title: t('ratingDialog.errorTitle'),
        description: t('ratingDialog.errorDescription'),
      });
      return;
    }
    if (!user) {
       toast({
        variant: 'destructive',
        title: t('auth.requiredTitle'),
        description: t('auth.rateLoginRequired'),
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const updatedLeader = await submitRatingAndComment(leader.id, user.id, rating, comment);
      if (updatedLeader) {
        toast({
          title: t('ratingDialog.successTitle'),
          description: t('ratingDialog.successDescription').replace('{leaderName}', leader.name),
        });
        onRatingSuccess(updatedLeader);
        onOpenChange(false);
      } else {
        throw new Error('Failed to update leader rating.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('ratingDialog.submitErrorTitle'),
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('ratingDialog.title').replace('{leaderName}', leader.name)}</DialogTitle>
          <DialogDescription>
            {t('ratingDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
           <div className="space-y-2">
              <Label>{t('ratingDialog.ratingLabel')}</Label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'h-10 w-10 cursor-pointer transition-colors',
                      (hoverRating >= star || rating >= star)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-muted-foreground'
                    )}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
           </div>
           <div className="space-y-2">
            <Label htmlFor="comment">{t('ratingDialog.commentLabel')}</Label>
            <Textarea
              id="comment"
              placeholder={t('ratingDialog.commentPlaceholder')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('ratingDialog.cancelButton')}</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t('ratingDialog.submittingButton') : t('ratingDialog.submitButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
