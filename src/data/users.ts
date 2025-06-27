// For a real app, passwords should be securely hashed.
// For this client-side prototype, we'll store them as-is.
export interface User {
  id: string;
  email: string;
  password: string;
}

// Helper to get users from localStorage
function getStoredUsers(): User[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const usersJson = localStorage.getItem('politirate_users');
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (error) {
    console.error("Failed to parse users from localStorage", error);
    return [];
  }
}

// Helper to set users in localStorage
function setStoredUsers(users: User[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem('politirate_users', JSON.stringify(users));
}


export function getUsers(): User[] {
  return getStoredUsers();
}

export function findUserByEmail(email: string): User | undefined {
  const users = getStoredUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
}

export function addUser(user: Omit<User, 'id'>): User | null {
  const users = getStoredUsers();
  const existingUser = users.find(u => u.email.toLowerCase() === user.email.toLowerCase());
  
  if (existingUser) {
    return null;
  }

  const newUser: User = {
    ...user,
    id: new Date().getTime().toString(),
  };

  users.push(newUser);
  setStoredUsers(users);
  return newUser;
}
