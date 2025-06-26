import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-secondary to-background pt-20 pb-12 md:pt-32 md:pb-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tighter text-primary">
              Your Voice, Their Report Card.
            </h1>
            <p className="max-w-xl mx-auto md:mx-0 text-lg md:text-xl text-muted-foreground">
              Welcome to PolitiRate, the people's platform to rate and review political leaders. Hold them accountable, share your opinions, and help build a more transparent democracy.
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
               <a href="#find-leader-section">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                    Find Your Leader
                </Button>
               </a>
               <a href="#how-it-works-section">
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary">
                    Learn How
                </Button>
               </a>
            </div>
          </div>
          <div className="relative h-64 md:h-96">
             <Image
                src="https://placehold.co/600x400.png"
                alt="Illustration of people voting and discussing"
                fill
                className="object-contain"
                data-ai-hint="civic engagement politics"
             />
          </div>
        </div>
      </div>
    </section>
  );
}
