
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { Leader } from '@/data/leaders';

// For this prototype, we'll use a simple file-based SQLite database.
// In a production app, you'd use a more robust database solution.

// Store the database in a `data` directory at the project root to ensure it's persistent.
const dbDir = path.join(process.cwd(), 'data');

// Ensure the directory exists before initializing the database.
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(path.join(dbDir, 'politirate.db'));


// Enable WAL mode for better concurrency.
db.pragma('journal_mode = WAL');

const now = new Date().toISOString();

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
    createdAt: now,
    status: 'approved',
    adminComment: null,
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
    createdAt: now,
    status: 'approved',
    adminComment: null,
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
    createdAt: now,
    status: 'approved',
    adminComment: null,
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
    createdAt: now,
    status: 'approved',
    adminComment: null,
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
    createdAt: now,
    status: 'approved',
    adminComment: null,
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
    createdAt: now,
    status: 'approved',
    adminComment: null,
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
    createdAt: now,
    status: 'approved',
    adminComment: null,
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
    createdAt: now,
    status: 'approved',
    adminComment: null,
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
    panchayat TEXT,
    createdAt TEXT,
    isBlocked INTEGER DEFAULT 0,
    blockedUntil TEXT,
    blockReason TEXT
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
    createdAt TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    adminComment TEXT,
    FOREIGN KEY(addedByUserId) REFERENCES users(id) ON DELETE SET NULL
  );
  
  CREATE TABLE IF NOT EXISTS ratings (
    userId TEXT NOT NULL,
    leaderId TEXT NOT NULL,
    rating INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    socialBehaviour TEXT,
    PRIMARY KEY (userId, leaderId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (leaderId) REFERENCES leaders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    userId TEXT NOT NULL,
    leaderId TEXT NOT NULL,
    comment TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    PRIMARY KEY (userId, leaderId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (leaderId) REFERENCES leaders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS admin_messages (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    message TEXT NOT NULL,
    isRead INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    message TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    link TEXT
  );

  CREATE TABLE IF NOT EXISTS polls (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 0,
    active_until TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS poll_questions (
    id TEXT PRIMARY KEY,
    poll_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL,
    question_order INTEGER NOT NULL,
    FOREIGN KEY(poll_id) REFERENCES polls(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS poll_options (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    option_text TEXT NOT NULL,
    option_order INTEGER NOT NULL,
    FOREIGN KEY(question_id) REFERENCES poll_questions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS poll_responses (
    id TEXT PRIMARY KEY,
    poll_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(poll_id, user_id),
    FOREIGN KEY(poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS poll_answers (
    id TEXT PRIMARY KEY,
    response_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    selected_option_id TEXT NOT NULL,
    FOREIGN KEY(response_id) REFERENCES poll_responses(id) ON DELETE CASCADE,
    FOREIGN KEY(question_id) REFERENCES poll_questions(id) ON DELETE CASCADE
  );
`;

db.exec(schema);

// --- Simple migration script to add missing columns ---
const migrations = {
    users: {
        createdAt: 'TEXT',
        isBlocked: 'INTEGER DEFAULT 0',
        blockedUntil: 'TEXT',
        blockReason: 'TEXT'
    },
    leaders: {
        addedByUserId: 'TEXT',
        createdAt: 'TEXT',
        status: "TEXT NOT NULL DEFAULT 'pending'",
        adminComment: 'TEXT'
    },
    ratings: {
        socialBehaviour: 'TEXT',
        createdAt: 'TEXT'
    },
    comments: {
        createdAt: 'TEXT'
    },
    admin_messages: {
        isRead: 'INTEGER DEFAULT 0'
    },
    notifications: {
        link: 'TEXT'
    }
};

for (const [tableName, columns] of Object.entries(migrations)) {
    try {
        const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all() as { name: string }[];
        const existingColumns = tableInfo.map(col => col.name);

        for (const [columnName, columnType] of Object.entries(columns)) {
            if (!existingColumns.includes(columnName)) {
                db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`).run();
                console.log(`Database migration: Added '${columnName}' to '${tableName}' table.`);
            }
        }
    } catch (error) {
        // This might fail if the table doesn't exist yet, which is fine on the first run during schema creation.
        if (!(error instanceof Error && error.message.includes('no such table'))) {
            console.error(`Migration failed for table ${tableName}:`, error);
        }
    }
}


// --- Seeding Logic ---
const seedDatabase = () => {
  const transaction = db.transaction(() => {
    // Seed Leaders
    const leaderCount = db.prepare('SELECT COUNT(*) as count FROM leaders').get() as { count: number };
    if (leaderCount.count === 0) {
      const insertLeader = db.prepare(`
        INSERT INTO leaders (id, name, partyName, gender, age, photoUrl, constituency, nativeAddress, electionType, location_state, location_district, rating, reviewCount, previousElections, manifestoUrl, twitterUrl, addedByUserId, createdAt, status, adminComment)
        VALUES (@id, @name, @partyName, @gender, @age, @photoUrl, @constituency, @nativeAddress, @electionType, @location_state, @location_district, @rating, @reviewCount, @previousElections, @manifestoUrl, @twitterUrl, @addedByUserId, @createdAt, @status, @adminComment)
      `);
      for (const leader of defaultLeaders) {
        insertLeader.run({
          id: leader.id, name: leader.name, partyName: leader.partyName, gender: leader.gender, age: leader.age, photoUrl: leader.photoUrl, constituency: leader.constituency, nativeAddress: leader.nativeAddress, electionType: leader.electionType, location_state: leader.location.state, location_district: leader.location.district, rating: leader.rating, reviewCount: leader.reviewCount, previousElections: JSON.stringify(leader.previousElections), manifestoUrl: leader.manifestoUrl, twitterUrl: leader.twitterUrl, addedByUserId: leader.addedByUserId, createdAt: leader.createdAt, status: leader.status, adminComment: leader.adminComment
        });
      }
      console.log('Database seeded with default leaders.');
    }

    // Seed Site Settings
    const settingsCount = db.prepare('SELECT COUNT(*) as count FROM site_settings').get() as { count: number };
    if (settingsCount.count === 0) {
        const insertSetting = db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)');
        insertSetting.run('maintenance_active', 'false');
        insertSetting.run('maintenance_start', '');
        insertSetting.run('maintenance_end', '');
        insertSetting.run('maintenance_message', 'The site is currently down for maintenance. We will be back online shortly.');
        console.log('Database seeded with default site settings.');
    }
  });

  transaction();
};

seedDatabase();
