
'use server';

import { db, convertFirestoreData } from '@/lib/db';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { User } from './users';

export interface Leader {
  id: string;
  name: string;
  partyName: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  photoUrl: string;
  constituency: string;
  nativeAddress: string;
  electionType: 'national' | 'state' | 'panchayat';
  location: {
    state?: string;
    district?: string;
  };
  rating: number;
  reviewCount: number;
  previousElections: Array<{
    electionType: string;
    constituency: string;
    status: 'winner' | 'loser';
    electionYear: string;
    partyName: string;
  }>;
  manifestoUrl?: string;
  twitterUrl?: string;
  addedByUserId?: string | null;
  createdAt?: any; // Allow Timestamp or string
  status: 'pending' | 'approved' | 'rejected';
  adminComment?: string | null;
  userName?: string;
}

export interface Review {
  userId: string;
  userName: string;
  rating: number;
  comment: string | null;
  updatedAt: any; // Allow Timestamp or string
  socialBehaviour: string | null;
}

export interface UserActivity {
  leaderId: string;
  leaderName: string;
  leaderPhotoUrl: string;
  rating: number;
  comment: string | null;
  updatedAt: string;
  leader: Leader;
  socialBehaviour: string | null;
  userName: string;
}

export interface RatingDistribution {
  rating: number;
  count: number;
}

export interface SocialBehaviourDistribution {
  name: string;
  count: number;
}

// --- Public API ---

// Gets only approved leaders for the public site
export async function getLeaders(): Promise<Leader[]> {
  const leadersRef = db.collection('leaders');
  const snapshot = await leadersRef.where('status', '==', 'approved').get();
  
  if (snapshot.empty) {
    return [];
  }
  
  const leaders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Leader));
  return convertFirestoreData(leaders);
}

export async function addLeader(leaderData: Omit<Leader, 'id' | 'rating' | 'reviewCount' | 'addedByUserId' | 'createdAt' | 'status' | 'adminComment' | 'userName'>, userId: string | null): Promise<void> {
    const newLeader: Omit<Leader, 'id'> = {
        ...leaderData,
        rating: 0,
        reviewCount: 0,
        addedByUserId: userId,
        createdAt: FieldValue.serverTimestamp(),
        status: 'pending', // New leaders are pending approval
        adminComment: null,
    };
    await db.collection('leaders').add(newLeader);
}

export async function getLeaderById(id: string): Promise<Leader | null> {
    const docRef = db.collection('leaders').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
        return null;
    }
    
    const leaderData = { id: doc.id, ...doc.data() } as Leader;
    return convertFirestoreData(leaderData);
}

export async function updateLeader(leaderId: string, leaderData: Omit<Leader, 'id' | 'rating' | 'reviewCount' | 'addedByUserId' | 'createdAt' | 'status' | 'adminComment' | 'userName'>, userId: string | null, isAdmin: boolean): Promise<Leader | null> {
    const leaderRef = db.collection('leaders').doc(leaderId);
    const doc = await leaderRef.get();

    if (!doc.exists) {
        throw new Error("Leader not found.");
    }
    const leaderToUpdate = doc.data() as Leader;
    
    if (!isAdmin && leaderToUpdate.addedByUserId !== userId) {
        throw new Error("You are not authorized to edit this leader.");
    }

    let newStatus: Leader['status'] = leaderToUpdate.status;
    let newAdminComment: string | null | undefined = leaderToUpdate.adminComment;

    if (!isAdmin) {
        newStatus = 'pending';
        newAdminComment = 'User updated details. Pending re-approval.';
    }

    await leaderRef.update({
        ...leaderData,
        status: newStatus,
        adminComment: newAdminComment,
    });

    return getLeaderById(leaderId);
}

