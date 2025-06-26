"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import LoadingScreen from '@/components/loading-screen';
import type { ComponentType } from 'react';

export default function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  const WithAuthComponent = (props: P) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    if (loading) {
      return <LoadingScreen />;
    }

    if (!user) {
      router.replace('/login');
      return null;
    }

    return <WrappedComponent {...props} />;
  };
  
  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
}
