'use server';

import { db } from '@/lib/db';

// For a real app, passwords should be securely hashed.
// For this client-side prototype, we'll store them as-is.
export interface User {
  id: string;
  email: string;
  password?: string;
  name?: string;
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

export async function addUser(user: Omit<User, 'id' | 'name'>): Promise<User | null> {
  const name = user.email.split('@')[0];
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

  const newUser: User = {
    ...user,
    id: new Date().getTime().toString(),
    name: formattedName
  };

  try {
    const stmt = db.prepare('INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)');
    stmt.run(newUser.id, newUser.email.toLowerCase(), newUser.password!, newUser.name);
    
    const createdUser: Partial<User> = { ...newUser };
    delete createdUser.password;

    return createdUser as User;
  } catch (error) {
    console.error("Database error in addUser:", error);
    return null;
  }
}
