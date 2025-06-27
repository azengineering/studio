"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { findUserByEmail, addUser as addNewUser } from '@/data/users';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for a logged-in user in localStorage on component mount
    try {
      const storedUser = localStorage.getItem('politirate_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('politirate_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
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
    router.push('/');
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
    router.push('/login');
  };

  const value = { user, loading, login, signup, logout };

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
