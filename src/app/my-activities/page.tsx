"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import withAuth from '@/components/with-auth';
import { getActivitiesForUser, type UserActivity } from '@/data/leaders';
import ActivityCard from '@/components/activity-card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquareText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function MyActivitiesPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchActivities = async () => {
        setIsLoading(true);
        const userActivities = await getActivitiesForUser(user.id);
        setActivities(userActivities);
        setIsLoading(false);
      };
      fetchActivities();
    }
  }, [user]);

  const ActivitySkeleton = () => (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-lg" />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-secondary/50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold font-headline mb-2">{t('myActivitiesPage.title')}</h1>
          <p className="text-muted-foreground mb-8">
            {t('myActivitiesPage.description')}
          </p>

          {isLoading ? (
            <ActivitySkeleton />
          ) : activities.length > 0 ? (
            <div className="space-y-6">
              {activities.map((activity) => (
                <ActivityCard key={activity.leaderId} activity={activity} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 rounded-lg bg-background border-2 border-dashed border-border">
              <MessageSquareText className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-xl font-semibold font-headline">{t('myActivitiesPage.noActivitiesTitle')}</h3>
              <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                {t('myActivitiesPage.noActivitiesDescription')}
              </p>
               <Button asChild className="mt-6">
                  <Link href="/rate-leader">{t('hero.findLeader')}</Link>
                </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default withAuth(MyActivitiesPage);
