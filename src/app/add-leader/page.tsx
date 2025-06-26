'use client';

import Header from '@/components/header';
import Footer from '@/components/footer';
import withAuth from '@/components/with-auth';

function AddLeaderPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12"></main>
      <Footer />
    </div>
  );
}

export default withAuth(AddLeaderPage);
