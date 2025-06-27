'use server';

import { db } from '@/lib/db';

// For a real app, passwords should be securely hashed.
// For this client-side prototype, we'll store them as-is.
export interface User {
  id: string;
  email: string;
  password?: string;
  name?: string;
  gender?: 'male' | 'female' | 'other' | '';
  age?: number;
  state?: string;
  mpConstituency?: string;
  mlaConstituency?: string;
  panchayat?: string;
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

export async function findUserById(id: string): Promise<User | undefined> {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(id) as User | undefined;
    if (user) {
      delete user.password;
    }
    return user;
  } catch (error) {
    console.error("Database error in findUserById:", error);
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

export async function updateUserProfile(userId: string, profileData: Partial<User>): Promise<User | null> {
    try {
        const updatableData: Partial<User> = { ...profileData };
        delete updatableData.id;
        delete updatableData.email;
        delete updatableData.password;

        const fields = Object.entries(updatableData).filter(
          ([, value]) => value !== undefined
        );

        // Handle cases where empty strings should be null, e.g., for optional foreign keys or numbers
        const finalFields = fields.map(([key, value]) => {
          if (value === '' || value === null) {
            return [key, null];
          }
          return [key, value];
        });


        if (finalFields.length === 0) {
            return findUserById(userId);
        }

        const setClauses = finalFields.map(([key]) => `${key} = ?`).join(', ');
        const values = finalFields.map(([, value]) => value);
        values.push(userId);
        
        const stmt = db.prepare(`UPDATE users SET ${setClauses} WHERE id = ?`);
        stmt.run(...values);

        const updatedUser = await findUserById(userId);
        return updatedUser || null;
    } catch (error) {
        console.error("Database error in updateUserProfile:", error);
        throw new Error("Failed to update profile in database.");
    }
}
