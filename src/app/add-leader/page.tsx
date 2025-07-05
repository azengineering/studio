import { Suspense } from 'react';
import AddLeaderForm from './form';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Skeleton } from '@/components/ui/skeleton';

function AddLeaderPageSkeleton() {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="mb-8">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-4 w-2/3 mt-3" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                    <div className="p-8 bg-card border rounded-lg shadow-sm">
                        <div className="space-y-8">
                            <div className="grid md:grid-cols-3 gap-6">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="grid md:grid-cols-3 gap-6">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="grid md:grid-cols-3 gap-6">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <div className="space-y-4">
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </div>
        </main>
        <Footer />
      </div>
    );
}

export default function AddLeaderPage() {
  return (
    <Suspense fallback={<AddLeaderPageSkeleton />}>
      <AddLeaderForm />
    </Suspense>
  );
}
