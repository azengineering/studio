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
        // Fetch the current user data to ensure we have a complete object to work with.
        const currentUser = await findUserById(userId);
        if (!currentUser) {
            // This case should rarely happen if the user is authenticated.
            throw new Error(`User with ID ${userId} not found for update.`);
        }

        // Merge the updates from the form onto the current user data.
        // This ensures that any fields not present in the form are not accidentally cleared.
        const dataToSave = {
            ...currentUser,
            ...profileData,
        };
        
        const sql = `
            UPDATE users SET
                name = @name,
                gender = @gender,
                age = @age,
                state = @state,
                mpConstituency = @mpConstituency,
                mlaConstituency = @mlaConstituency,
                panchayat = @panchayat
            WHERE
                id = @id
        `;
        
        const stmt = db.prepare(sql);

        // Execute the update with named parameters for clarity and safety.
        // Any empty strings or undefined values from the form are converted to NULL 
        // for clean and consistent database storage.
        stmt.run({
            id: userId,
            name: dataToSave.name || null,
            gender: dataToSave.gender || null,
            age: dataToSave.age || null,
            state: dataToSave.state || null,
            mpConstituency: dataToSave.mpConstituency || null,
            mlaConstituency: dataToSave.mlaConstituency || null,
            panchayat: dataToSave.panchayat || null,
        });

        // Re-fetch the user from the database to confirm the update and return fresh data.
        return await findUserById(userId);

    } catch (error) {
        console.error("Database error in updateUserProfile:", error);
        // Re-throw a specific error message to be displayed on the client side.
        throw new Error("Failed to update profile in database.");
    }
}
