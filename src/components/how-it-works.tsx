import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Star, MessageCircle } from 'lucide-react';

const steps = [
  {
    icon: <Search className="w-10 h-10 text-accent" />,
    title: "1. Find Your Leader",
    description: "Use our comprehensive filters to search for your political representatives at the national, state, or local panchayat level."
  },
  {
    icon: <Star className="w-10 h-10 text-accent" />,
    title: "2. Rate Performance",
    description: "Give a star rating based on their performance, promises kept, and overall impact on your community. Your rating contributes to their public score."
  },
  {
    icon: <MessageCircle className="w-10 h-10 text-accent" />,
    title: "3. Leave a Review",
    description: "Share your detailed feedback, opinions, and experiences. Constructive comments help others form a balanced view."
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works-section" className="py-16 md:py-24 bg-background scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl md:text-4xl font-bold">How It Works</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Engage in 3 simple steps.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="text-center bg-card border-border/50 shadow-md transform transition-all hover:scale-105 hover:shadow-xl">
              <CardHeader className="items-center">
                <div className="p-4 bg-accent/10 rounded-full">
                  {step.icon}
                </div>
                <CardTitle className="font-headline text-xl mt-4">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
