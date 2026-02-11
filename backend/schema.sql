-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'cr',
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
    roll_no TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gender TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'theory',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Timetable Table
CREATE TABLE IF NOT EXISTS timetable (
    id SERIAL PRIMARY KEY,
    day TEXT NOT NULL,
    period INTEGER NOT NULL,
    subject_code TEXT REFERENCES subjects(code),
    subject_name TEXT,
    UNIQUE(day, period)
);

-- 5. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    period INTEGER NOT NULL,
    student_id TEXT REFERENCES students(roll_no),
    status TEXT NOT NULL, -- 'present' or 'absent'
    subject_code TEXT REFERENCES subjects(code),
    marked_by TEXT, -- username of the CR who marked it
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, period, student_id)
);

-- 6. Audit Logs Table (Optional but good to have)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action TEXT NOT NULL,
    username TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
