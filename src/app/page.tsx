import Header from '@/components/header';
import Footer from '@/components/footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
            Welcome to PolitiRate
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Your Voice, Their Report Card.
          </p>
          <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">
            This is the main content area. You can build out your landing page here.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
