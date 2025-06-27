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
        const updatePayload: { [key: string]: any } = {};

        // Define the keys that are allowed to be updated.
        const allowedKeys: Array<keyof User> = ['name', 'gender', 'age', 'state', 'mpConstituency', 'mlaConstituency', 'panchayat'];
        
        allowedKeys.forEach(key => {
            // Check if the key exists in the submitted data and is not undefined.
            if (profileData[key] !== undefined) {
                // If the value is an empty string, convert it to null for database consistency.
                // Otherwise, use the provided value.
                updatePayload[key] = profileData[key] === '' ? null : profileData[key];
            }
        });
        
        // The zod schema on the client pre-processes an empty age input to `undefined`, 
        // so it's correctly skipped here and not included in updatePayload.

        const fieldsToUpdate = Object.keys(updatePayload);

        if (fieldsToUpdate.length === 0) {
            // Nothing to update, return the current user data.
            return findUserById(userId);
        }

        // Build the SET clause dynamically using named parameters for safety.
        const setClauses = fieldsToUpdate.map(key => `${key} = @${key}`).join(', ');
        
        const sql = `UPDATE users SET ${setClauses} WHERE id = @id`;

        // Combine the payload with the user ID for the query parameters.
        const params = { ...updatePayload, id: userId };
        
        const stmt = db.prepare(sql);
        stmt.run(params);

        const updatedUser = await findUserById(userId);
        return updatedUser || null;
    } catch (error) {
        console.error("Database error in updateUserProfile:", error);
        throw new Error("Failed to update profile in database.");
    }
}