export async function submitRatingAndComment(leaderId: string, userId: string, newRating: number, comment: string | null, socialBehaviour: string | null): Promise<Leader | null> {
    if (!userId) {
        throw new Error("User must be authenticated to submit a rating.");
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
        throw new Error("User not found.");
    }
    const userName = (userDoc.data() as User)?.name || 'Anonymous';
    
    const leaderRef = db.collection('leaders').doc(leaderId);
    const ratingRef = db.collection('ratings').doc(`${userId}_${leaderId}`);

    await db.runTransaction(async (transaction) => {
        const leaderDoc = await transaction.get(leaderRef);
        const ratingDoc = await transaction.get(ratingRef);

        if (!leaderDoc.exists) {
            throw new Error("Leader not found.");
        }

        const leaderData = leaderDoc.data() as Leader;
        const oldRating = ratingDoc.exists ? (ratingDoc.data()?.rating || 0) : 0;
        
        // Calculate new average rating
        let newReviewCount = leaderData.reviewCount;
        let newTotalRating = leaderData.rating * leaderData.reviewCount;

        if (ratingDoc.exists) {
            // Update existing rating
            newTotalRating = newTotalRating - oldRating + newRating;
        } else {
            // New rating
            newReviewCount += 1;
            newTotalRating += newRating;
        }
        
        const newAverageRating = newReviewCount > 0 ? newTotalRating / newReviewCount : 0;
        
        // Update leader document
        transaction.update(leaderRef, {
            rating: newAverageRating,
            reviewCount: newReviewCount
        });
        
        // Upsert rating document
        transaction.set(ratingRef, {
            userId,
            leaderId,
            userName,
            rating: newRating,
            comment,
            socialBehaviour,
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
    });

    return getLeaderById(leaderId);
}


export async function getReviewsForLeader(leaderId: string): Promise<Review[]> {
    const ratingsRef = db.collection('ratings');
    const snapshot = await ratingsRef.where('leaderId', '==', leaderId).orderBy('updatedAt', 'desc').get();
    
    if (snapshot.empty) {
        return [];
    }
    
    const reviews = snapshot.docs.map(doc => doc.data() as Review);
    return convertFirestoreData(reviews);
}

export async function getRatingDistribution(leaderId: string): Promise<RatingDistribution[]> {
    const snapshot = await db.collection('ratings').where('leaderId', '==', leaderId).get();
    if (snapshot.empty) return [];

    const counts: { [key: number]: number } = {};
    snapshot.docs.forEach(doc => {
        const rating = doc.data().rating;
        counts[rating] = (counts[rating] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([rating, count]) => ({ rating: Number(rating), count }))
      .sort((a, b) => b.rating - a.rating);
}

export async function getSocialBehaviourDistribution(leaderId: string): Promise<SocialBehaviourDistribution[]> {
    const snapshot = await db.collection('ratings').where('leaderId', '==', leaderId).get();
    if (snapshot.empty) return [];

    const counts: { [key: string]: number } = {};
    snapshot.docs.forEach(doc => {
        const behaviour = doc.data().socialBehaviour;
        if (behaviour) {
            counts[behaviour] = (counts[behaviour] || 0) + 1;
        }
    });

    return Object.entries(counts)
        .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' '), count }))
        .sort((a, b) => b.count - a.count);
}


export async function getActivitiesForUser(userId: string): Promise<UserActivity[]> {
    const ratingsRef = db.collection('ratings');
    const snapshot = await ratingsRef.where('userId', '==', userId).orderBy('updatedAt', 'desc').get();

    if (snapshot.empty) {
        return [];
    }

    const activities = await Promise.all(snapshot.docs.map(async (doc) => {
        const ratingData = doc.data();
        const leader = await getLeaderById(ratingData.leaderId);
        
        if (!leader) return null;

        return {
            leaderId: leader.id,
            leaderName: leader.name,
            leaderPhotoUrl: leader.photoUrl,
            rating: ratingData.rating,
            comment: ratingData.comment,
            updatedAt: ratingData.updatedAt,
            socialBehaviour: ratingData.socialBehaviour,
            userName: ratingData.userName,
            leader: leader,
        } as UserActivity;
    }));
    
    return convertFirestoreData(activities.filter(a => a !== null));
}


export async function getLeadersAddedByUser(userId: string): Promise<Leader[]> {
  const leadersRef = db.collection('leaders');
  const snapshot = await leadersRef.where('addedByUserId', '==', userId).orderBy('name', 'asc').get();
  if (snapshot.empty) {
    return [];
  }
  const leaders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Leader));
  return convertFirestoreData(leaders);
}


