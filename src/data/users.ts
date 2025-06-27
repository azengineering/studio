// For a real app, passwords should be securely hashed.
// For this client-side prototype, we'll store them as-is.
export interface User {
  id: string;
  email: string;
  password: string;
}

// Storing users in-memory. This will reset on page refresh.
const users: User[] = [];

export function getUsers(): User[] {
  return users;
}

export function findUserByEmail(email: string): User | undefined {
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
}

export function addUser(user: Omit<User, 'id'>): User | null {
  const existingUser = findUserByEmail(user.email);
  if (existingUser) {
    return null;
  }

  const newUser: User = {
    ...user,
    id: new Date().getTime().toString(),
  };

  users.push(newUser);
  return newUser;
}
