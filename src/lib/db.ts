
import Database from 'better-sqlite3';
import type { Leader } from '@/data/leaders';

// For this prototype, we'll use a simple file-based SQLite database.
// In a production app, you'd use a more robust database solution.
export const db = new Database('/tmp/politirate.db');

// Enable WAL mode for better concurrency.
db.pragma('journal_mode = WAL');


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
    addedByUserId: null,
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
    addedByUserId: null,
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
    addedByUserId: null,
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
    addedByUserId: null,
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
    addedByUserId: null,
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
    addedByUserId: null,
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
    addedByUserId: null,
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
    addedByUserId: null,
  }
];

// --- Schema Definition and Seeding ---
const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    gender TEXT,
    age INTEGER,
    state TEXT,
    mpConstituency TEXT,
    mlaConstituency TEXT,
    panchayat TEXT
  );

  CREATE TABLE IF NOT EXISTS leaders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    partyName TEXT NOT NULL,
    gender TEXT NOT NULL,
    age INTEGER NOT NULL,
    photoUrl TEXT,
    constituency TEXT NOT NULL,
    nativeAddress TEXT NOT NULL,
    electionType TEXT NOT NULL,
    location_state TEXT,
    location_district TEXT,
    rating REAL DEFAULT 0,
    reviewCount INTEGER DEFAULT 0,
    previousElections TEXT,
    manifestoUrl TEXT,
    twitterUrl TEXT,
    addedByUserId TEXT,
    FOREIGN KEY(addedByUserId) REFERENCES users(id)
  );
  
  CREATE TABLE IF NOT EXISTS ratings (
    userId TEXT NOT NULL,
    leaderId TEXT NOT NULL,
    rating INTEGER NOT NULL,
    updatedAt TEXT NOT NULL,
    socialBehaviour TEXT,
    PRIMARY KEY (userId, leaderId),
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (leaderId) REFERENCES leaders(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    userId TEXT NOT NULL,
    leaderId TEXT NOT NULL,
    comment TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    PRIMARY KEY (userId, leaderId),
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (leaderId) REFERENCES leaders(id)
  );
`;

db.exec(schema);

// --- Simple migration script to add missing column ---
try {
    const leaderTableInfo = db.prepare("PRAGMA table_info(leaders)").all();
    if (!leaderTableInfo.some((col: any) => col.name === 'addedByUserId')) {
        db.prepare('ALTER TABLE leaders ADD COLUMN addedByUserId TEXT').run();
        console.log("Database migration: Added 'addedByUserId' to 'leaders' table.");
    }
    const ratingTableInfo = db.prepare("PRAGMA table_info(ratings)").all();
    if (!ratingTableInfo.some((col: any) => col.name === 'socialBehaviour')) {
        db.prepare('ALTER TABLE ratings ADD COLUMN socialBehaviour TEXT').run();
        console.log("Database migration: Added 'socialBehaviour' to 'ratings' table.");
    }
} catch (error) {
    // This might fail if the table doesn't exist yet, which is fine on first run.
}


// --- Seeding Logic ---
const seedLeaders = () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM leaders').get() as { count: number };
  if (count.count > 0) {
    return;
  }

  const insertStmt = db.prepare(`
    INSERT INTO leaders (id, name, partyName, gender, age, photoUrl, constituency, nativeAddress, electionType, location_state, location_district, rating, reviewCount, previousElections, manifestoUrl, twitterUrl, addedByUserId)
    VALUES (@id, @name, @partyName, @gender, @age, @photoUrl, @constituency, @nativeAddress, @electionType, @location_state, @location_district, @rating, @reviewCount, @previousElections, @manifestoUrl, @twitterUrl, @addedByUserId)
  `);

  const insertMany = db.transaction((leaders: Leader[]) => {
    for (const leader of leaders) {
      insertStmt.run({
        id: leader.id,
        name: leader.name,
        partyName: leader.partyName,
        gender: leader.gender,
        age: leader.age,
        photoUrl: leader.photoUrl,
        constituency: leader.constituency,
        nativeAddress: leader.nativeAddress,
        electionType: leader.electionType,
        location_state: leader.location.state,
        location_district: leader.location.district,
        rating: leader.rating,
        reviewCount: leader.reviewCount,
        previousElections: JSON.stringify(leader.previousElections),
        manifestoUrl: leader.manifestoUrl,
        twitterUrl: leader.twitterUrl,
        addedByUserId: leader.addedByUserId,
      });
    }
  });

  insertMany(defaultLeaders);
  console.log('Database seeded with default leaders.');
};

seedLeaders();
