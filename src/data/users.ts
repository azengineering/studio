'use server';

import { db } from '@/lib/db';

// For a real app, passwords should be securely hashed.
// For this client-side prototype, we'll store them as-is.
export interface User {
  id: string;
  email: string;
  password?: string;
  name?: string;
  gender?: 'male' | 'female' | 'other';
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

export async function updateUserProfile(userId: string, profileData: Partial<Omit<User, 'id' | 'email' | 'password'>>): Promise<User | null> {
    try {
        const updates: { [key: string]: any } = {};
        const allowedKeys: (keyof typeof profileData)[] = ['name', 'gender', 'age', 'state', 'mpConstituency', 'mlaConstituency', 'panchayat'];

        allowedKeys.forEach(key => {
            if (profileData.hasOwnProperty(key)) {
                const value = profileData[key];
                // Store empty strings as null, but keep other "falsy" values like 0 for age
                updates[key] = value === '' || value === undefined ? null : value;
            }
        });

        const setClauses = Object.keys(updates).map(key => `${key} = ?`).join(', ');

        // If there's nothing to update, just return the current user data
        if (!setClauses) {
            const currentUserStmt = db.prepare('SELECT id, email, name, gender, age, state, mpConstituency, mlaConstituency, panchayat FROM users WHERE id = ?');
            const currentUser = currentUserStmt.get(userId) as User | undefined;
            return currentUser || null;
        }

        const values = Object.values(updates);
        const stmt = db.prepare(`UPDATE users SET ${setClauses} WHERE id = ?`);
        stmt.run(...values, userId);

        const updatedUserStmt = db.prepare('SELECT id, email, name, gender, age, state, mpConstituency, mlaConstituency, panchayat FROM users WHERE id = ?');
        const user = updatedUserStmt.get(userId) as User | undefined;
        
        return user || null;
    } catch (error) {
        console.error("Database error in updateUserProfile:", error);
        return null;
    }
}
