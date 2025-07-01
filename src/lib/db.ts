
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

const defaultLeaders: Leader[] = [];

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
    twitterUrl TEXT
  );
  
  CREATE TABLE IF NOT EXISTS ratings (
    userId TEXT NOT NULL,
    leaderId TEXT NOT NULL,
    rating INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    socialBehaviour TEXT,
    PRIMARY KEY (userId, leaderId)
  );

  CREATE TABLE IF NOT EXISTS comments (
    userId TEXT NOT NULL,
    leaderId TEXT NOT NULL,
    comment TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    PRIMARY KEY (userId, leaderId)
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
        createdAt: 'TEXT'
    },
    ratings: {
        socialBehaviour: 'TEXT',
        createdAt: 'TEXT'
    },
    comments: {
        createdAt: 'TEXT'
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
const countStmt = db.prepare('SELECT count(*) as count FROM leaders');
const count = (countStmt.get() as { count: number }).count;

if (count === 0) {
    const insertStmt = db.prepare(`
        INSERT INTO leaders (id, name, partyName, gender, age, photoUrl, constituency, nativeAddress, electionType, location_state, location_district, rating, reviewCount, previousElections, manifestoUrl, twitterUrl)
        VALUES (@id, @name, @partyName, @gender, @age, @photoUrl, @constituency, @nativeAddress, @electionType, @location_state, @location_district, @rating, @reviewCount, @previousElections, @manifestoUrl, @twitterUrl)
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
            });
        }
    });

    insertMany(defaultLeaders);
    console.log(`Database seeded with ${defaultLeaders.length} leaders.`);
}
