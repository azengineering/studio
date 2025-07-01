
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { findUserByEmail, addUser as addNewUser, updateUserProfile, type User, findUserById, unblockUser } from '@/data/users';
import { isAfter } from 'date-fns';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { auth, firebaseEnabled } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
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
    const initializeAuth = async () => {
      setLoading(true);

      // 1. Handle Google Redirect Result FIRST
      if (firebaseEnabled) {
        try {
          const result = await getRedirectResult(auth as any);
          if (result) {
            const googleUser = result.user;
            if (!googleUser.email) {
              throw new Error("Could not retrieve email from Google account.");
            }
            
            let userInDb = await findUserByEmail(googleUser.email);
            
            if (!userInDb) {
              userInDb = await addNewUser({
                email: googleUser.email,
                name: googleUser.displayName || googleUser.email.split('@')[0],
              });
            }

            if (userInDb) {
              handleSuccessfulLogin(userInDb); // Set state and local storage
              const redirectPath = sessionStorage.getItem('auth_redirect');
              sessionStorage.removeItem('auth_redirect');
              setLoading(false);
              router.push(redirectPath || '/');
              return; // End auth flow here
            }
            throw new Error("Failed to create or retrieve user account.");
          }
        } catch (error) {
           console.error("Google Sign-In Redirect Error:", error);
           sessionStorage.removeItem('auth_redirect');
           // Continue to check for local session even if redirect fails
        }
      }

      // 2. If no redirect, check for an existing session in localStorage
      try {
        const storedUserString = localStorage.getItem('politirate_user');
        if (storedUserString) {
          const storedUser = JSON.parse(storedUserString);
          if (storedUser.id) {
            const freshUser = await findUserById(storedUser.id);
            if (freshUser) {
              if (freshUser.isBlocked) {
                if (freshUser.blockedUntil && isAfter(new Date(), new Date(freshUser.blockedUntil))) {
                  await unblockUser(freshUser.id);
                  const unblockedUser = await findUserById(freshUser.id);
                  if (unblockedUser) setUser(unblockedUser);
                } else {
                  // User is still blocked, log them out locally.
                  localStorage.removeItem('politirate_user');
                  setUser(null);
                }
              } else {
                setUser(freshUser);
              }
            } else {
              // User in storage doesn't exist in DB anymore.
              localStorage.removeItem('politirate_user');
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error("Failed to sync user from localStorage", error);
        localStorage.removeItem('politirate_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSuccessfulLogin = (loggedInUser: User) => {
    const userToStore: Partial<User> = { ...loggedInUser };
    delete userToStore.password;
    localStorage.setItem('politirate_user', JSON.stringify(userToStore));
    setUser(userToStore as User);
  };

  const login = async (email: string, password: string, redirectPath?: string | null) => {
    let existingUser = await findUserByEmail(email);

    if (!existingUser) {
      throw new Error("An account with this email does not exist. Please sign up first.");
    }
    
    if (existingUser.password !== password) {
      throw new Error('Invalid email or password.');
    }

    if (existingUser.isBlocked) {
      if (existingUser.blockedUntil && isAfter(new Date(), new Date(existingUser.blockedUntil))) {
        await unblockUser(existingUser.id);
        existingUser = (await findUserByEmail(email))!;
      } else {
        throw new Error(`BLOCKED::${existingUser.blockReason}::${existingUser.blockedUntil}`);
      }
    }
    
    handleSuccessfulLogin(existingUser);
    router.push(redirectPath || '/');
  };

  const signup = async (email: string, password: string) => {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new Error('An account with this email already exists.');
    }

    const newUser = await addNewUser({ email, password });

    if (!newUser) {
        throw new Error('Failed to create account. Please try again.');
    }
    router.push('/login');
  };

  const signInWithGoogle = async (redirectPath?: string | null) => {
    if (!firebaseEnabled) {
      throw new Error("Google Sign-In is not configured for this application.");
    }

    if (redirectPath) {
      sessionStorage.setItem('auth_redirect', redirectPath);
    } else {
      sessionStorage.removeItem('auth_redirect');
    }
    
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth as any, provider);
  };

  const logout = async () => {
    if (firebaseEnabled) {
        await signOut(auth as any).catch(console.error);
    }
    localStorage.removeItem('politirate_user');
    setUser(null);
    router.push('/');
  };

  const updateUser = async (profileData: Partial<User>) => {
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const updatedUser = await updateUserProfile(user.id, profileData);

    if (updatedUser) {
      // Re-set user state and local storage with fresh data.
      handleSuccessfulLogin(updatedUser);
    }

    return updatedUser;
  };

  const value = { user, loading, login, signup, logout, updateUser, signInWithGoogle };

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
