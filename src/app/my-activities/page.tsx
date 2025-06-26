"use client";

import withAuth from '@/components/with-auth';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ListChecks, PlusCircle } from 'lucide-react';

function MyActivitiesPage() {
  const { user } = useAuth();
  const hasActivities = false; // Placeholder for future logic

  return (
    <div className="flex flex-col min-h-screen bg-secondary/50">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
            <h1 className="font-headline text-4xl font-bold">My Dashboard</h1>
            <p className="text-muted-foreground text-lg">Welcome back, {user?.displayName || 'User'}!</p>
        </div>
        <Card className="shadow-xl border-t-4 border-primary">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <ListChecks className="w-8 h-8 text-primary"/>
                    <CardTitle className="font-headline text-2xl">Your Contributions</CardTitle>
                </div>
                <CardDescription>A summary of your ratings and comments.</CardDescription>
            </CardHeader>
            <CardContent>
                {hasActivities ? (
                    <div>
                        {/* This section will be built out when data is available */}
                        <p className="text-muted-foreground">Your activity will be displayed here.</p>
                    </div>
                ) : (
                    <div className="text-center py-12 px-6 bg-secondary/50 rounded-lg">
                        <div className="flex justify-center mb-4">
                            <div className="p-4 rounded-full bg-primary/10">
                                <ListChecks className="w-16 h-16 text-primary" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold font-headline mb-2">Nothing to see here... yet!</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-6">
                            You haven't rated or commented on any leaders. Start making your voice heard today.
                        </p>
                        <Link href="/#find-leader-section" passHref>
                            <Button size="lg">
                                <PlusCircle className="mr-2 h-5 w-5"/>
                                Rate a Leader
                            </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

export default withAuth(MyActivitiesPage);
