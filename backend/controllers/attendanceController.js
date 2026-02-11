const { supabase } = require('../config/supabase');
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
        const { data: timetableEntry, error: tError } = await supabase
            .from('timetable')
            .select('*')
            .eq('day', day)
            .eq('period', period)
            .maybeSingle();

        if (tError || !timetableEntry) {
            return res.json({ day, period, message: 'Free Period (No subject assigned)' });
        }

        // Check if attendance already marked
        const dateStr = now.toISOString().split('T')[0];
        const { data: attendance, error: aError } = await supabase
            .from('attendance')
            .select('id')
            .eq('date', dateStr)
            .eq('period', period)
            .limit(1);

        const isMarked = attendance && attendance.length > 0;

        res.json({
            day,
            period,
            timeRange: getPeriodTimeRange(period),
            subject: {
                id: timetableEntry.subject_code,
                name: timetableEntry.subject_name,
                code: timetableEntry.subject_code
            },
            isMarked
        });
    } catch (error) {
        console.error('getSession Error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            details: error.message
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

        const { data: students, error: sError } = await supabase
            .from('students')
            .select('*')
            .order('roll_no');

        if (sError) throw sError;

        if (date && period) {
            const { data: attendance, error: aError } = await supabase
                .from('attendance')
                .select('student_id, status')
                .eq('date', date)
                .eq('period', parseInt(period));

            if (aError) throw aError;

            const statusMap = {};
            attendance.forEach(record => {
                statusMap[record.student_id] = record.status;
            });

            // Merge status
            const result = students.map(s => ({
                ...s,
                id: s.roll_no,
                status: statusMap[s.roll_no] || 'present'
            }));
            return res.json({ students: result });
        }

        res.json({ students: students.map(s => ({ ...s, id: s.roll_no })) });
    } catch (error) {
        console.error('getStudents Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

/**
 * POST /mark
 * CR submits attendance.
 */
async function markAttendance(req, res) {
    try {
        const { period, subject_id, records: reqRecords, attendance: reqAttendance } = req.body;
        const records = reqRecords || reqAttendance;

        const now = new Date();
        const date = now.toISOString().split('T')[0];

        if (!period || !records || !Array.isArray(records)) {
            return res.status(400).json({ error: 'Invalid data' });
        }

        // Check if attendance already exists
        const { data: existing } = await supabase
            .from('attendance')
            .select('id')
            .eq('date', date)
            .eq('period', parseInt(period))
            .limit(1);

        if (existing && existing.length > 0) {
            return res.status(409).json({ error: 'Attendance already marked.' });
        }

        const userId = req.user.id; // Corrected: username or id from token

        const attendanceData = records.map(r => ({
            student_id: r.studentId,
            date,
            period: parseInt(period),
            subject_code: subject_id,
            status: r.status,
            marked_by: userId
        }));

        const { error: insError } = await supabase.from('attendance').insert(attendanceData);
        if (insError) throw insError;

        const presentCount = records.filter(r => r.status === 'present').length;

        res.json({ message: 'Attendance saved', total: records.length, present: presentCount });
    } catch (error) {
        console.error('markAttendance Error:', error);
        res.status(500).json({ error: 'Failed to save attendance', details: error.message });
    }
}

/**
 * GET /live
 * Admin view of today's stats period-wise
 */
async function getLive(req, res) {
    try {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const day = getCurrentDay(now);

        // Get periods for today
        const { data: periods, error: pError } = await supabase
            .from('timetable')
            .select('*')
            .eq('day', day)
            .order('period');

        if (pError) throw pError;

        // Get attendance counts for today
        const { data: records, error: aError } = await supabase
            .from('attendance')
            .select('period, status')
            .eq('date', date);

        if (aError) throw aError;

        // Process stats
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
