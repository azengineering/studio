'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-secondary/50">
      <Header />
      <main className="flex-grow flex items-center justify-center container mx-auto px-4">
        <p>Redirecting...</p>
      </main>
      <Footer />
    </div>
  );
}
