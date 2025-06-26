import Image from 'next/image';
import { CheckCircle } from 'lucide-react';

const benefits = [
  "Increase Transparency",
  "Promote Accountability",
  "Encourage Civic Duty",
  "Foster Informed Decisions"
];

export default function WhyItMatters() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
             <div className="relative h-80 md:h-96 rounded-lg overflow-hidden shadow-2xl">
                 <Image
                    src="https://placehold.co/600x500.png"
                    alt="Image of the Indian Parliament building"
                    fill
                    className="object-cover"
                    data-ai-hint="indian parliament building"
                 />
             </div>
          </div>
          <div className="space-y-6 order-1 md:order-2">
            <h2 className="font-headline text-3xl md:text-4xl font-bold">Why Your Voice Matters</h2>
            <p className="text-lg text-muted-foreground">
              A vibrant democracy thrives on the active participation of its citizens. Your feedback is a powerful tool for change, creating a direct line of communication with those in power.
            </p>
            <ul className="space-y-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-primary" />
                  <span className="text-lg font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
