// Uses Node's built-in SQLite module (available in Node 22.5+, including
// Node 24) instead of better-sqlite3. This avoids native compilation
// entirely, which is what causes install failures on newer/less common
// Node versions on Windows (missing Visual Studio C++ build tools, no
// prebuilt binary available yet, etc). The API is intentionally very
// similar to better-sqlite3 (.prepare().get()/.all()/.run()), so the rest
// of the codebase needs almost no changes.
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'hms.sqlite');
const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize schema on startup
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

module.exports = db;
