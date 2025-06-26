"use client";

import withAuth from '@/components/with-auth';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';

function MyActivitiesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-secondary/50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-headline">{t('myActivitiesPage.title')}</h1>
            <p className="mt-4 text-lg text-muted-foreground">
            {t('myActivitiesPage.welcome').replace('{name}', user?.displayName || 'User')}
            </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default withAuth(MyActivitiesPage);
