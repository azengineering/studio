"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { findUserByEmail, addUser as addNewUser } from '@/data/users';

interface User {
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
    // Check for a logged-in user in sessionStorage on component mount
    try {
      const storedUser = sessionStorage.getItem('politirate_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from sessionStorage", error);
      sessionStorage.removeItem('politirate_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const existingUser = findUserByEmail(email);

    if (!existingUser || existingUser.password !== password) {
      throw new Error('Invalid email or password.');
    }

    const name = email.split('@')[0];
    const loggedInUser = { name: name.charAt(0).toUpperCase() + name.slice(1), email };
    
    sessionStorage.setItem('politirate_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    router.push('/');
  };

  const signup = async (email: string, password: string) => {
    const existingUser = findUserByEmail(email);
    if (existingUser) {
        throw new Error('An account with this email already exists.');
    }

    const newUser = addNewUser({ email, password });

    if (!newUser) {
        throw new Error('Failed to create account. Please try again.');
    }

    // Automatically log in after successful signup
    await login(email, password);
  };


  const logout = () => {
    sessionStorage.removeItem('politirate_user');
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
