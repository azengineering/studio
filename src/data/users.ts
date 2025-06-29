
'use server';

import { db } from '@/lib/db';
import type { RunResult } from 'better-sqlite3';

// For a real app, passwords should be securely hashed.
// For this prototype, we'll store them as-is.
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
  createdAt?: string;
}

export async function getUsers(): Promise<User[]> {
    const stmt = db.prepare('SELECT * FROM users');
    const users = stmt.all() as User[];
    return Promise.resolve(users.map(u => {
        delete u.password;
        return u;
    }));
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = stmt.get(email.toLowerCase()) as User | undefined;
  return Promise.resolve(user);
}

export async function findUserById(id: string): Promise<User | undefined> {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = stmt.get(id) as User | undefined;
  if (user) {
    delete user.password;
  }
  return Promise.resolve(user);
}

export async function addUser(user: Omit<User, 'id' | 'name' | 'createdAt'>): Promise<User | null> {
  const name = user.email.split('@')[0];
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
  const id = new Date().getTime().toString();
  const createdAt = new Date().toISOString();
  
  const newUser: User = {
    ...user,
    id,
    name: formattedName,
    createdAt,
  };

  const stmt = db.prepare(`
    INSERT INTO users (id, email, password, name, createdAt)
    VALUES (@id, @email, @password, @name, @createdAt)
  `);

  try {
    stmt.run({
        id: newUser.id,
        email: newUser.email.toLowerCase(),
        password: newUser.password,
        name: newUser.name,
        createdAt: newUser.createdAt,
    });
    
    const createdUser: Partial<User> = { ...newUser };
    delete createdUser.password;
    return Promise.resolve(createdUser as User);

  } catch (error) {
    console.error("Error adding user:", error);
    return Promise.resolve(null);
  }
}

export async function updateUserProfile(userId: string, profileData: Partial<User>): Promise<User | null> {
    const dataToUpdate = { ...profileData };
    delete dataToUpdate.id; // Cannot update ID
    delete dataToUpdate.email; // Cannot update email
    delete dataToUpdate.password; // Password updated elsewhere
    delete dataToUpdate.createdAt; // Cannot update creation date

    const setClauses = Object.keys(dataToUpdate).map(key => `${key} = @${key}`).join(', ');
    
    if (!setClauses) {
        // Nothing to update
        return findUserById(userId).then(user => user || null);
    }
    
    const stmt = db.prepare(`UPDATE users SET ${setClauses} WHERE id = @id`);

    try {
        const params: { [key: string]: any } = { id: userId };
        for (const [key, value] of Object.entries(dataToUpdate)) {
            // Handle empty strings from form to be stored as null
            params[key] = value === '' ? null : value;
             if (key === 'age' && isNaN(Number(value))) {
                 params[key] = null;
             }
        }
        
        stmt.run(params);

        const updatedUser = await findUserById(userId);
        return Promise.resolve(updatedUser || null);
    } catch (error) {
        console.error("Error updating user profile:", error);
        return Promise.resolve(null);
    }
}

export async function getUserCount(startDate?: string, endDate?: string): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM users';
    const params: string[] = [];
    if (startDate && endDate) {
        query += ' WHERE createdAt >= ? AND createdAt <= ?';
        params.push(startDate, endDate);
    }
    const { count } = db.prepare(query).get(...params) as { count: number };
    return Promise.resolve(count);
}
