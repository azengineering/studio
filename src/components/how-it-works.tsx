import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Star, MessageCircle } from 'lucide-react';

const steps = [
  {
    icon: <Search className="w-10 h-10 text-primary" />,
    title: "1. Find Your Leader",
    description: "Use our comprehensive filters to search for political representatives at any level of government."
  },
  {
    icon: <Star className="w-10 h-10 text-primary" />,
    title: "2. Rate Performance",
    description: "Give a star rating based on their performance, promises kept, and overall impact on your community."
  },
  {
    icon: <MessageCircle className="w-10 h-10 text-primary" />,
    title: "3. Leave a Review",
    description: "Share detailed feedback, opinions, and experiences. Constructive comments help others form a balanced view."
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works-section" className="py-16 md:py-24 bg-background scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-headline text-3xl md:text-4xl font-extrabold">How It Works</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Engage in 3 simple, powerful steps.
          </p>
        </div>
        <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-border -translate-y-1/2"></div>
            <div className="hidden md:block absolute top-1/2 left-1/4 w-3/4 h-px bg-primary/30 -translate-y-1/2"></div>
            
            <div className="grid md:grid-cols-3 gap-8 relative">
              {steps.map((step, index) => (
                <Card key={index} className="text-center bg-card border-border shadow-sm transform transition-all hover:scale-105 hover:shadow-lg hover:border-primary/50">
                  <CardHeader className="items-center">
                    <div className="p-4 bg-primary/10 rounded-full border-8 border-background">
                      {step.icon}
                    </div>
                    <CardTitle className="font-headline text-xl mt-4 font-bold">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
        </div>
      </div>
    </section>
  );
}
