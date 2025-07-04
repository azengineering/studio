
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { isAfter } from 'date-fns';
import { findUserByEmail, addUser as addNewUser, updateUserProfile, type User, findUserById, unblockUser } from '@/data/users';
import { supabase as supabaseClient } from '@/lib/db'; // Public client

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
  const [supabase] = useState(() => createPagesBrowserClient());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);
      if (session) {
        const userProfile = await findUserById(session.user.id);
        if (userProfile) {
           if (userProfile.is_blocked) {
              if (userProfile.blocked_until && isAfter(new Date(), new Date(userProfile.blocked_until))) {
                  await unblockUser(userProfile.id);
                  const unblockedUser = await findUserById(userProfile.id);
                  setUser(unblockedUser || null);
              } else {
                  // User is still blocked, log them out client-side
                  await supabase.auth.signOut();
                  setUser(null);
              }
           } else {
              setUser(userProfile);
           }
        } else {
           // Create a public profile if it doesn't exist (e.g., first social login)
           const newUserProfile = await addNewUser({
               id: session.user.id,
               email: session.user.email!,
               name: session.user.user_metadata?.full_name || session.user.email!.split('@')[0],
           });
           setUser(newUserProfile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const login = async (email: string, password: string, redirectPath?: string | null) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Login failed, user not found.");
    
    const userProfile = await findUserById(authData.user.id);
    if (userProfile?.is_blocked) {
      await supabase.auth.signOut();
      if (userProfile.blocked_until && isAfter(new Date(), new Date(userProfile.blocked_until))) {
          await unblockUser(userProfile.id);
          // Ask user to try again
          throw new Error("Your block has expired. Please try logging in again.");
      } else {
          throw new Error(`BLOCKED::${userProfile.block_reason}::${userProfile.blocked_until}`);
      }
    }

    router.push(redirectPath || '/');
  };

  const signup = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        // emailRedirectTo: `${window.location.origin}/auth/callback`, // For email verification
      }
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Signup failed. Please try again.');

    // Create a public profile for the new user
    await addNewUser({
      id: data.user.id,
      email: data.user.email!,
      name: data.user.email!.split('@')[0],
    });
    router.push('/login?message=Account+created!+Please+log+in.');
  };
  
  const signInWithGoogle = async (redirectPath?: string | null) => {
      const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
              redirectTo: `${window.location.origin}/auth/callback?redirect_path=${redirectPath || '/'}`,
          },
      });
      if (error) throw new Error(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  const updateUser = async (profileData: Partial<User>) => {
    if (!user) throw new Error("User not authenticated");
    const updatedUser = await updateUserProfile(user.id, profileData);
    if (updatedUser) setUser(updatedUser);
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
