'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Vote } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import Link from 'next/link';

export default function Hero() {
  const { t } = useLanguage();
  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-background to-background pt-24 pb-20 md:pt-32 md:pb-28 text-center overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-primary/5 to-transparent to-70% opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-accent/5 to-transparent to-70% opacity-50"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Badge
            variant="outline"
            className="mb-6 inline-flex items-center gap-2 rounded-full border-primary/50 bg-primary/10 px-4 py-2 text-base font-medium transition-all hover:scale-105 hover:shadow-lg hover:border-primary/75"
          >
            <Vote className="h-4 w-4 text-accent" />
            {t('hero.badge')}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tighter text-foreground">
            {t('hero.title_part1')}<span className="text-primary">{t('hero.title_highlight')}</span>{t('hero.title_part2')}
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
            {t('hero.description')}
          </p>
          <div className="mt-10 flex gap-4 justify-center">
             <Link href="/rate-leader">
              <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                  {t('hero.findLeader')}
              </Button>
             </Link>
             <Link href="/login">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20">
                  {t('hero.addNewLeader')}
              </Button>
             </Link>
          </div>
      </div>
    </section>
  );
}
