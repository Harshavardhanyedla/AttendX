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
        { username: 'bvricebca12', password: bcrypt.hashSync('bvricebca12', 10), role: 'admin', name: 'Admin' }
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

    // 5. Students (Full Class List from Image)
    const students = [
        { r: '253110101001', n: 'ADADA NAVYA SRI RUPINI', g: 'FEMALE' },
        { r: '253110101002', n: 'AMUDALAPALLI PAVAN MANIKANTA PURNA', g: 'MALE' },
        { r: '253110101003', n: 'BANDARU KAVYA SRI', g: 'FEMALE' },
        { r: '253110101004', n: 'BANDI KIRANMAHI', g: 'FEMALE' },
        { r: '253110101005', n: 'BENGULURU RAKHADI SRI VISHNU TEJA', g: 'MALE' },
        { r: '253110101006', n: 'BHAVYA SRI PRAVALIKA GOGADA', g: 'FEMALE' },
        { r: '253110101007', n: 'BHUPATHIRAJU VENKATA NIKHIL VARMA', g: 'MALE' },
        { r: '253110101008', n: 'BOKKA KAVYA SRI', g: 'FEMALE' },
        { r: '253110101009', n: 'CHEKURI SRI RAM VARMA', g: 'MALE' },
        { r: '253110101010', n: 'CHILAPARASETTI KIRANMAYI VENKATA SAISRI', g: 'FEMALE' },
        { r: '253110101011', n: 'CHIPURUPALLI SANDEEP SAGAR', g: 'MALE' },
        { r: '253110101012', n: 'CHOPPALA AJAY', g: 'MALE' },
        { r: '253110101013', n: 'G P S SHANMUKHA PRIYA', g: 'FEMALE' },
        { r: '253110101014', n: 'GANDIKOTA HEMA TEJA', g: 'MALE' },
        { r: '253110101015', n: 'GANTA SAI MANIKANTA', g: 'MALE' },
        { r: '253110101016', n: 'GARIKAMUKKALA KRISHNA TEJA', g: 'MALE' },
        { r: '253110101017', n: 'GHANTASALA PADMAVATHI', g: 'FEMALE' },
        { r: '253110101018', n: 'GOLUGURI HARI MANIKYA REDDY', g: 'MALE' },
        { r: '253110101019', n: 'GUNUPUDI GLORY', g: 'FEMALE' },
        { r: '253110101020', n: 'IBBA GEETHA JAIN', g: 'MALE' },
        { r: '253110101021', n: 'JAKKAMSETTI MADHU HASINI', g: 'FEMALE' },
        { r: '253110101022', n: 'JOGA REVATHI JYOTHI', g: 'FEMALE' },
        { r: '253110101023', n: 'KADALI CHAITANYA PRIYA', g: 'FEMALE' },
        { r: '253110101024', n: 'KARANAM SINDHU PRIYA', g: 'FEMALE' },
        { r: '253110101025', n: 'KODETI SHANMUKH VENKATA KUMAR', g: 'MALE' },
        { r: '253110101026', n: 'KOLLATI SAI PAVANA TEJASWINI', g: 'FEMALE' },
        { r: '253110101027', n: 'KOLUKULURI SRI HARSHA', g: 'MALE' },
        { r: '253110101028', n: 'KOTIPALLI BHANU PRAKASH', g: 'MALE' },
        { r: '253110101029', n: 'MADAKAM YEMIMA', g: 'FEMALE' },
        { r: '253110101030', n: 'MADASU SATISH', g: 'MALE' },
        { r: '253110101031', n: 'MALI ANITHA', g: 'FEMALE' },
        { r: '253110101032', n: 'MALLULA LOKESH', g: 'MALE' },
        { r: '253110101033', n: 'MANEPALLI BHARGAVI KALI PRIYA', g: 'FEMALE' },
        { r: '253110101034', n: 'MANNEEDI KEERTHI', g: 'FEMALE' },
        { r: '253110101035', n: 'MANYAM BHAVYA', g: 'FEMALE' },
        { r: '253110101036', n: 'MARAMPUDI AKSHAYA', g: 'FEMALE' },
        { r: '253110101037', n: 'MARAPATLA AKHIL', g: 'MALE' },
        { r: '253110101038', n: 'MATTAPARTHI.YUVASUDEER', g: 'MALE' },
        { r: '253110101039', n: 'MULLAPUDI SAI NIKHITA', g: 'FEMALE' },
        { r: '253110101040', n: 'MURAMALLA RAJESWARI', g: 'FEMALE' },
        { r: '253110101041', n: 'NARAHARISETTI KESAVA SRI RAM TARUN', g: 'MALE' },
        { r: '253110101042', n: 'NETHALA CHIRU SRI', g: 'FEMALE' },
        { r: '253110101043', n: 'PAMARTHI ESWAR KUMAR', g: 'MALE' },
        { r: '253110101044', n: 'PASUPULETI GANESH KUMAR', g: 'MALE' },
        { r: '253110101045', n: 'PENTAKOTI NAGA CHAITANYA', g: 'MALE' },
        { r: '253110101046', n: 'PENUMUDI BINDU NAGA BHARGAVI', g: 'FEMALE' },
        { r: '253110101047', n: 'POLAMARASETTI NAVYA SRI', g: 'FEMALE' },
        { r: '253110101048', n: 'POLANA LOKESH', g: 'MALE' },
        { r: '253110101049', n: 'PONNAMANDA MANASWI', g: 'FEMALE' },
        { r: '253110101050', n: 'RAJOLU VENNELA SRIJA', g: 'FEMALE' },
        { r: '253110101051', n: 'RANKAWAT SHIVANI', g: 'FEMALE' },
        { r: '253110101052', n: 'REGANI SINDHU', g: 'FEMALE' },
        { r: '253110101053', n: 'REDDY YESWANTH NAGA MANIKANTH', g: 'MALE' },
        { r: '253110101054', n: 'SANGAM HARSHITHA', g: 'FEMALE' },
        { r: '253110101055', n: 'SUDABATTULA VEDHASWI', g: 'FEMALE' },
        { r: '253110101056', n: 'TARAPATLA JOHNPETER', g: 'MALE' },
        { r: '253110101057', n: 'THOLETI ROSHINI', g: 'FEMALE' },
        { r: '253110101058', n: 'UPPULURI HEMA LOKESH', g: 'MALE' },
        { r: '253110101059', n: 'VANJARAPU SYAM SAI PUJITHA', g: 'FEMALE' },
        { r: '253110101060', n: 'VARADI SUGUNA', g: 'FEMALE' },
        { r: '253110101061', n: 'VELPURI SIVA DURGA', g: 'FEMALE' },
        { r: '253110101062', n: 'YADLA HARSHA VARDHAN', g: 'MALE' },
        { r: '253110101063', n: 'BOKKA MAHITHA', g: 'FEMALE' },
        { r: '253110101064', n: 'YALAMANCHILI POOJITHA KOUSALYA', g: 'FEMALE' }
    ];

    students.forEach((s) => {
        db.prepare('INSERT INTO students (roll_no, name, gender) VALUES (?,?,?)').run(s.r, s.n, s.g);
    });
    console.log('Students seeded.');
}

module.exports = { seed };

if (require.main === module) {
    seed().catch(console.error);
}
