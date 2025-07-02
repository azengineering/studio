
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/data/users';
import { findUserById, updateUserProfile } from '@/data/users';
import { supabase } from '@/lib/db';
import type { AuthError, Session, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { isAfter } from 'date-fns';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, redirectPath?: string | null) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (profileData: Partial<User>) => Promise<User | null>;
  signInWithGoogle: (redirectPath?: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        if (session?.user) {
          const userProfile = await findUserById(session.user.id);
          if (userProfile) {
            if (userProfile.isBlocked) {
                if (userProfile.blockedUntil && isAfter(new Date(), new Date(userProfile.blockedUntil))) {
                    // Temporary block has expired, unblock them.
                    const { data, error } = await supabase.from('users').update({ isBlocked: false, blockReason: null, blockedUntil: null }).eq('id', userProfile.id).select().single();
                    if (!error && data) {
                        setUser(data as User);
                    }
                } else {
                    // Still blocked, sign them out.
                    await supabase.auth.signOut();
                    setUser(null);
                }
            } else {
                setUser(userProfile);
            }
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthAction = async (
    action: Promise<{ data: { user: SupabaseAuthUser | null, session: Session | null }, error: AuthError | null }>,
    redirectPath?: string | null
  ) => {
    const { error } = await action;
    if (error) {
      if (error.message.includes('User already registered')) {
        throw new Error('An account with this email already exists.');
      }
      throw error;
    }
    // The onAuthStateChange listener will handle setting the user state.
    if (redirectPath) {
      router.push(redirectPath);
    } else {
      router.push('/');
    }
  };
  
  const login = async (email: string, password: string, redirectPath?: string | null) => {
    // Check for block status before attempting login
    const { data: userProfile } = await supabase.from('users').select('*').eq('email', email).single();
    if (userProfile?.isBlocked) {
      throw new Error(`BLOCKED::${userProfile.blockReason}::${userProfile.blockedUntil}`);
    }
    await handleAuthAction(supabase.auth.signInWithPassword({ email, password }), redirectPath);
  };

  const signup = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: email.split('@')[0],
        },
      },
    });

    if (error) {
       if (error.message.includes('User already registered')) {
        throw new Error('An account with this email already exists.');
      }
      throw error;
    }
    // Redirect to login with a success message
    router.push('/login?message=Account+created!+Please+log+in.');
  };

  const signInWithGoogle = async (redirectPath?: string | null) => {
    await handleAuthAction(supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + (redirectPath || '/'),
      },
    }));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  const updateUser = async (profileData: Partial<User>) => {
    if (!user) throw new Error("User not authenticated");
    
    const updatedUser = await updateUserProfile(user.id, profileData);
    if (updatedUser) {
      setUser(updatedUser);
    }
    return updatedUser;
  };

  const value = { user, loading, isAuthenticated: !!user, login, signup, logout, updateUser, signInWithGoogle };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
