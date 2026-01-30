const { getDb } = require('../config/database');
const { getCurrentDay, getCurrentPeriod, getPeriodTimeRange } = require('../utils/periodUtils');

/**
 * GET /session
 * Returns current session info for CR to mark attendance.
 * If mock=true, forces Monday 10:00 AM (P2) for testing.
 */
function getSession(req, res) {
    const { day: qDay, period: qPeriod } = req.query;
    const now = new Date();

    let day = qDay || getCurrentDay(now);
    let period = qPeriod ? parseInt(qPeriod) : getCurrentPeriod(now);

    // Mock removed in favor of manual selection


    const db = getDb();

    // If undefined period (before/after college), or break
    if (!period || period === 'BREAK') {
        return res.json({
            day,
            period: null,
            message: period === 'BREAK' ? 'It is Break Time (13:00-14:00)' : 'No class session active now.'
        });
    }

    // Get Subject from Timetable
    const timetableEntry = db.prepare(`
    SELECT t.subject_id, s.name as subject_name, s.code as subject_code
    FROM timetable t
    JOIN subjects s ON t.subject_id = s.id
    WHERE t.day = ? AND t.period = ?
  `).get(day, period);

    if (!timetableEntry) {
        return res.json({ day, period, message: 'Free Period (No subject assigned)' });
    }

    // Check if attendance already marked
    const dateStr = now.toISOString().split('T')[0];
    const existing = db.prepare('SELECT COUNT(*) as count FROM attendance WHERE date = ? AND period = ?').get(dateStr, period);
    const isMarked = existing && existing.count > 0;

    res.json({
        day,
        period,
        timeRange: getPeriodTimeRange(period),
        subject: {
            id: timetableEntry.subject_id,
            name: timetableEntry.subject_name,
            code: timetableEntry.subject_code
        },
        isMarked
    });
}

/**
 * GET /students
 * Returns all students with their current attendance status for the specific date/period if provided
 */
function getStudents(req, res) {
    const db = getDb();
    const { date, period } = req.query; // Optional, to check existing status

    const students = db.prepare('SELECT id, roll_no, name, gender FROM students ORDER BY roll_no').all();

    if (date && period) {
        const attendance = db.prepare('SELECT student_id, status FROM attendance WHERE date = ? AND period = ?').all(date, period);
        const statusMap = {};
        attendance.forEach(a => statusMap[a.student_id] = a.status);

        // Merge status
        const result = students.map(s => ({
            ...s,
            status: statusMap[s.id] || 'present' // Default to present if not marked, or handle on frontend
        }));
        return res.json({ students: result });
    }

    res.json({ students });
}

/**
 * POST /mark
 * CR submits attendance.
 * Body: { date, period, subject_id, records: [{ studentId, status }] }
 */
function markAttendance(req, res) {
    const { date, period, subject_id, records } = req.body;
    if (!date || !period || !records || !Array.isArray(records)) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    const db = getDb();
    const userId = req.user.id;

    try {
        // We use a transaction conceptually, but here we just loop for SQLite
        // First, delete existing for this slot (Overwrite policy)
        // Actually, SQL replace or update is better, but delete-insert is simple for "Latest saves overwrites"

        // Check lock? Prompt says "Latest saved attendance overwrites previous one". No strict lock mentioned.

        // We can use INSERT OR REPLACE.
        // However, since we might want to clear old records not in the new list (unlikely for full class list), 
        // let's just loop "INSERT OR REPLACE"

        const stmt = db.prepare(`
      INSERT OR REPLACE INTO attendance (student_id, date, period, subject_id, status, marked_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

        let presentCount = 0;
        records.forEach(r => {
            stmt.run(r.studentId, date, period, subject_id, r.status, userId);
            if (r.status === 'present') presentCount++;
        });

        res.json({ message: 'Attendance saved', total: records.length, present: presentCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save attendance' });
    }
}

/**
 * GET /live
 * Admin view of today's stats period-wise
 */
function getLive(req, res) {
    const db = getDb();
    const date = new Date().toISOString().split('T')[0];
    const day = getCurrentDay(new Date()); // Should match server time

    // Get all periods for today from timetable
    const periods = db.prepare(`
    SELECT t.period, s.name as subject
    FROM timetable t
    JOIN subjects s ON t.subject_id = s.id
    WHERE t.day = ?
    ORDER BY t.period
  `).all(day);

    // Get attendance counts for today
    const stats = db.prepare(`
    SELECT period, 
           COUNT(*) as total,
           SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) as present
    FROM attendance
    WHERE date = ?
    GROUP BY period
  `).all(date);

    // Merge
    const result = periods.map(p => {
        const stat = stats.find(s => s.period === p.period);
        return {
            period: p.period,
            subject: p.subject,
            isMarked: !!stat,
            total: stat ? stat.total : 0,
            present: stat ? stat.present : 0,
            absent: stat ? (stat.total - stat.present) : 0
        };
    });

    res.json({ date, day, periods: result });
}

module.exports = { getSession, getStudents, markAttendance, getLive };
