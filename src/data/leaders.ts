
'use server';

import { db } from '@/lib/db';
import type { User } from './users';
import { getUsers } from './users';
import type { RunResult } from 'better-sqlite3';

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

// --- DB data transformation ---
function dbToLeader(dbLeader: any): Leader {
    return {
        id: dbLeader.id,
        name: dbLeader.name,
        partyName: dbLeader.partyName,
        gender: dbLeader.gender,
        age: dbLeader.age,
        photoUrl: dbLeader.photoUrl,
        constituency: dbLeader.constituency,
        nativeAddress: dbLeader.nativeAddress,
        electionType: dbLeader.electionType,
        location: {
            state: dbLeader.location_state,
            district: dbLeader.location_district,
        },
        rating: dbLeader.rating,
        reviewCount: dbLeader.reviewCount,
        previousElections: JSON.parse(dbLeader.previousElections || '[]'),
        manifestoUrl: dbLeader.manifestoUrl,
        twitterUrl: dbLeader.twitterUrl,
    };
}

// --- Public API ---

export async function getLeaders(): Promise<Leader[]> {
  const stmt = db.prepare('SELECT * FROM leaders');
  const dbLeaders = stmt.all() as any[];
  return Promise.resolve(dbLeaders.map(dbToLeader));
}

export async function addLeader(leader: Omit<Leader, 'id' | 'rating' | 'reviewCount'>): Promise<void> {
    const newLeader: Leader = {
        ...leader,
        id: new Date().getTime().toString(),
        rating: 0,
        reviewCount: 0,
    };
    
    const stmt = db.prepare(`
        INSERT INTO leaders (id, name, partyName, gender, age, photoUrl, constituency, nativeAddress, electionType, location_state, location_district, rating, reviewCount, previousElections, manifestoUrl, twitterUrl)
        VALUES (@id, @name, @partyName, @gender, @age, @photoUrl, @constituency, @nativeAddress, @electionType, @location_state, @location_district, @rating, @reviewCount, @previousElections, @manifestoUrl, @twitterUrl)
    `);
    
    stmt.run({
        id: newLeader.id,
        name: newLeader.name,
        partyName: newLeader.partyName,
        gender: newLeader.gender,
        age: newLeader.age,
        photoUrl: newLeader.photoUrl,
        constituency: newLeader.constituency,
        nativeAddress: newLeader.nativeAddress,
        electionType: newLeader.electionType,
        location_state: newLeader.location.state,
        location_district: newLeader.location.district,
        rating: newLeader.rating,
        reviewCount: newLeader.reviewCount,
        previousElections: JSON.stringify(newLeader.previousElections),
        manifestoUrl: newLeader.manifestoUrl,
        twitterUrl: newLeader.twitterUrl
    });

    return Promise.resolve();
}

export async function getLeaderById(id: string): Promise<Leader | null> {
    const stmt = db.prepare('SELECT * FROM leaders WHERE id = ?');
    const dbLeader = stmt.get(id) as any;
    if (dbLeader) {
        return Promise.resolve(dbToLeader(dbLeader));
    }
    return Promise.resolve(null);
}

export async function submitRatingAndComment(leaderId: string, userId: string, newRating: number, comment: string | null): Promise<Leader | null> {
    const transaction = db.transaction(() => {
        const now = new Date().toISOString();

        // 1. Find existing rating
        const ratingStmt = db.prepare('SELECT rating FROM ratings WHERE userId = ? AND leaderId = ?');
        const existingRating = ratingStmt.get(userId, leaderId) as { rating: number } | undefined;
        
        // 2. Insert or update rating
        const upsertRatingStmt = db.prepare(`
            INSERT INTO ratings (userId, leaderId, rating, updatedAt)
            VALUES (@userId, @leaderId, @rating, @updatedAt)
            ON CONFLICT(userId, leaderId) DO UPDATE SET
            rating = excluded.rating,
            updatedAt = excluded.updatedAt
        `);
        upsertRatingStmt.run({ userId, leaderId, rating: newRating, updatedAt: now });

        // 3. Handle comment
        if (comment && comment.trim().length > 0) {
            const upsertCommentStmt = db.prepare(`
                INSERT INTO comments (userId, leaderId, comment, updatedAt)
                VALUES (@userId, @leaderId, @comment, @updatedAt)
                ON CONFLICT(userId, leaderId) DO UPDATE SET
                comment = excluded.comment,
                updatedAt = excluded.updatedAt
            `);
            upsertCommentStmt.run({ userId, leaderId, comment, updatedAt: now });
        }

        // 4. Update leader's aggregate rating
        const leader = db.prepare('SELECT rating, reviewCount FROM leaders WHERE id = ?').get(leaderId) as { rating: number; reviewCount: number };
        if (!leader) {
            throw new Error("Leader not found during transaction.");
        }

        let newReviewCount = leader.reviewCount;
        let newAverageRating = leader.rating;

        if (existingRating) {
            // User is updating their rating
            const oldRatingValue = existingRating.rating;
            if (leader.reviewCount > 0) {
                newAverageRating = ((leader.rating * leader.reviewCount) - oldRatingValue + newRating) / leader.reviewCount;
            } else {
                newAverageRating = newRating; // Should not happen if reviewCount is consistent
            }
        } else {
            // New rating from this user
            newReviewCount = leader.reviewCount + 1;
            newAverageRating = ((leader.rating * leader.reviewCount) + newRating) / newReviewCount;
        }

        const updateLeaderStmt = db.prepare('UPDATE leaders SET rating = ?, reviewCount = ? WHERE id = ?');
        updateLeaderStmt.run(newAverageRating.toFixed(2), newReviewCount, leaderId);
    });

    try {
        transaction();
        return getLeaderById(leaderId);
    } catch (error) {
        console.error("Failed to submit rating and comment:", error);
        throw error;
    }
}


export async function getReviewsForLeader(leaderId: string): Promise<Review[]> {
    const stmt = db.prepare(`
        SELECT
            r.rating,
            r.updatedAt,
            c.comment,
            u.name as userName
        FROM ratings r
        JOIN users u ON r.userId = u.id
        LEFT JOIN comments c ON r.userId = c.userId AND r.leaderId = c.leaderId
        WHERE r.leaderId = ?
        ORDER BY r.updatedAt DESC
    `);
    
    const reviews = stmt.all(leaderId) as Review[];
    return Promise.resolve(reviews);
}
