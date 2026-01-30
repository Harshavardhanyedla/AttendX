const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const dbPath = path.join(__dirname, '..', 'classtrack.db');
let db = null;

async function initializeDatabase() {
    if (db) return db;
    try {
        console.log('Initializing Database with SQL.js...');
        const SQL = await initSqlJs({
            // Use CDN for WASM to ensure it works on Vercel
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        if (fs.existsSync(dbPath)) {
            try {
                const fileBuffer = fs.readFileSync(dbPath);
                db = new SQL.Database(fileBuffer);
                console.log('Database loaded from file:', dbPath);
            } catch (readErr) {
                console.warn('Failed to read database file, creating new:', readErr.message);
                db = new SQL.Database();
                initializeSchema();
            }
        } else {
            console.log('No database file found, creating new in-memory instance.');
            db = new SQL.Database();
            initializeSchema();
        }

        // Final check and auto-seed
        const tableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='timetable'");
        const usersTableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");

        if (tableCheck.length === 0 || usersTableCheck.length === 0) {
            console.log('Essential tables missing, initializing schema...');
            initializeSchema();
        }

        const userCountRes = db.exec("SELECT count(*) FROM users");
        const timetableCountRes = db.exec("SELECT count(*) FROM timetable");

        const userCount = userCountRes[0].values[0][0];
        const timetableCount = timetableCountRes[0].values[0][0];

        console.log(`Diagnostic: Found ${userCount} users and ${timetableCount} timetable entries.`);

        if (userCount === 0 || timetableCount === 0) {
            console.log('Data missing, seeding initial database state...');
            const { seed } = require('../seed/seedData');
            await seed();
        }

        return db;
    } catch (err) {
        console.error('CRITICAL: Database initialization failed:', err.message);
        throw new Error(`Database Initialization Failed: ${err.message}`);
    }
}

function saveDatabase() {
    if (db) {
        try {
            fs.writeFileSync(dbPath, Buffer.from(db.export()));
        } catch (err) {
            console.warn('Database save failed (likely read-only environment):', err.message);
        }
    }
}

function initializeSchema() {
    db.run('PRAGMA foreign_keys = ON');
    db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, role TEXT, name TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY, roll_no TEXT UNIQUE, name TEXT, gender TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY, code TEXT UNIQUE, name TEXT, type TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS timetable (id INTEGER PRIMARY KEY, day TEXT, period INTEGER, subject_id INTEGER, FOREIGN KEY(subject_id) REFERENCES subjects(id))');
    db.run('CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY, student_id INTEGER, date DATE, period INTEGER, subject_id INTEGER, status TEXT, marked_by INTEGER, FOREIGN KEY(student_id) REFERENCES students(id))');
    db.run('CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY, user_id INTEGER, action TEXT, attendance_id INTEGER, old_value TEXT, new_value TEXT, reason TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
    saveDatabase();
}

const dbHelpers = {
    prepare: (sqlQuery) => ({
        run: (...args) => {
            db.run(sqlQuery, args);
            saveDatabase();
        },
        get: (...args) => {
            const stmt = db.prepare(sqlQuery);
            if (args.length > 0) stmt.bind(args);
            const res = stmt.step() ? stmt.getAsObject() : undefined;
            stmt.free();
            return res;
        },
        all: (...args) => {
            const stmt = db.prepare(sqlQuery);
            if (args.length > 0) stmt.bind(args);
            const res = [];
            while (stmt.step()) res.push(stmt.getAsObject());
            stmt.free();
            return res;
        }
    }),
    exec: (sqlQuery) => {
        const res = db.exec(sqlQuery);
        saveDatabase();
        return res;
    }
};

module.exports = { initializeDatabase, saveDatabase, getDb: () => dbHelpers };
