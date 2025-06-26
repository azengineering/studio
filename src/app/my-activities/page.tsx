"use client";

import withAuth from '@/components/with-auth';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks } from 'lucide-react';

function MyActivitiesPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
            <h1 className="font-headline text-4xl font-bold">My Activities</h1>
            <p className="text-muted-foreground text-lg">Welcome back, {user?.displayName || 'User'}!</p>
        </div>
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <ListChecks className="w-8 h-8 text-primary"/>
                    <CardTitle className="font-headline text-2xl">Your Contributions</CardTitle>
                </div>
                <CardDescription>Here's a summary of your ratings and comments.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                    <p>You haven't rated or commented on any leaders yet.</p>
                    <p className="text-sm">Get started by finding a representative on the homepage!</p>
                </div>
            </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

export default withAuth(MyActivitiesPage);
