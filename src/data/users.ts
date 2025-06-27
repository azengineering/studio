
'use server';

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

// --- localStorage Helper Functions ---
const isServer = typeof window === 'undefined';

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (isServer) return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T) {
  if (isServer) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key “${key}”:`, error);
  }
}

// --- Data Key ---
const USERS_KEY = 'politirate_users';

// --- Seeding Logic ---
function seedUsers() {
    if (isServer) return;
    const users = getFromStorage<User[]>(USERS_KEY, []);
    if (users.length === 0) {
        // You can add default users here if needed, for example:
        // const defaultUsers = [ ... ];
        // setToStorage(USERS_KEY, defaultUsers);
    }
}
seedUsers();

// --- Public API ---

export async function getUsers(): Promise<User[]> {
    return Promise.resolve(getFromStorage<User[]>(USERS_KEY, []));
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const users = await getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  return Promise.resolve(user);
}

export async function findUserById(id: string): Promise<User | undefined> {
  const users = await getUsers();
  const user = users.find(u => u.id === id);
  if (user) {
    delete user.password;
  }
  return Promise.resolve(user);
}

export async function addUser(user: Omit<User, 'id' | 'name'>): Promise<User | null> {
  const users = await getUsers();
  const name = user.email.split('@')[0];
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

  const newUser: User = {
    ...user,
    id: new Date().getTime().toString(),
    name: formattedName
  };

  users.push(newUser);
  setToStorage(USERS_KEY, users);
  
  const createdUser: Partial<User> = { ...newUser };
  delete createdUser.password;

  return Promise.resolve(createdUser as User);
}

export async function updateUserProfile(userId: string, profileData: Partial<User>): Promise<User | null> {
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        throw new Error("User not found.");
    }

    // Update the user object
    users[userIndex] = { ...users[userIndex], ...profileData };
    
    // Clean up empty string values to be stored as undefined or null
    Object.keys(users[userIndex]).forEach(key => {
        const k = key as keyof User;
        if (users[userIndex][k] === '') {
            // @ts-ignore
            users[userIndex][k] = undefined;
        }
        if (k === 'age' && isNaN(Number(users[userIndex][k]))) {
             users[userIndex][k] = undefined;
        }
    });


    setToStorage(USERS_KEY, users);

    const updatedUser = await findUserById(userId);
    return Promise.resolve(updatedUser || null);
}
