const { db } = require('../config/firebase');
const { getCurrentDay, getCurrentPeriod, getPeriodTimeRange } = require('../utils/periodUtils');

/**
 * GET /session
 * Returns current session info for CR to mark attendance.
 */
async function getSession(req, res) {
    try {
        const { day: qDay, period: qPeriod } = req.query;
        const now = new Date();

        let day = qDay || getCurrentDay(now);
        let period = qPeriod ? parseInt(qPeriod) : getCurrentPeriod(now);

        // If undefined period (before/after college), or break
        if (!period || period === 'BREAK') {
            return res.json({
                day,
                period: null,
                message: period === 'BREAK' ? 'It is Break Time (13:00-14:00)' : 'No class session active now.'
            });
        }

        // Get Subject from Timetable
        const timetableSnapshot = await db.collection("timetable")
            .where("day", "==", day)
            .where("period", "==", period)
            .get();

        if (timetableSnapshot.empty) {
            return res.json({ day, period, message: 'Free Period (No subject assigned)' });
        }

        const timetableEntry = timetableSnapshot.docs[0].data();

        // Check if attendance already marked
        const dateStr = now.toISOString().split('T')[0];
        const attendanceSnapshot = await db.collection("attendance")
            .where("date", "==", dateStr)
            .where("period", "==", period)
            .get();

        const isMarked = !attendanceSnapshot.empty;

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
    } catch (error) {

        console.error('getSession Error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            details: error.message,
            stack: error.stack
        });
    }
}

/**
 * GET /students
 * Returns all students with their current attendance status for the specific date/period if provided
 */
async function getStudents(req, res) {
    try {
        const { date, period } = req.query;

        const studentSnapshot = await db.collection("students").orderBy("roll_no").get();
        const students = studentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (date && period) {
            const attendanceSnapshot = await db.collection("attendance")
                .where("date", "==", date)
                .where("period", "==", parseInt(period))
                .get();

            const statusMap = {};
            attendanceSnapshot.docs.forEach(doc => {
                const data = doc.data();
                statusMap[data.student_id] = data.status;
            });

            // Merge status
            const result = students.map(s => ({
                ...s,
                status: statusMap[s.id] || 'present'
            }));
            return res.json({ students: result });
        }

        res.json({ students });
    } catch (error) {
        console.error('getStudents Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

/**
 * POST /mark
 * CR submits attendance.
 * Body: { date, period, subject_id, records: [{ studentId, status }] }
 */
async function markAttendance(req, res) {
    try {
        const { date, period, subject_id, records: reqRecords, attendance: reqAttendance } = req.body;
        const records = reqRecords || reqAttendance;

        if (!date || !period || !records || !Array.isArray(records)) {
            return res.status(400).json({ error: 'Invalid data' });
        }

        // Check if attendance already exists
        const existingSnapshot = await db.collection("attendance")
            .where("date", "==", date)
            .where("period", "==", parseInt(period))
            .limit(1)
            .get();

        if (!existingSnapshot.empty) {
            return res.status(409).json({ error: 'Attendance already marked for this period.' });
        }

        const userId = req.user.id;

        // Fetch subject name for denormalization
        const subjectDoc = await db.collection("subjects").doc(subject_id).get();
        const subjectName = subjectDoc.exists ? subjectDoc.data().name : 'Unknown';

        let presentCount = 0;
        const batch = db.batch();

        records.forEach(r => {
            if (r.status === 'present') presentCount++;
            const docId = `${r.studentId}_${date}_${period}`;
            const ref = db.collection("attendance").doc(docId);
            batch.set(ref, {
                student_id: r.studentId,
                date,
                period: parseInt(period),
                subject_id,
                subject_name: subjectName,
                status: r.status,
                marked_by: userId,
                marked_at: new Date().toISOString()
            });
        });

        await batch.commit();

        res.json({ message: 'Attendance saved', total: records.length, present: presentCount });
    } catch (error) {
        console.error('markAttendance Error:', error);
        res.status(500).json({ error: 'Failed to save attendance' });
    }
}

/**
 * GET /live
 * Admin view of today's stats period-wise
 */
async function getLive(req, res) {
    try {
        const date = new Date().toISOString().split('T')[0];
        const day = getCurrentDay(new Date());

        // Get all periods for today from timetable
        const periodsSnapshot = await db.collection("timetable")
            .where("day", "==", day)
            // .orderBy("period") // Removed to avoid index requirements
            .get();
        const periods = periodsSnapshot.docs
            .map(d => d.data())
            .sort((a, b) => a.period - b.period); // Sort in JS

        // Get attendance counts for today
        const statsSnapshot = await db.collection("attendance")
            .where("date", "==", date)
            .get();
        const records = statsSnapshot.docs.map(d => d.data());

        // Process stats in JS
        const statsMap = {};
        records.forEach(r => {
            if (!statsMap[r.period]) statsMap[r.period] = { total: 0, present: 0 };
            statsMap[r.period].total++;
            if (r.status === 'present') statsMap[r.period].present++;
        });

        // Merge
        const result = periods.map(p => {
            const stat = statsMap[p.period];
            return {
                period: p.period,
                subject: p.subject_name,
                isMarked: !!stat,
                total: stat ? stat.total : 0,
                present: stat ? stat.present : 0,
                absent: stat ? (stat.total - stat.present) : 0
            };
        });

        res.json({ date, day, periods: result });
    } catch (error) {
        console.error('getLive Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = { getSession, getStudents, markAttendance, getLive };
