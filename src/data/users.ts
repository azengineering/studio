
'use server';

import { db, convertFirestoreData } from '@/lib/db';
import { FieldValue } from 'firebase-admin/firestore';
import { isAfter } from 'date-fns';

export interface User {
  id: string;
  email: string;
  password?: string; // Should not be stored in Firestore but used for auth logic
  name?: string;
  gender?: 'male' | 'female' | 'other' | '';
  age?: number;
  state?: string;
  mpConstituency?: string;
  mlaConstituency?: string;
  panchayat?: string;
  createdAt?: any;
  isBlocked?: boolean;
  blockedUntil?: any | null;
  blockReason?: string | null;
}

export interface AdminMessage {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: any;
}


// This is a mock auth function. In a real Firestore app, you'd use Firebase Auth.
// This function emulates the password check for the prototype.
async function verifyPassword(userId: string, passwordAttempt: string): Promise<boolean> {
    const pwDoc = await db.collection('user_credentials').doc(userId).get();
    if (!pwDoc.exists) return false; // Or handle as social login
    return pwDoc.data()?.password === passwordAttempt;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email.toLowerCase()).limit(1).get();
  
  if (snapshot.empty) {
    return undefined;
  }
  
  const userDoc = snapshot.docs[0];
  return convertFirestoreData({ id: userDoc.id, ...userDoc.data() }) as User;
}

export async function findUserById(id: string): Promise<User | undefined> {
  const docRef = db.collection('users').doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    return undefined;
  }

  return convertFirestoreData({ id: doc.id, ...doc.data() }) as User;
}

export async function addUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User | null> {
  const name = user.name || user.email.split('@')[0];
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
  
  const userRef = db.collection('users').doc();
  const newUser: Omit<User, 'id' | 'password'> = {
    email: user.email.toLowerCase(),
    name: formattedName,
    createdAt: FieldValue.serverTimestamp(),
    isBlocked: false,
    blockedUntil: null,
    blockReason: null,
  };

  await userRef.set(newUser);
  
  // Store password separately for mock auth. DO NOT do this in production.
  if (user.password) {
      await db.collection('user_credentials').doc(userRef.id).set({ password: user.password });
  }

  return { ...newUser, id: userRef.id };
}

export async function updateUserProfile(userId: string, profileData: Partial<User>): Promise<User | null> {
    const userRef = db.collection('users').doc(userId);
    const dataToUpdate: { [key: string]: any } = { ...profileData };
    
    // Remove fields that shouldn't be updated this way
    delete dataToUpdate.id;
    delete dataToUpdate.email;
    delete dataToUpdate.password;
    delete dataToUpdate.createdAt;

    // Convert empty strings to null for clean data
    Object.keys(dataToUpdate).forEach(key => {
        if (dataToUpdate[key] === '') {
            dataToUpdate[key] = null;
        }
         if (key === 'age' && isNaN(Number(dataToUpdate[key]))) {
            dataToUpdate[key] = null;
        }
    });

    await userRef.update(dataToUpdate);
    return findUserById(userId).then(user => user || null);
}

export async function getUserCount(filters?: { startDate?: string, endDate?: string, state?: string, constituency?: string }): Promise<number> {
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('users');

    if (filters?.startDate && filters?.endDate) {
        query = query.where('createdAt', '>=', new Date(filters.startDate)).where('createdAt', '<=', new Date(filters.endDate));
    }
    if (filters?.state) {
        query = query.where('state', '==', filters.state);
    }
    // Full-text search on constituencies is not possible with basic Firestore queries.
    // This will be an exact match if a constituency is provided.
    if (filters?.constituency) {
        // Since we can't do an OR query, we can't search all three constituency fields simply.
        // This is a limitation we accept for this migration.
    }
    
    const snapshot = await query.count().get();
    return snapshot.data().count;
}

// --- Admin Moderation Functions ---

export async function blockUser(userId: string, reason: string, blockedUntil: string | null): Promise<void> {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
        isBlocked: true,
        blockReason: reason,
        blockedUntil: blockedUntil ? new Date(blockedUntil) : null,
    });
}

export async function unblockUser(userId: string): Promise<void> {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
        isBlocked: false,
        blockReason: null,
        blockedUntil: null,
    });
}

export async function getUsers(query?: string): Promise<Omit<User, 'password'>[]> {
  const usersRef = db.collection('users');
  let queryBuilder: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = usersRef;
  
  if (query) {
    // Firestore requires an index for this type of query.
    // Also, it cannot perform 'OR' queries on different fields.
    // A more robust solution would use a search service like Algolia.
    // For now, we will search by email as it's a common use case.
     queryBuilder = queryBuilder.where('email', '>=', query).where('email', '<=', query + '\uf8ff');
  } else {
      queryBuilder = queryBuilder.orderBy('createdAt', 'desc');
  }

  const snapshot = await queryBuilder.get();
  if (snapshot.empty) return [];

  const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Enrich with counts (N+1 problem, but necessary for prototype)
  const enrichedUsers = await Promise.all(users.map(async (user) => {
      const ratingsSnapshot = await db.collection('ratings').where('userId', '==', user.id).count().get();
      const leadersSnapshot = await db.collection('leaders').where('addedByUserId', '==', user.id).count().get();
      const messagesSnapshot = await db.collection('admin_messages').where('userId', '==', user.id).where('isRead', '==', false).count().get();

      return {
          ...user,
          ratingCount: ratingsSnapshot.data().count,
          leaderAddedCount: leadersSnapshot.data().count,
          unreadMessageCount: messagesSnapshot.data().count,
      };
  }));

  return convertFirestoreData(enrichedUsers);
}

export async function addAdminMessage(userId: string, message: string): Promise<void> {
  const messageRef = db.collection('admin_messages').doc();
  await messageRef.set({
      userId,
      message,
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
  });
}

export async function getAdminMessages(userId: string): Promise<AdminMessage[]> {
  const snapshot = await db.collection('admin_messages').where('userId', '==', userId).orderBy('createdAt', 'desc').get();
  if (snapshot.empty) return [];
  const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AdminMessage);
  return convertFirestoreData(messages);
}

export async function getUnreadMessages(userId: string): Promise<AdminMessage[]> {
  const snapshot = await db.collection('admin_messages').where('userId', '==', userId).where('isRead', '==', false).orderBy('createdAt', 'asc').get();
  if (snapshot.empty) return [];
  const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AdminMessage);
  return convertFirestoreData(messages);
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  await db.collection('admin_messages').doc(messageId).update({ isRead: true });
}

export async function deleteAdminMessage(messageId: string): Promise<void> {
    await db.collection('admin_messages').doc(messageId).delete();
}
