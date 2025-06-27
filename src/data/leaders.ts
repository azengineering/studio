
'use server';

import { db } from '@/lib/db';

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
    reviewCount: 120,
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
    reviewCount: 95,
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
    reviewCount: 75,
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
    reviewCount: 210,
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
    reviewCount: 60,
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
    reviewCount: 150,
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
    reviewCount: 500,
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
    reviewCount: 88,
    previousElections: [],
    twitterUrl: 'https://x.com/example',
  }
];

function seedDatabase() {
  try {
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM leaders');
    const result = countStmt.get() as { count: number };

    if (result.count === 0) {
      const insertStmt = db.prepare(`
        INSERT INTO leaders (
          id, name, partyName, gender, age, photoUrl, constituency, nativeAddress,
          electionType, state, district, rating, reviewCount, previousElections,
          manifestoUrl, twitterUrl
        ) VALUES (
          @id, @name, @partyName, @gender, @age, @photoUrl, @constituency, @nativeAddress,
          @electionType, @state, @district, @rating, @reviewCount, @previousElections,
          @manifestoUrl, @twitterUrl
        )
      `);

      const insertMany = db.transaction((leaders: Leader[]) => {
        for (const leader of leaders) {
            const leaderForDb = {
                ...leader,
                state: leader.location.state,
                district: leader.location.district,
                previousElections: JSON.stringify(leader.previousElections || []),
            };
            insertStmt.run(leaderForDb);
        }
      });

      insertMany(defaultLeaders);
    }
  } catch (error) {
    console.error("Database error during seeding:", error);
  }
}

seedDatabase();

export async function getLeaders(): Promise<Leader[]> {
  try {
    const stmt = db.prepare('SELECT * FROM leaders');
    const rows = stmt.all() as any[];

    return rows.map(row => ({
      ...row,
      location: {
        state: row.state,
        district: row.district,
      },
      previousElections: JSON.parse(row.previousElections || '[]'),
    }));
  } catch (error) {
    console.error("Database error in getLeaders:", error);
    return [];
  }
}

export async function addLeader(leader: Omit<Leader, 'id' | 'rating' | 'reviewCount'>): Promise<void> {
  const newLeader: Leader = {
    ...leader,
    id: new Date().getTime().toString(),
    rating: 0,
    reviewCount: 0,
  };

  try {
    const stmt = db.prepare(`
      INSERT INTO leaders (
        id, name, partyName, gender, age, photoUrl, constituency, nativeAddress,
        electionType, state, district, rating, reviewCount, previousElections,
        manifestoUrl, twitterUrl
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);
    
    stmt.run(
      newLeader.id,
      newLeader.name,
      newLeader.partyName,
      newLeader.gender,
      newLeader.age,
      newLeader.photoUrl || '',
      newLeader.constituency,
      newLeader.nativeAddress,
      newLeader.electionType,
      newLeader.location.state || null,
      newLeader.location.district || null,
      newLeader.rating,
      newLeader.reviewCount,
      JSON.stringify(newLeader.previousElections || []),
      newLeader.manifestoUrl || null,
      newLeader.twitterUrl || null
    );
  } catch (error) {
    console.error("Database error in addLeader:", error);
  }
}

export async function getLeaderById(id: string): Promise<Leader | null> {
    try {
        const stmt = db.prepare('SELECT * FROM leaders WHERE id = ?');
        const row = stmt.get(id) as any;

        if (!row) return null;

        return {
            ...row,
            location: {
                state: row.state,
                district: row.district,
            },
            previousElections: JSON.parse(row.previousElections || '[]'),
        };
    } catch (error) {
        console.error("Database error in getLeaderById:", error);
        return null;
    }
}

export async function submitRatingAndComment(leaderId: string, userId: string, newRating: number, comment: string | null): Promise<Leader | null> {
    try {
        const leader = await getLeaderById(leaderId);
        if (!leader) {
            throw new Error("Leader not found");
        }

        const dbTransaction = db.transaction(() => {
            // Handle Rating
            const existingRatingStmt = db.prepare('SELECT rating FROM ratings WHERE userId = ? AND leaderId = ?');
            const existingRatingResult = existingRatingStmt.get(userId, leaderId) as { rating: number } | undefined;
            
            let newAverageRating: number;
            let newReviewCount: number;

            if (existingRatingResult) {
                const oldRating = existingRatingResult.rating;
                
                const updateRatingStmt = db.prepare('UPDATE ratings SET rating = ? WHERE userId = ? AND leaderId = ?');
                updateRatingStmt.run(newRating, userId, leaderId);

                newReviewCount = leader.reviewCount;
                if (newReviewCount > 0) {
                     newAverageRating = ((leader.rating * newReviewCount) - oldRating + newRating) / newReviewCount;
                } else {
                    newAverageRating = newRating;
                }
            } else {
                const insertRatingStmt = db.prepare('INSERT INTO ratings (userId, leaderId, rating) VALUES (?, ?, ?)');
                insertRatingStmt.run(userId, leaderId, newRating);

                newReviewCount = leader.reviewCount + 1;
                newAverageRating = ((leader.rating * leader.reviewCount) + newRating) / newReviewCount;
            }

            const updateLeaderStmt = db.prepare('UPDATE leaders SET rating = ?, reviewCount = ? WHERE id = ?');
            updateLeaderStmt.run(newAverageRating, newReviewCount, leaderId);

            // Handle Comment
            if (comment && comment.trim().length > 0) {
                 const upsertCommentStmt = db.prepare(`
                    INSERT INTO comments (userId, leaderId, comment) 
                    VALUES (?, ?, ?)
                    ON CONFLICT(userId, leaderId) DO UPDATE SET 
                        comment = excluded.comment,
                        updatedAt = CURRENT_TIMESTAMP;
                `);
                upsertCommentStmt.run(userId, leaderId, comment);
            }
        });

        dbTransaction();

        return await getLeaderById(leaderId);
    } catch (error) {
        console.error("Database error in submitRatingAndComment:", error);
        return null;
    }
}
