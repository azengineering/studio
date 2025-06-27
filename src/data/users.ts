'use server';

import { db } from '@/lib/db';

// For a real app, passwords should be securely hashed.
// For this client-side prototype, we'll store them as-is.
export interface User {
  id: string;
  email: string;
  password: string;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email.toLowerCase()) as User | undefined;
    return user;
  } catch (error) {
    console.error("Database error in findUserByEmail:", error);
    return undefined;
  }
}

export async function addUser(user: Omit<User, 'id'>): Promise<User | null> {
  const newUser: User = {
    ...user,
    id: new Date().getTime().toString(),
  };

  try {
    const stmt = db.prepare('INSERT INTO users (id, email, password) VALUES (?, ?, ?)');
    stmt.run(newUser.id, newUser.email.toLowerCase(), newUser.password);
    return newUser;
  } catch (error) {
    console.error("Database error in addUser:", error);
    return null;
  }
}
