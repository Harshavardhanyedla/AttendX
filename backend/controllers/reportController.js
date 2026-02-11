const { supabase } = require('../config/supabase');
const { generateAttendancePDF, generateDailySummaryPDF, generateStudentPDF } = require('../utils/pdfGenerator');
const { getPeriodTimeRange, getAllPeriods } = require('../utils/periodUtils');

/**
 * Get period-wise attendance report
 */
async function getPeriodReport(req, res) {
    try {
        const { date, period } = req.query;

        if (!date || !period) {
            return res.status(400).json({ error: 'Date and period are required' });
        }

        const periodInt = parseInt(period);
        const { data: attendanceData, error: aError } = await supabase
            .from('attendance')
            .select('*')
            .eq('date', date)
            .eq('period', periodInt);

        if (aError || !attendanceData || attendanceData.length === 0) {
            return res.json({ date, period: periodInt, summary: { total: 0, present: 0, absent: 0, rate: 0 }, attendance: [] });
        }

        // Fetch student details
        const { data: students, error: sError } = await supabase.from('students').select('*');
        const studentMap = {};
        if (students) {
            students.forEach(s => studentMap[s.roll_no] = s);
        }

        // Map and sort
        const attendance = attendanceData.map(a => ({
            ...a,
            roll_no: a.student_id,
            name: studentMap[a.student_id]?.name || 'Unknown',
            gender: studentMap[a.student_id]?.gender || 'N/A'
        })).sort((a, b) => a.roll_no.localeCompare(b.roll_no));

        const periodInfo = getPeriodTimeRange(periodInt);
        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;

        res.json({
            date,
            period: periodInt,
            periodLabel: periodInfo?.label || `P${period}`,
            timeRange: `${periodInfo?.start} - ${periodInfo?.end}`,
            subject: attendance.length > 0 ? attendance[0].subject_name : 'N/A',
            summary: {
                total,
                present,
                absent: total - present,
                rate: total > 0 ? Math.round((present / total) * 100) : 0
            },
            attendance
        });
    } catch (error) {
        console.error('Get period report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Get daily attendance report
 */
async function getDailyReport(req, res) {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        const periodsInfo = getAllPeriods();
        const dateObj = new Date(date);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayStr = dayNames[dateObj.getDay()];

        // Get all attendance for that date
        const { data: records, error: aError } = await supabase
            .from('attendance')
            .select('*')
            .eq('date', date);

        if (aError) throw aError;

        // Get timetable
        const { data: timetable, error: tError } = await supabase
            .from('timetable')
            .select('*')
            .eq('day', dayStr);

        if (tError) throw tError;

        // Process stats per period
        const periodData = timetable.map(tp => {
            const periodRecords = records.filter(r => r.period === tp.period);
            const total = periodRecords.length;
            const present = periodRecords.filter(r => r.status === 'present').length;

            return {
                period: tp.period,
                periodLabel: `P${tp.period}`,
                timeRange: periodsInfo[tp.period] ? `${periodsInfo[tp.period].start} - ${periodsInfo[tp.period].end}` : 'N/A',
                subject: tp.subject_name,
                total,
                present,
                absent: total - present,
                rate: total > 0 ? Math.round((present / total) * 100) : 0
            };
        }).sort((a, b) => a.period - b.period);

        // Overall stats
        const overallTotal = periodData.reduce((sum, p) => sum + p.total, 0);
        const overallPresent = periodData.reduce((sum, p) => sum + p.present, 0);

        res.json({
            date,
            day: dayStr,
            periods: periodData,
            overallSummary: {
                totalRecords: overallTotal,
                totalPresent: overallPresent,
                totalAbsent: overallTotal - overallPresent,
                overallRate: overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 0
            }
        });
    } catch (error) {
        console.error('Get daily report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Get student-wise attendance report
 */
async function getStudentReport(req, res) {
    try {
        const { studentId, startDate, endDate } = req.query;

        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required' });
        }

        // Get student info
        const { data: student, error: sError } = await supabase
            .from('students')
            .select('*')
            .eq('roll_no', studentId)
            .single();

        if (sError || !student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Fetch attendance
        let query = supabase.from('attendance').select('*').eq('student_id', studentId);
        if (startDate && endDate) {
            query = query.gte('date', startDate).lte('date', endDate);
        }

        const { data: attendance, error: aError } = await query.order('date', { ascending: false }).order('period');

        if (aError) throw aError;

        // Calculate stats
        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;

        // Subject-wise breakdown
        const subjectMap = {};
        attendance.forEach(a => {
            const code = a.subject_code;
            if (!subjectMap[code]) {
                subjectMap[code] = {
                    subject: a.subject_name || 'Unknown',
                    code: code,
                    total: 0,
                    present: 0
                };
            }
            subjectMap[code].total++;
            if (a.status === 'present') subjectMap[code].present++;
        });

        const subjectWise = Object.values(subjectMap).map(s => ({
            ...s,
            absent: s.total - s.present,
            rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0
        }));

        res.json({
            student: { id: student.roll_no, ...student },
            dateRange: startDate && endDate ? { startDate, endDate } : null,
            stats: {
                total,
                present,
                absent: total - present,
                rate: total > 0 ? Math.round((present / total) * 100) : 0
            },
            subjectWise,
            attendance
        });
    } catch (error) {
        console.error('Get student report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Get subject-wise attendance report
 */
async function getSubjectReport(req, res) {
    try {
        const { subjectId, startDate, endDate } = req.query;

        if (!subjectId) {
            return res.status(400).json({ error: 'Subject ID is required' });
        }

        // Get subject info
        const { data: subject, error: subError } = await supabase
            .from('subjects')
            .select('*')
            .eq('code', subjectId)
            .single();

        if (subError || !subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        // Get attendance
        let query = supabase.from('attendance').select('*').eq('subject_code', subjectId);
        if (startDate && endDate) {
            query = query.gte('date', startDate).lte('date', endDate);
        }

        const { data: attendanceData, error: aError } = await query;
        if (aError) throw aError;

        // Fetch students
        const { data: allStudents, error: sError } = await supabase.from('students').select('*');
        const studentMap = {};
        if (allStudents) {
            allStudents.forEach(s => studentMap[s.roll_no] = s);
        }

        const attendance = attendanceData.map(a => ({
            ...a,
            roll_no: a.student_id,
            student_name: studentMap[a.student_id]?.name || 'Unknown',
            gender: studentMap[a.student_id]?.gender || 'N/A'
        }));

        // Calculate stats
        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;

        // Student-wise breakdown
        const resStudentMap = {};
        attendance.forEach(a => {
            if (!resStudentMap[a.roll_no]) {
                resStudentMap[a.roll_no] = {
                    student_id: a.roll_no,
                    roll_no: a.roll_no,
                    name: a.student_name,
                    gender: a.gender,
                    total: 0,
                    present: 0
                };
            }
            resStudentMap[a.roll_no].total++;
            if (a.status === 'present') resStudentMap[a.roll_no].present++;
        });

        const studentWise = Object.values(resStudentMap).map(s => ({
            ...s,
            absent: s.total - s.present,
            rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0
        })).sort((a, b) => a.roll_no.localeCompare(b.roll_no));

        res.json({
            subject: { id: subject.code, ...subject },
            dateRange: startDate && endDate ? { startDate, endDate } : null,
            stats: {
                total,
                present,
                absent: total - present,
                rate: total > 0 ? Math.round((present / total) * 100) : 0
            },
            studentWise,
            attendance
        });
    } catch (error) {
        console.error('Get subject report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Download Monthly Attendance Report (CSV)
 */
async function getMonthlyReport(req, res) {
    try {
        const { month } = req.query; // YYYY-MM

        if (!month) {
            return res.status(400).json({ error: 'Month is required (YYYY-MM)' });
        }

        const [year, monthNum] = month.split('-');
        const startDate = `${month}-01`;
        const lastDay = new Date(year, monthNum, 0).getDate();
        const endDate = `${month}-${lastDay}`;

        // 1. Get all students
        const { data: students, error: sError } = await supabase
            .from('students')
            .select('*')
            .order('roll_no');

        if (sError) throw sError;

        // 2. Get attendance for the month
        const { data: attendanceRecords, error: aError } = await supabase
            .from('attendance')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate);

        if (aError) throw aError;

        // 3. Process aggregation
        const studentStats = {};
        students.forEach(s => {
            studentStats[s.roll_no] = {
                name: s.name,
                roll_no: s.roll_no,
                present: 0
            };
        });

        const uniquePeriods = new Set();
        attendanceRecords.forEach(r => {
            uniquePeriods.add(`${r.date}_${r.period}`);
            if (studentStats[r.student_id] && r.status === 'present') {
                studentStats[r.student_id].present++;
            }
        });
        const totalConducted = uniquePeriods.size;

        // 4. Generate CSV
        let csv = 'Roll Number,Name,Total Periods Conducted,attended Periods,Attendance Percentage\n';
        students.forEach(s => {
            const stat = studentStats[s.roll_no];
            const attended = stat.present;
            const percentage = totalConducted > 0 ? ((attended / totalConducted) * 100).toFixed(2) : '0.00';
            csv += `${s.roll_no},"${s.name}",${totalConducted},${attended},${percentage}%\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment(`Attendance_Report_${month}.csv`);
        res.send(csv);

    } catch (error) {
        console.error('Monthly report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    getPeriodReport,
    getDailyReport,
    getStudentReport,
    getSubjectReport,
    downloadPeriodPDF: async (req, res) => res.status(501).json({ error: 'PDF generation needs update' }),
    downloadDailyPDF: async (req, res) => res.status(501).json({ error: 'PDF generation needs update' }),
    downloadStudentPDF: async (req, res) => res.status(501).json({ error: 'PDF generation needs update' }),
    getMonthlyReport
};
