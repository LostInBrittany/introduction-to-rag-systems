/**
 * Database utility
 * Manages SQLite database with vector extension
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import * as sqliteVec from 'sqlite-vec';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file path
const DB_PATH = join(__dirname, '../data/vectordb.sqlite');

// Ensure data directory exists
const dataDir = join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Initialize the database connection and schema
 * @returns {Object} Database connection
 */
export function initDatabase() {
  // Create database connection
  const db = new Database(DB_PATH);
  
  // Set journal mode for better performance
  db.pragma('journal_mode = WAL');
  
  // Load the sqlite-vec extension
  sqliteVec.load(db);
  
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT,
      title TEXT,
      filetype TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER,
      text TEXT NOT NULL,
      chunk_index INTEGER,
      chunk_strategy TEXT,
      embedding BLOB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
  `);
  
  return db;
}

// Singleton database connection
let dbInstance = null;

/**
 * Get database connection (singleton pattern)
 * @returns {Object} Database connection
 */
export function getDatabase() {
  if (!dbInstance) {
    dbInstance = initDatabase();
  }
  return dbInstance;
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
