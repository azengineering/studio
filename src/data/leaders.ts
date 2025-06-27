
'use server';

import type { User } from './users';
import { getUsers } from './users';

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
}

export interface Review {
  userName: string;
  rating: number;
  comment: string | null;
  updatedAt: string;
}

// Stored data structures
interface StoredRating {
  userId: string;
  leaderId: string;
  rating: number;
  updatedAt: string;
}
interface StoredComment {
  userId: string;
  leaderId: string;
  comment: string;
  updatedAt: string;
}

const defaultLeaders: Leader[] = [
  {
    id: '1',
    name: 'Aarav Sharma',
    partyName: 'Jan Vikas Party',
    gender: 'male',
    age: 45,
    photoUrl: 'https://placehold.co/400x400.png',
    constituency: 'Mumbai South',
    nativeAddress: 'Mumbai, Maharashtra',
    electionType: 'national',
    location: { state: 'Maharashtra' },
    rating: 4.5,
    reviewCount: 1,
    previousElections: [
      { electionType: 'national', constituency: 'Mumbai South', status: 'winner', electionYear: '2019', partyName: 'Jan Vikas Party' }
    ],
    twitterUrl: 'https://x.com/example',
  },
  {
    id: '2',
    name: 'Priya Singh',
    partyName: 'Lok Satta Party',
    gender: 'female',
    age: 38,
    photoUrl: 'https://placehold.co/400x400.png',
    constituency: 'Bangalore Central',
    nativeAddress: 'Bengaluru, Karnataka',
    electionType: 'national',
    location: { state: 'Karnataka' },
    rating: 4.2,
    reviewCount: 0,
    previousElections: [],
    twitterUrl: 'https://x.com/example',
  },
  {
    id: '3',
    name: 'Rohan Gupta',
    partyName: 'Swabhiman Party',
    gender: 'male',
    age: 52,
    photoUrl: 'https://placehold.co/400x400.png',
    constituency: 'Pune Assembly',
    nativeAddress: 'Pune, Maharashtra',
    electionType: 'state',
    location: { state: 'Maharashtra' },
    rating: 3.8,
    reviewCount: 0,
    previousElections: [],
    twitterUrl: 'https://x.com/example',
  },
  {
    id: '4',
    name: 'Sneha Reddy',
    partyName: 'People\'s Front',
    gender: 'female',
    age: 41,
    photoUrl: 'https://placehold.co/400x400.png',
    constituency: 'Chennai Corporation',
    nativeAddress: 'Chennai, Tamil Nadu',
    electionType: 'panchayat',
    location: { state: 'Tamil Nadu', district: 'Chennai' },
    rating: 4.8,
    reviewCount: 0,
    previousElections: [],
    twitterUrl: 'https://x.com/example',
  },
  {
    id: '5',
    name: 'Vikram Patel',
    partyName: 'Jan Vikas Party',
    gender: 'male',
    age: 55,
    photoUrl: 'https://placehold.co/400x400.png',
    constituency: 'Lucknow East',
    nativeAddress: 'Lucknow, Uttar Pradesh',
    electionType: 'state',
    location: { state: 'Uttar Pradesh' },
    rating: 3.5,
    reviewCount: 0,
    previousElections: [],
    twitterUrl: 'https://x.com/example',
  },
  {
    id: '6',
    name: 'Anika Desai',
    partyName: 'Independent',
    gender: 'female',
    age: 35,
    photoUrl: 'https://placehold.co/400x400.png',
    constituency: 'Mysuru Gram Panchayat',
    nativeAddress: 'Mysuru, Karnataka',
    electionType: 'panchayat',
    location: { state: 'Karnataka', district: 'Mysuru' },
    rating: 4.9,
    reviewCount: 0,
    previousElections: [],
    twitterUrl: 'https://x.com/example',
  },
   {
    id: '7',
    name: 'Ravi Kumar',
    partyName: 'Lok Satta Party',
    gender: 'male',
    age: 60,
    photoUrl: 'https://placehold.co/400x400.png',
    constituency: 'New Delhi',
    nativeAddress: 'New Delhi, Delhi',
    electionType: 'national',
    location: { state: 'Delhi' },
    rating: 4.1,
    reviewCount: 0,
    previousElections: [],
    twitterUrl: 'https://x.com/example',
  },
  {
    id: '8',
    name: 'Meera Iyer',
    partyName: 'Swabhiman Party',
    gender: 'female',
    age: 48,
    photoUrl: 'https://placehold.co/400x400.png',
    constituency: 'Madurai West',
    nativeAddress: 'Madurai, Tamil Nadu',
    electionType: 'state',
    location: { state: 'Tamil Nadu' },
    rating: 4.0,
    reviewCount: 0,
    previousElections: [],
    twitterUrl: 'https://x.com/example',
  }
];

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

