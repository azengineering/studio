import Image from 'next/image';
import { ShieldCheck, Zap, Vote } from 'lucide-react';

const benefits = [
  { icon: <ShieldCheck className="w-8 h-8 text-primary" />, title: "Increase Transparency", description: "Shine a light on the actions and performance of elected officials." },
  { icon: <Vote className="w-8 h-8 text-primary" />, title: "Promote Accountability", description: "Your ratings create a public record, holding leaders answerable for their promises." },
  { icon: <Zap className="w-8 h-8 text-primary" />, title: "Empower Your Community", description: "Collective feedback can influence policy and drive meaningful change." },
];

export default function WhyItMatters() {
  return (
    <section className="py-16 md:py-24 bg-secondary/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="font-headline text-3xl md:text-4xl font-extrabold">Why Your Voice Matters</h2>
            <p className="text-lg text-muted-foreground">
              A vibrant democracy thrives on active participation. Your feedback is a powerful tool for change, creating a direct line of communication with those in power.
            </p>
            <div className="space-y-6">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{benefit.title}</h3>
                    <p className="text-muted-foreground mt-1">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
             <div className="aspect-w-4 aspect-h-3 rounded-xl overflow-hidden shadow-2xl border-4 border-background">
                 <Image
                    src="https://placehold.co/600x450.png"
                    alt="A diverse group of citizens engaged in a community meeting"
                    fill
                    className="object-cover"
                    data-ai-hint="community meeting diverse"
                 />
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
