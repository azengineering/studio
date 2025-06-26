import Header from '@/components/header';
import Footer from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Info className="w-8 h-8 text-primary" />
              <CardTitle className="font-headline text-3xl">About PolitiRate</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-lg text-muted-foreground">
            <p>
              PolitiRate is a non-partisan platform designed to foster civic engagement and increase transparency in governance. Our mission is to provide a space for citizens to voice their opinions, rate the performance of their elected officials, and engage in constructive dialogue about the issues that matter most to their communities.
            </p>
            <p>
              We believe that an informed and active citizenry is the cornerstone of a healthy democracy. By providing a report card for political leaders, we aim to hold them accountable for their actions and promises. The ratings and reviews on this platform are submitted by people like you, creating a crowd-sourced reflection of public sentiment.
            </p>
            <p>
              Whether it's at the national, state, or local panchayat level, every voice matters. Join us in building a more accountable and responsive political landscape.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
