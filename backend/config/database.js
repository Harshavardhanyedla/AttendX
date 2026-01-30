const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const dbPath = path.join(__dirname, '..', 'classtrack.db');
let db = null;

async function initializeDatabase() {
    if (db) return db;
    const SQL = await initSqlJs();
    if (fs.existsSync(dbPath)) {
        db = new SQL.Database(fs.readFileSync(dbPath));
    } else {
        db = new SQL.Database();
        initializeSchema();
    }

    // Auto-seed if users table is empty
    try {
        const userCount = db.prepare('SELECT count(*) as count FROM users').get().count;
        if (userCount === 0) {
            console.log('Database empty, triggering auto-seed...');
            const { seed } = require('../seed/seedData');
            await seed();
        }
    } catch (err) {
        console.warn('Auto-seed check failed or table missing, re-initializing schema...');
        initializeSchema();
        const { seed } = require('../seed/seedData');
        await seed();
    }

    return db;
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
    prepare: (sql) => ({
        run: (...args) => { db.run(sql, args); saveDatabase(); },
        get: (...args) => {
            const stmt = db.prepare(sql); stmt.bind(args);
            const res = stmt.step() ? stmt.getAsObject() : undefined;
            stmt.free(); return res;
        },
        all: (...args) => {
            const stmt = db.prepare(sql); stmt.bind(args);
            const res = []; while (stmt.step()) res.push(stmt.getAsObject());
            stmt.free(); return res;
        }
    }),
    exec: (sql) => { db.run(sql); saveDatabase(); }
};

module.exports = { initializeDatabase, saveDatabase, getDb: () => dbHelpers };