// --- Data Keys ---
const LEADERS_KEY = 'politirate_leaders';
const RATINGS_KEY = 'politirate_ratings';
const COMMENTS_KEY = 'politirate_comments';


// --- Seeding Logic ---
function seedStorage() {
  if (isServer) return;
  const leaders = getFromStorage<Leader[]>(LEADERS_KEY, []);
  if (leaders.length === 0) {
    setToStorage(LEADERS_KEY, defaultLeaders);
    // You could pre-seed some ratings/comments here if desired
    setToStorage(RATINGS_KEY, {});
    setToStorage(COMMENTS_KEY, {});
  }
}
seedStorage();


// --- Public API ---

export async function getLeaders(): Promise<Leader[]> {
  return Promise.resolve(getFromStorage<Leader[]>(LEADERS_KEY, []));
}

export async function addLeader(leader: Omit<Leader, 'id' | 'rating' | 'reviewCount'>): Promise<void> {
    const allLeaders = await getLeaders();
    const newLeader: Leader = {
        ...leader,
        id: new Date().getTime().toString(),
        rating: 0,
        reviewCount: 0,
    };
    allLeaders.push(newLeader);
    setToStorage(LEADERS_KEY, allLeaders);
    return Promise.resolve();
}

export async function getLeaderById(id: string): Promise<Leader | null> {
    const allLeaders = await getLeaders();
    const leader = allLeaders.find(l => l.id === id) || null;
    return Promise.resolve(leader);
}

export async function submitRatingAndComment(leaderId: string, userId: string, newRating: number, comment: string | null): Promise<Leader | null> {
    const allLeaders = getFromStorage<Leader[]>(LEADERS_KEY, []);
    const leaderIndex = allLeaders.findIndex(l => l.id === leaderId);
    if (leaderIndex === -1) {
        throw new Error("Leader not found");
    }
    
    const leader = allLeaders[leaderIndex];

    const allRatings = getFromStorage<Record<string, StoredRating>>(RATINGS_KEY, {});
    const ratingKey = `${userId}_${leaderId}`;
    const existingRating = allRatings[ratingKey];

    const now = new Date().toISOString();

    if (existingRating) {
        // User is updating their rating
        const oldRatingValue = existingRating.rating;
        existingRating.rating = newRating;
        existingRating.updatedAt = now;
        
        if (leader.reviewCount > 0) {
            leader.rating = ((leader.rating * leader.reviewCount) - oldRatingValue + newRating) / leader.reviewCount;
        } else {
             leader.rating = newRating;
        }

    } else {
        // New rating from this user
        allRatings[ratingKey] = { userId, leaderId, rating: newRating, updatedAt: now };
        
        const newReviewCount = leader.reviewCount + 1;
        leader.rating = ((leader.rating * leader.reviewCount) + newRating) / newReviewCount;
        leader.reviewCount = newReviewCount;
    }
    
    // Handle comment
    if (comment && comment.trim().length > 0) {
        const allComments = getFromStorage<Record<string, StoredComment>>(COMMENTS_KEY, {});
        const commentKey = `${userId}_${leaderId}`;
        allComments[commentKey] = { userId, leaderId, comment, updatedAt: now };
        setToStorage(COMMENTS_KEY, allComments);
    }
    
    // Save updated data
    allLeaders[leaderIndex] = leader;
    setToStorage(LEADERS_KEY, allLeaders);
    setToStorage(RATINGS_KEY, allRatings);

    return Promise.resolve(leader);
}

export async function getReviewsForLeader(leaderId: string): Promise<Review[]> {
    const allUsers = await getUsers();
    const allRatings = getFromStorage<Record<string, StoredRating>>(RATINGS_KEY, {});
    const allComments = getFromStorage<Record<string, StoredComment>>(COMMENTS_KEY, {});

    const userMap = new Map<string, User>(allUsers.map(u => [u.id, u]));

    const leaderRatings = Object.values(allRatings).filter(r => r.leaderId === leaderId);

    const reviews: Review[] = leaderRatings.map(rating => {
        const user = userMap.get(rating.userId);
        const commentKey = `${rating.userId}_${leaderId}`;
        const comment = allComments[commentKey]?.comment || null;

        return {
            userName: user?.name || 'Anonymous',
            rating: rating.rating,
            comment: comment,
            updatedAt: rating.updatedAt,
        };
    });

    // Sort by most recent first
    reviews.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return Promise.resolve(reviews);
}
