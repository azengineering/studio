import { Vote } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Hero() {
  return (
    <section className="text-center py-16 md:py-24 rounded-lg bg-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Vote className="w-16 h-16 mx-auto text-primary" />
        <h1 className="mt-4 text-4xl md:text-5xl font-bold font-headline tracking-tight">
          Your Voice, Their Report Card.
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
          Welcome to PolitiRate, the people's platform to rate and review political leaders. Hold them accountable, share your opinions, and help build a more transparent democracy.
        </p>
        <div className="mt-8">
           <a href="#filter-section">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Get Started
            </Button>
           </a>
        </div>
      </div>
    </section>
  );
}
