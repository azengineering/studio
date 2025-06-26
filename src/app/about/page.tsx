import Header from '@/components/header';
import Footer from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Eye, Users } from 'lucide-react';
import Image from 'next/image';

const features = [
  {
    icon: <Target className="w-10 h-10 text-primary" />,
    title: "Our Mission",
    description: "To foster civic engagement and increase transparency in governance by providing a non-partisan platform for citizens to voice their opinions on elected officials."
  },
  {
    icon: <Eye className="w-10 h-10 text-primary" />,
    title: "Our Vision",
    description: "We envision a future where an informed and active citizenry is the cornerstone of a healthy democracy, holding political leaders accountable for their actions and promises."
  },
  {
    icon: <Users className="w-10 h-10 text-primary" />,
    title: "Our Approach",
    description: "By crowd-sourcing ratings and reviews from people like you, we create a real-time reflection of public sentiment, from national parliaments to local panchayats."
  }
];

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 to-secondary/60 py-20 md:py-28">
            <div className="container mx-auto px-4 text-center">
                <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">About PolitiRate</h1>
                <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
                    Building a more accountable and responsive political landscape, together.
                </p>
            </div>
        </section>

        {/* Core Values Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
             <div className="grid md:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                    <Card key={index} className="text-center border-0 shadow-none">
                    <CardHeader className="items-center">
                        <div className="p-4 bg-primary/10 rounded-full">
                        {feature.icon}
                        </div>
                        <CardTitle className="font-headline text-2xl mt-4">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                    </Card>
                ))}
            </div>
          </div>
        </section>
        
        {/* Why It Matters Section */}
        <section className="py-16 md:py-24 bg-secondary/50">
           <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="relative h-80 md:h-96 rounded-lg overflow-hidden shadow-xl">
                    <Image
                        src="https://placehold.co/600x500.png"
                        alt="People engaged in a community meeting"
                        fill
                        className="object-cover"
                        data-ai-hint="community meeting discussion"
                    />
                </div>
                 <div className="space-y-6">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold">Every Voice Matters</h2>
                    <p className="text-lg text-muted-foreground">
                    In a democracy, every citizen's voice has the power to shape the future. PolitiRate is built on the belief that collective opinion can drive positive change and ensure that governance is a reflection of the people's will. Your participation is not just a right; it's a vital contribution to the democratic process.
                    </p>
                    <p className="text-muted-foreground">
                    Whether it's at the national, state, or local panchayat level, your ratings and reviews create a transparent record of performance that is accessible to all. Join us in this important work.
                    </p>
                </div>
                </div>
            </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
