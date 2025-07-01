
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { findUserByEmail, addUser as addNewUser, updateUserProfile, type User, findUserById, unblockUser } from '@/data/users';
import { isAfter } from 'date-fns';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
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
    const handleAuthInit = async () => {
      setLoading(true);

      if (firebaseEnabled) {
        try {
          const result = await getRedirectResult(auth as any);
          if (result) {
            // User has just signed in via redirect.
            const googleUser = result.user;
            
            if (!googleUser.email) {
              throw new Error("Could not retrieve email from Google account.");
            }
        
            let userInDb = await findUserByEmail(googleUser.email);
            
            if (userInDb) {
              // User exists, check for block
              if (userInDb.isBlocked) {
                if (userInDb.blockedUntil && isAfter(new Date(), new Date(userInDb.blockedUntil))) {
                    await unblockUser(userInDb.id);
                    userInDb = (await findUserByEmail(googleUser.email))!;
                } else {
                     throw new Error(`BLOCKED::${userInDb.blockReason}::${userInDb.blockedUntil}`);
                }
              }
            } else {
              // New user, create an account without a password
              userInDb = await addNewUser({
                email: googleUser.email,
                name: googleUser.displayName || googleUser.email.split('@')[0],
              });
        
              if (!userInDb) {
                throw new Error("Failed to create a new user account.");
              }
            }
            
            const redirectPath = sessionStorage.getItem('auth_redirect');
            sessionStorage.removeItem('auth_redirect');
            handleSuccessfulLogin(userInDb, redirectPath);
            setLoading(false);
            return; // Auth handled, exit.
          }
        } catch (error) {
           // Handle errors like popup closed by user, etc.
           console.error("Google Sign-In Redirect Error:", error);
           sessionStorage.removeItem('auth_redirect');
        }
      }

      // If no redirect result, check for a user in localStorage (existing session).
      try {
        const storedUserString = localStorage.getItem('politirate_user');
        if (storedUserString) {
          const storedUser = JSON.parse(storedUserString);
          if (storedUser.id) {
            let freshUser = await findUserById(storedUser.id);
            if (freshUser) {
              if (freshUser.isBlocked) {
                if (freshUser.blockedUntil && isAfter(new Date(), new Date(freshUser.blockedUntil))) {
                  await unblockUser(freshUser.id);
                  freshUser = (await findUserById(freshUser.id))!;
                } else {
                  logout();
                  return;
                }
              }
              setUser(freshUser);
              localStorage.setItem('politirate_user', JSON.stringify(freshUser));
            } else {
              logout();
            }
          }
        }
      } catch (error) {
        console.error("Failed to sync user from localStorage", error);
        logout();
      } finally {
        setLoading(false);
      }
    };
    
    handleAuthInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleSuccessfulLogin = (loggedInUser: User, redirectPath?: string | null) => {
    const userToStore: Partial<User> = { ...loggedInUser };
    delete userToStore.password;
    localStorage.setItem('politirate_user', JSON.stringify(userToStore));
    setUser(userToStore as User);
    router.push(redirectPath || '/');
  };

  const login = async (email: string, password: string, redirectPath?: string | null) => {
    let existingUser = await findUserByEmail(email);

    if (!existingUser) {
      throw new Error("An account with this email does not exist. Please sign up first.");
    }
    
    if (existingUser.password !== password) {
      throw new Error('Invalid email or password.');
    }

    // Check if user is blocked
    if (existingUser.isBlocked) {
      if (existingUser.blockedUntil && isAfter(new Date(), new Date(existingUser.blockedUntil))) {
        // Ban has expired, unblock and continue login
        await unblockUser(existingUser.id);
        existingUser = (await findUserByEmail(email))!; // Refetch user data
      } else {
        // Active ban, prevent login by throwing a specific error
        throw new Error(`BLOCKED::${existingUser.blockReason}::${existingUser.blockedUntil}`);
      }
    }
    
    handleSuccessfulLogin(existingUser, redirectPath);
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

    // Redirect to login page after successful signup
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


  const logout = () => {
    localStorage.removeItem('politirate_user');
    setUser(null);
    window.location.href = '/';
  };

  const updateUser = async (profileData: Partial<User>) => {
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const updatedUser = await updateUserProfile(user.id, profileData);

    if (updatedUser) {
      setUser(updatedUser);
      localStorage.setItem('politirate_user', JSON.stringify(updatedUser));
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
