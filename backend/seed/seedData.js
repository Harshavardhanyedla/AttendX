const bcrypt = require('bcryptjs');
const { initializeDatabase, getDb } = require('../config/database');

async function seed() {
    await initializeDatabase();
    const db = getDb();

    console.log('Seeding Database...');

    // 1. Clear Data
    db.exec('DELETE FROM audit_logs; DELETE FROM attendance; DELETE FROM timetable; DELETE FROM subjects; DELETE FROM students; DELETE FROM users;');

    // 2. Users
    const users = [
        { username: 'admin', password: bcrypt.hashSync('admin123', 10), role: 'admin', name: 'Administrator' },
        { username: 'cr', password: bcrypt.hashSync('cr123', 10), role: 'cr', name: 'Class Rep' }
    ];
    users.forEach(u => db.prepare('INSERT INTO users (username, password, role, name) VALUES (?,?,?,?)').run(u.username, u.password, u.role, u.name));
    console.log('Users seeded.');

    // 3. Subjects (From Timetable)
    const subjects = [
        { code: 'SANS', name: 'Sanskrit' },
        { code: 'AI-T', name: 'Artificial Intelligence (Theory)' },
        { code: 'DBMS-T', name: 'DBMS (Theory)' },
        { code: 'DSC-T', name: 'Data Structures using C (Theory)' },
        { code: 'AI-L', name: 'AI Lab' },
        { code: 'LAB', name: 'Lab' },
        { code: 'ENG', name: 'English' },
        { code: 'AOC', name: 'AOC (Analytical Skills)' },
        { code: 'ISW', name: 'ISW' },
        { code: 'MAJOR-L', name: 'Major Lab' },
        { code: 'IKS', name: 'IKS' }
    ];

    subjects.forEach(s => {
        db.prepare('INSERT INTO subjects (code, name, type) VALUES (?,?,?)').run(s.code, s.name, 'theory');
        console.log(`- Seeded subject: ${s.name} (${s.code})`);
    });

    // Helper to get Subject ID
    const getSubId = (code) => {
        const res = db.prepare('SELECT id FROM subjects WHERE code = ?').get(code);
        return res ? res.id : null;
    };

    // 4. Timetable (Verified with User)
    const timetable = {
        'Monday': ['SANS', 'AI-T', 'DBMS-T', 'DSC-T', 'AI-L', 'AI-L', 'LAB'],
        'Tuesday': ['ENG', 'AOC', 'SANS', 'ISW', 'AI-T', 'DBMS-T', 'DSC-T'],
        'Wednesday': ['DSC-T', 'MAJOR-L', 'MAJOR-L', 'MAJOR-L', 'SANS', 'IKS', 'ENG'],
        'Thursday': ['AI-T', 'ENG', 'DSC-T', 'DBMS-T', 'AOC', 'ISW', 'IKS'],
        'Friday': ['DBMS-T', 'DSC-T', 'ENG', 'IKS', 'MAJOR-L', 'MAJOR-L', 'MAJOR-L'],
        'Saturday': ['ISW', 'DBMS-T', 'SANS', 'AI-T', 'ENG', 'DSC-T', 'DBMS-T']
    };

    Object.entries(timetable).forEach(([day, codes]) => {
        console.log(`Seeding timetable for ${day}...`);
        codes.forEach((code, index) => {
            const period = index + 1;
            const subId = getSubId(code);
            if (subId) {
                db.prepare('INSERT INTO timetable (day, period, subject_id) VALUES (?,?,?)').run(day, period, subId);
            } else {
                console.error(`!!! Subject not found for code: ${code}`);
            }
        });
    });
    console.log('Timetable seeding complete.');

    // 5. Students (Sample 30)
    const students = [
        { n: 'Aarav Sharma', g: 'Male' }, { n: 'Aditi Rao', g: 'Female' }, { n: 'Arjun Kumar', g: 'Male' },
        { n: 'Ananya Gupta', g: 'Female' }, { n: 'Balaji S', g: 'Male' }, { n: 'Bhavya Patel', g: 'Female' },
        { n: 'Chirag Menon', g: 'Male' }, { n: 'Deepika Singh', g: 'Female' }, { n: 'Dhruv Reddy', g: 'Male' },
        { n: 'Divya Nair', g: 'Female' }, { n: 'Eshaan Verma', g: 'Male' }, { n: 'Esha Jain', g: 'Female' },
        { n: 'Farhan Khan', g: 'Male' }, { n: 'Gauri Joshi', g: 'Female' }, { n: 'Gokul Krishnan', g: 'Male' },
        { n: 'Harsh Vardhan', g: 'Male' }, { n: 'Ishita Roy', g: 'Female' }, { n: 'Ishaan Malhotra', g: 'Male' },
        { n: 'Jaya Lakshmi', g: 'Female' }, { n: 'Karthik Iyer', g: 'Male' }, { n: 'Kavya Mishra', g: 'Female' },
        { n: 'Lakshya Sen', g: 'Male' }, { n: 'Meera Kapoor', g: 'Female' }, { n: 'Madhavan R', g: 'Male' },
        { n: 'Nikhil Das', g: 'Male' }, { n: 'Neha Aggarwal', g: 'Female' }, { n: 'Omkar P', g: 'Male' },
        { n: 'Pooja Hegde', g: 'Female' }, { n: 'Pranav K', g: 'Male' }, { n: 'Priya Anand', g: 'Female' }
    ];

    students.forEach((s, i) => {
        const roll = `BCA${(i + 1).toString().padStart(3, '0')}`;
        db.prepare('INSERT INTO students (roll_no, name, gender) VALUES (?,?,?)').run(roll, s.n, s.g);
    });
    console.log('Students seeded.');
}

module.exports = { seed };

if (require.main === module) {
    seed().catch(console.error);
}