export async function getLeaderCount(filters?: { startDate?: string, endDate?: string, state?: string, constituency?: string }): Promise<number> {
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('leaders');

    if (filters?.startDate && filters?.endDate) {
        query = query.where('createdAt', '>=', new Date(filters.startDate)).where('createdAt', '<=', new Date(filters.endDate));
    }
    if (filters?.state) {
        query = query.where('location.state', '==', filters.state);
    }
    // Firestore doesn't support 'LIKE' queries. We'll filter for exact constituency matches for now.
    if (filters?.constituency) {
        query = query.where('constituency', '==', filters.constituency);
    }
    
    const snapshot = await query.count().get();
    return snapshot.data().count;
}

export async function getRatingCount(filters?: { startDate?: string, endDate?: string, state?: string, constituency?: string }): Promise<number> {
    // This is complex with Firestore without denormalization.
    // For now, we return the total count as filtering across collections is not straightforward.
    const snapshot = await db.collection('ratings').count().get();
    return snapshot.data().count;
}

// --- Admin Functions ---
export async function getLeadersForAdminPanel(filters: {
    dateFrom?: string;
    dateTo?: string;
    state?: string;
    constituency?: string;
    candidateName?: string;
}): Promise<Leader[]> {
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('leaders');

    if (filters.dateFrom && filters.dateTo) {
        query = query.where('createdAt', '>=', new Date(filters.dateFrom)).where('createdAt', '<=', new Date(filters.dateTo));
    }
    if (filters.state) {
        query = query.where('location.state', '==', filters.state);
    }
    // Firestore doesn't support multiple range/inequality filters or text search on different fields.
    // This search is now simplified. For full functionality, an external search service like Algolia is recommended.
    if (filters.candidateName) {
        query = query.orderBy('name').startAt(filters.candidateName).endAt(filters.candidateName + '\uf8ff');
    } else if (filters.constituency) {
         query = query.orderBy('constituency').startAt(filters.constituency).endAt(filters.constituency + '\uf8ff');
    } else {
        query = query.orderBy('createdAt', 'desc');
    }

    const snapshot = await query.get();
    const leaders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Leader);

    // Fetch user names for 'addedBy'
    const users = await db.collection('users').get();
    const userMap = new Map(users.docs.map(doc => [doc.id, doc.data().name]));

    const leadersWithUserNames = leaders.map(leader => ({
        ...leader,
        userName: leader.addedByUserId ? userMap.get(leader.addedByUserId) || 'Unknown' : 'Admin/System'
    }));

    return convertFirestoreData(leadersWithUserNames);
}


export async function approveLeader(leaderId: string): Promise<void> {
    const leaderRef = db.collection('leaders').doc(leaderId);
    await leaderRef.update({
        status: 'approved',
        adminComment: 'Approved by admin.'
    });
}

export async function updateLeaderStatus(leaderId: string, status: 'pending' | 'approved' | 'rejected', adminComment: string | null): Promise<void> {
    const leaderRef = db.collection('leaders').doc(leaderId);
    await leaderRef.update({ status, adminComment });
}

export async function deleteLeader(leaderId: string): Promise<void> {
    const leaderRef = db.collection('leaders').doc(leaderId);
    const ratingsRef = db.collection('ratings');

    // In a real app, you'd use a Cloud Function to delete subcollections
    // or related data. Here we delete related ratings.
    const snapshot = await ratingsRef.where('leaderId', '==', leaderId).get();
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    batch.delete(leaderRef);
    
    await batch.commit();
}

export async function deleteRating(userId: string, leaderId: string): Promise<void> {
    const ratingRef = db.collection('ratings').doc(`${userId}_${leaderId}`);
    const leaderRef = db.collection('leaders').doc(leaderId);

    await db.runTransaction(async (transaction) => {
        const ratingDoc = await transaction.get(ratingRef);
        const leaderDoc = await transaction.get(leaderRef);

        if (!ratingDoc.exists || !leaderDoc.exists) return;

        const ratingToDelete = ratingDoc.data()?.rating || 0;
        const leaderData = leaderDoc.data() as Leader;
        
        const newReviewCount = (leaderData.reviewCount || 1) - 1;
        let newAverageRating = 0;
        if (newReviewCount > 0) {
            const currentTotal = leaderData.rating * leaderData.reviewCount;
            newAverageRating = (currentTotal - ratingToDelete) / newReviewCount;
        }

        transaction.update(leaderRef, {
            rating: newAverageRating,
            reviewCount: newReviewCount,
        });

        transaction.delete(ratingRef);
    });
}
