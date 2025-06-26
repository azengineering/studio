// For a real app, passwords should be securely hashed.
// For this client-side prototype, we'll store them as-is.
export interface User {
  id: string;
  email: string;
  password: string;
}

const USERS_STORAGE_KEY = 'politirate_users';

// Initialize with an empty array if nothing is stored
function initializeUsers(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(USERS_STORAGE_KEY)) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([]));
  }
}

initializeUsers();

export function getUsers(): User[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    return storedUsers ? JSON.parse(storedUsers) : [];
  } catch (error) {
    console.error("Failed to read users from localStorage", error);
    return [];
  }
}

export function findUserByEmail(email: string): User | undefined {
  const users = getUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
}

export function addUser(user: Omit<User, 'id'>): User | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const existingUser = findUserByEmail(user.email);
  if (existingUser) {
    // Return null or throw an error to indicate the user already exists
    return null;
  }

  const newUser: User = {
    ...user,
    id: new Date().getTime().toString(),
  };

  const currentUsers = getUsers();
  const updatedUsers = [...currentUsers, newUser];

  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    return newUser;
  } catch (error) {
    console.error("Failed to save user to localStorage", error);
    return null;
  }
}
