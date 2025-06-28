"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { findUserByEmail, addUser as addNewUser, updateUserProfile, type User, findUserById } from '@/data/users';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, redirectPath?: string | null) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (profileData: Partial<User>) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const syncUser = async () => {
      try {
        const storedUserString = localStorage.getItem('politirate_user');
        if (storedUserString) {
          const storedUser = JSON.parse(storedUserString);
          if (storedUser.id) {
            // Fetch the latest user data from the database to ensure sync
            const freshUser = await findUserById(storedUser.id);
            if (freshUser) {
              setUser(freshUser);
              // Re-sync localStorage with the fresh data from the DB
              localStorage.setItem('politirate_user', JSON.stringify(freshUser));
            } else {
              // User not found in DB, maybe deleted. Log them out locally.
              localStorage.removeItem('politirate_user');
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error("Failed to sync user from localStorage", error);
        // Clear potentially corrupted data
        localStorage.removeItem('politirate_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    syncUser();
  }, []); // The empty dependency array is correct, this should only run on initial mount.


  const login = async (email: string, password: string, redirectPath?: string | null) => {
    const existingUser = await findUserByEmail(email);

    if (!existingUser) {
      throw new Error("An account with this email does not exist. Please sign up first.");
    }
    
    if (existingUser.password !== password) {
      throw new Error('Invalid email or password.');
    }

    const loggedInUser: Partial<User & { password?: string }> = { ...existingUser };
    delete loggedInUser.password;
    
    localStorage.setItem('politirate_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser as User);
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

    // Redirect to login page after successful signup
    router.push('/login');
  };


  const logout = () => {
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
      setUser(updatedUser);
      localStorage.setItem('politirate_user', JSON.stringify(updatedUser));
    }

    return updatedUser;
  };

  const value = { user, loading, login, signup, logout, updateUser };

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
