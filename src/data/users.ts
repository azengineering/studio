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
        const fieldsToUpdate = Object.keys(profileData);

        if (fieldsToUpdate.length === 0) {
            return await findUserById(userId); // Nothing to update
        }
        
        const setClauses = fieldsToUpdate.map(key => `${key} = @${key}`).join(', ');
        
        const dataForDb: { [key: string]: any } = {};

        fieldsToUpdate.forEach(key => {
            // @ts-ignore
            const value = profileData[key];
            if (key === 'age') {
                // For age, ensure it's a number or null.
                const numValue = Number(value);
                dataForDb[key] = (value === '' || value === null || value === undefined || isNaN(numValue)) ? null : numValue;
            } else if (typeof value === 'string') {
                // For strings, convert empty string to null.
                dataForDb[key] = value === '' ? null : value;
            } else {
                // For other types (like gender which could be undefined), convert undefined to null.
                dataForDb[key] = value === undefined ? null : value;
            }
        });

        const sql = `UPDATE users SET ${setClauses} WHERE id = @id`;
        
        const stmt = db.prepare(sql);
        
        stmt.run({
            ...dataForDb,
            id: userId
        });

        // Re-fetch the user from the database to confirm the update and return fresh data.
        return await findUserById(userId);

    } catch (error) {
        console.error("Database error in updateUserProfile:", error);
        // Re-throw a specific error message to be displayed on the client side.
        throw new Error("Failed to update profile in database.");
    }
}
