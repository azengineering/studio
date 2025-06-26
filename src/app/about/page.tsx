import Header from '@/components/header';
import Footer from '@/components/footer';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">About PolitiRate</h1>
            <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
                Our mission is to foster civic engagement and increase transparency in governance by providing a non-partisan platform for citizens to voice their opinions on elected officials.
            </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
