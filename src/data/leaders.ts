
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
  addedByUserId?: string | null;
}

export interface Review {
  userName: string;
  rating: number;
  comment: string | null;
  updatedAt: string;
}

export interface UserActivity {
  leaderId: string;
  leaderName: string;
  leaderPhotoUrl: string;
  rating: number;
  comment: string | null;
  updatedAt: string;
  leader: Leader;
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
        addedByUserId: dbLeader.addedByUserId,
    };
}

// --- Public API ---

export async function getLeaders(): Promise<Leader[]> {
  const stmt = db.prepare('SELECT * FROM leaders');
  const dbLeaders = stmt.all() as any[];
  return Promise.resolve(dbLeaders.map(dbToLeader));
}

export async function addLeader(leaderData: Omit<Leader, 'id' | 'rating' | 'reviewCount' | 'addedByUserId'>, userId: string): Promise<void> {
    const newLeader: Leader = {
        ...leaderData,
        id: new Date().getTime().toString(),
        rating: 0,
        reviewCount: 0,
        addedByUserId: userId,
    };
    
    const stmt = db.prepare(`
        INSERT INTO leaders (id, name, partyName, gender, age, photoUrl, constituency, nativeAddress, electionType, location_state, location_district, rating, reviewCount, previousElections, manifestoUrl, twitterUrl, addedByUserId)
        VALUES (@id, @name, @partyName, @gender, @age, @photoUrl, @constituency, @nativeAddress, @electionType, @location_state, @location_district, @rating, @reviewCount, @previousElections, @manifestoUrl, @twitterUrl, @addedByUserId)
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
        twitterUrl: newLeader.twitterUrl,
        addedByUserId: newLeader.addedByUserId,
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

export async function updateLeader(leaderId: string, leaderData: Omit<Leader, 'id' | 'rating' | 'reviewCount' | 'addedByUserId'>, userId: string): Promise<Leader | null> {
    const leaderToUpdate = await getLeaderById(leaderId);

    if (!leaderToUpdate) {
        throw new Error("Leader not found.");
    }
    // Only the user who added the leader can edit them.
    if (leaderToUpdate.addedByUserId !== userId) {
        throw new Error("You are not authorized to edit this leader.");
    }

    const stmt = db.prepare(`
        UPDATE leaders
        SET name = @name,
            partyName = @partyName,
            gender = @gender,
            age = @age,
            photoUrl = @photoUrl,
            constituency = @constituency,
            nativeAddress = @nativeAddress,
            electionType = @electionType,
            location_state = @location_state,
            location_district = @location_district,
            previousElections = @previousElections,
            manifestoUrl = @manifestoUrl,
            twitterUrl = @twitterUrl
        WHERE id = @id
    `);

    stmt.run({
        id: leaderId,
        name: leaderData.name,
        partyName: leaderData.partyName,
        gender: leaderData.gender,
        age: leaderData.age,
        photoUrl: leaderData.photoUrl,
        constituency: leaderData.constituency,
        nativeAddress: leaderData.nativeAddress,
        electionType: leaderData.electionType,
        location_state: leaderData.location.state,
        location_district: leaderData.location.district,
        previousElections: JSON.stringify(leaderData.previousElections),
        manifestoUrl: leaderData.manifestoUrl,
        twitterUrl: leaderData.twitterUrl,
    });

    return getLeaderById(leaderId);
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

export async function getActivitiesForUser(userId: string): Promise<UserActivity[]> {
    const stmt = db.prepare(`
        SELECT
            r.leaderId,
            l.id as leader_id, l.name as leader_name, l.partyName as leader_partyName, l.gender as leader_gender, l.age as leader_age, l.photoUrl as leader_photoUrl, l.constituency as leader_constituency, l.nativeAddress as leader_nativeAddress, l.electionType as leader_electionType, l.location_state as leader_location_state, l.location_district as leader_location_district, l.rating as leader_rating, l.reviewCount as leader_reviewCount, l.previousElections as leader_previousElections, l.manifestoUrl as leader_manifestoUrl, l.twitterUrl as leader_twitterUrl, l.addedByUserId as leader_addedByUserId,
            r.rating,
            r.updatedAt,
            c.comment
        FROM ratings r
        JOIN leaders l ON r.leaderId = l.id
        LEFT JOIN comments c ON r.userId = c.userId AND r.leaderId = c.leaderId
        WHERE r.userId = ?
        ORDER BY r.updatedAt DESC
    `);
    
    const activities = stmt.all(userId) as any[];

    return Promise.resolve(activities.map(activity => {
        const leaderData = {
            id: activity.leader_id,
            name: activity.leader_name,
            partyName: activity.leader_partyName,
            gender: activity.leader_gender,
            age: activity.leader_age,
            photoUrl: activity.leader_photoUrl,
            constituency: activity.leader_constituency,
            nativeAddress: activity.leader_nativeAddress,
            electionType: activity.leader_electionType,
            location: {
                state: activity.leader_location_state,
                district: activity.leader_location_district,
            },
            rating: activity.leader_rating,
            reviewCount: activity.leader_reviewCount,
            previousElections: JSON.parse(activity.leader_previousElections || '[]'),
            manifestoUrl: activity.leader_manifestoUrl,
            twitterUrl: activity.leader_twitterUrl,
            addedByUserId: activity.leader_addedByUserId,
        };

        return {
            leaderId: activity.leaderId,
            leaderName: activity.leader_name,
            leaderPhotoUrl: activity.leader_photoUrl,
            rating: activity.rating,
            comment: activity.comment,
            updatedAt: activity.updatedAt,
            leader: leaderData,
        };
    }));
}

export async function getLeadersAddedByUser(userId: string): Promise<Leader[]> {
  const stmt = db.prepare('SELECT * FROM leaders WHERE addedByUserId = ? ORDER BY name ASC');
  const dbLeaders = stmt.all(userId) as any[];
  return Promise.resolve(dbLeaders.map(dbToLeader));
}
