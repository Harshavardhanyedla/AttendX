const { supabase } = require('../config/supabase');

/**
 * GET /partial
 * Returns students who have partial attendance (bunking) for a specific date.
 */
async function getPartialAttendance(req, res) {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: 'Date is required' });

        // 1. Get total periods marked for this day
        const { data: records, error: aError } = await supabase
            .from('attendance')
            .select('student_id, period, status')
            .eq('date', date);

        if (aError || !records || records.length === 0) {
            return res.json({ students: [], totalPeriods: 0 });
        }

        const conductedPeriods = [...new Set(records.map(r => r.period))];
        const totalPeriods = conductedPeriods.length;

        // 2. Aggregate attendance per student
        const studentStats = {};
        records.forEach(r => {
            const sid = r.student_id;
            if (!studentStats[sid]) {
                studentStats[sid] = { present: 0 };
            }
            if (r.status === 'present') {
                studentStats[sid].present++;
            }
        });

        // 3. Identify students with Partial Attendance
        const bunkingStudentIds = Object.keys(studentStats).filter(sid => {
            const stats = studentStats[sid];
            return stats.present > 0 && stats.present < totalPeriods;
        });

        if (bunkingStudentIds.length === 0) {
            return res.json({ students: [], totalPeriods });
        }

        // 4. Fetch details for these students
        const { data: students, error: sError } = await supabase
            .from('students')
            .select('roll_no, name')
            .in('roll_no', bunkingStudentIds);

        const studentMap = {};
        if (students) {
            students.forEach(s => studentMap[s.roll_no] = s);
        }

        const result = bunkingStudentIds.map(sid => {
            const s = studentMap[sid] || { name: 'Unknown', roll_no: sid };
            const stats = studentStats[sid];
            return {
                id: sid,
                name: s.name,
                roll_no: s.roll_no,
                attended: stats.present,
                total: totalPeriods,
                missing: totalPeriods - stats.present
            };
        });

        result.sort((a, b) => b.missing - a.missing);

        res.json({ students: result, totalPeriods });

    } catch (error) {
        console.error('getPartialAttendance Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = { getPartialAttendance };
