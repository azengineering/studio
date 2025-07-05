
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
<<<<<<< HEAD
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { isAfter } from 'date-fns';
import { findUserByEmail, addUser as addNewUser, updateUserProfile, type User, findUserById, unblockUser } from '@/data/users';
import { supabase as supabaseClient } from '@/lib/db'; // Public client
=======
import type { User } from '@/data/users';
import { findUserById, updateUserProfile } from '@/data/users';
import { supabase } from '@/lib/db';
import type { AuthError, Session, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { isAfter } from 'date-fns';
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd

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
<<<<<<< HEAD
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
=======
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        if (session?.user) {
          let userProfile = await findUserById(session.user.id);
          
          // If profile is missing, it could be a first-time Google sign-in
          // or an old account. We'll create it.
          if (!userProfile) {
            const { error: rpcError } = await supabase.rpc('ensure_user_profile_exists');
            if (rpcError) {
              console.error("Auth state change: Error ensuring profile exists", rpcError);
              await supabase.auth.signOut();
              setUser(null);
              setLoading(false);
              return;
            }
            // Fetch the newly created profile
            userProfile = await findUserById(session.user.id);
          }

          // Blocked users are handled at login. If a session exists for a now-blocked user,
          // this will log them out on the next interaction or page load.
          if (userProfile && !userProfile.isBlocked) {
            setUser(userProfile);
          } else {
            await supabase.auth.signOut();
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd

    return () => {
      subscription.unsubscribe();
    };
<<<<<<< HEAD
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
=======
  }, []);
  
  const login = async (email: string, password: string, redirectPath?: string | null) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      throw authError;
    }
    
    if (authData.user) {
      let userProfile = await findUserById(authData.user.id);

      // If profile doesn't exist, it's likely an old account before the trigger was added.
      // We'll try to create it now.
      if (!userProfile) {
        // Call the RPC function to create the profile on the DB side.
        const { error: rpcError } = await supabase.rpc('ensure_user_profile_exists');
        
        if (rpcError) {
          await supabase.auth.signOut();
          console.error("Error ensuring user profile exists:", rpcError);
          throw new Error("Login successful, but your profile could not be created. Please contact support.");
        }
        
        // Fetch the newly created profile again.
        userProfile = await findUserById(authData.user.id);
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
      }

      // Check for block status AFTER ensuring profile exists
      if (userProfile?.isBlocked) {
         if (userProfile.blockedUntil && isAfter(new Date(), new Date(userProfile.blockedUntil))) {
            await supabase.auth.signOut();
            throw new Error(`Your temporary block has expired, but needs to be cleared by an administrator. Please contact support.`);
         }
        await supabase.auth.signOut();
        throw new Error(`BLOCKED::${userProfile.blockReason}::${userProfile.blockedUntil}`);
      }

      if (userProfile) {
        setUser(userProfile); // Set state BEFORE redirecting
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          router.push('/');
        }
      } else {
        await supabase.auth.signOut();
        throw new Error("Login successful, but your profile could not be found or created. Please contact support.");
      }
    } else {
      throw new Error("Login failed. Please check your credentials.");
    }
<<<<<<< HEAD

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
=======
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
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
    router.push('/login?message=Account+created!+Please+log+in.');
  };
  
  const signInWithGoogle = async (redirectPath?: string | null) => {
<<<<<<< HEAD
      const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
              redirectTo: `${window.location.origin}/auth/callback?redirect_path=${redirectPath || '/'}`,
          },
      });
      if (error) throw new Error(error.message);
=======
    // Google Sign-In is a redirect flow. It doesn't return a user directly.
    // The onAuthStateChange listener will pick up the session after the redirect.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + (redirectPath || '/'),
      },
    });
     if (error) {
        throw error;
    }
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  const updateUser = async (profileData: Partial<User>) => {
    if (!user) throw new Error("User not authenticated");
<<<<<<< HEAD
    const updatedUser = await updateUserProfile(user.id, profileData);
    if (updatedUser) setUser(updatedUser);
=======
    
    const updatedUser = await updateUserProfile(user.id, profileData);
    if (updatedUser) {
      setUser(updatedUser);
    }
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
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
