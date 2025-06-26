"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, firebaseEnabled } from '@/lib/firebase';
import LoadingScreen from '@/components/loading-screen';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    if (firebaseEnabled) {
        unsubscribe = onAuthStateChanged(auth, (user) => {
          setUser(user);
        });
    } else {
        setUser(null);
    }

    const timer = setTimeout(() => {
        setLoading(false);
    }, 5000);

    return () => {
        unsubscribe();
        clearTimeout(timer);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {loading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
