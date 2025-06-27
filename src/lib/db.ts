import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const dbPath = path.join(process.cwd(), ".next", "database");
fs.mkdirSync(dbPath, { recursive: true });
const dbFile = path.join(dbPath, "politirate.db");

export const db = new Database(dbFile);

function initializeDb() {
    db.exec(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
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
            state TEXT,
            district TEXT,
            rating REAL NOT NULL,
            reviewCount INTEGER NOT NULL,
            previousElections TEXT,
            manifestoUrl TEXT,
            twitterUrl TEXT
        );
    `);
}

// Initialize the database on module load
initializeDb();
