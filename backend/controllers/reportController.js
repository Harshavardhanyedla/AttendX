const { db } = require('../config/database');
const { generateAttendancePDF, generateDailySummaryPDF, generateStudentPDF } = require('../utils/pdfGenerator');
const { getPeriodTimeRange, getAllPeriods } = require('../utils/periodUtils');

/**
 * Get period-wise attendance report
 */
function getPeriodReport(req, res) {
    try {
        const { date, period } = req.query;

        if (!date || !period) {
            return res.status(400).json({ error: 'Date and period are required' });
        }

        const attendance = db.prepare(`
      SELECT a.*, s.roll_no, s.name, s.gender, sub.name as subject_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN subjects sub ON a.subject_id = sub.id
      WHERE a.date = ? AND a.period = ?
      ORDER BY s.roll_no
    `).all(date, parseInt(period));

        const periodInfo = getPeriodTimeRange(parseInt(period));
        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;

        res.json({
            date,
            period: parseInt(period),
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
function getDailyReport(req, res) {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        const periods = getAllPeriods();
        const dateObj = new Date(date);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const day = dayNames[dateObj.getDay()];

        // Get period-wise stats
        const periodStats = db.prepare(`
      SELECT 
        a.period,
        sub.name as subject_name,
        COUNT(*) as total,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent
      FROM attendance a
      JOIN subjects sub ON a.subject_id = sub.id
      WHERE a.date = ?
      GROUP BY a.period
      ORDER BY a.period
    `).all(date);

        const periodData = periodStats.map(p => ({
            period: p.period,
            periodLabel: `P${p.period}`,
            timeRange: `${periods[p.period].start} - ${periods[p.period].end}`,
            subject: p.subject_name,
            total: p.total,
            present: p.present,
            absent: p.absent,
            rate: p.total > 0 ? Math.round((p.present / p.total) * 100) : 0
        }));

        // Overall stats
        const overallTotal = periodStats.reduce((sum, p) => sum + p.total, 0);
        const overallPresent = periodStats.reduce((sum, p) => sum + p.present, 0);

        res.json({
            date,
            day,
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
function getStudentReport(req, res) {
    try {
        const { studentId, startDate, endDate } = req.query;

        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required' });
        }

        // Get student info
        const student = db.prepare('SELECT * FROM students WHERE id = ?').get(parseInt(studentId));

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Build query
        let query = `
      SELECT a.*, sub.name as subject_name, sub.code as subject_code
      FROM attendance a
      JOIN subjects sub ON a.subject_id = sub.id
      WHERE a.student_id = ?
    `;
        const params = [parseInt(studentId)];

        if (startDate && endDate) {
            query += ' AND a.date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY a.date DESC, a.period';

        const attendance = db.prepare(query).all(...params);

        // Calculate overall stats
        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;

        // Subject-wise breakdown
        const subjectMap = {};
        attendance.forEach(a => {
            if (!subjectMap[a.subject_code]) {
                subjectMap[a.subject_code] = {
                    subject: a.subject_name,
                    code: a.subject_code,
                    total: 0,
                    present: 0
                };
            }
            subjectMap[a.subject_code].total++;
            if (a.status === 'present') {
                subjectMap[a.subject_code].present++;
            }
        });

        const subjectWise = Object.values(subjectMap).map(s => ({
            ...s,
            absent: s.total - s.present,
            rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0
        }));

        res.json({
            student,
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
function getSubjectReport(req, res) {
    try {
        const { subjectId, startDate, endDate } = req.query;

        if (!subjectId) {
            return res.status(400).json({ error: 'Subject ID is required' });
        }

        // Get subject info
        const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(parseInt(subjectId));

        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        // Build query
        let query = `
      SELECT a.*, s.roll_no, s.name as student_name, s.gender
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.subject_id = ?
    `;
        const params = [parseInt(subjectId)];

        if (startDate && endDate) {
            query += ' AND a.date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY a.date DESC, s.roll_no';

        const attendance = db.prepare(query).all(...params);

        // Calculate stats
        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;

        // Student-wise breakdown
        const studentMap = {};
        attendance.forEach(a => {
            if (!studentMap[a.student_id]) {
                studentMap[a.student_id] = {
                    student_id: a.student_id,
                    roll_no: a.roll_no,
                    name: a.student_name,
                    gender: a.gender,
                    total: 0,
                    present: 0
                };
            }
            studentMap[a.student_id].total++;
            if (a.status === 'present') {
                studentMap[a.student_id].present++;
            }
        });

        const studentWise = Object.values(studentMap).map(s => ({
            ...s,
            absent: s.total - s.present,
            rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0
        })).sort((a, b) => a.roll_no.localeCompare(b.roll_no));

        res.json({
            subject,
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
 * Download period-wise PDF report
 */
function downloadPeriodPDF(req, res) {
    try {
        const { date, period } = req.query;

        if (!date || !period) {
            return res.status(400).json({ error: 'Date and period are required' });
        }

        const attendance = db.prepare(`
      SELECT a.*, s.roll_no, s.name, s.gender, sub.name as subject_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN subjects sub ON a.subject_id = sub.id
      WHERE a.date = ? AND a.period = ?
      ORDER BY s.roll_no
    `).all(date, parseInt(period));

        const periodInfo = getPeriodTimeRange(parseInt(period));
        const dateObj = new Date(date);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;

        generateAttendancePDF(res, {
            filename: `attendance-P${period}-${date}.pdf`,
            date: dateObj.toLocaleDateString('en-IN'),
            day: dayNames[dateObj.getDay()],
            period: `P${period}`,
            timeRange: `${periodInfo?.start} - ${periodInfo?.end}`,
            subject: attendance.length > 0 ? attendance[0].subject_name : 'N/A',
            reportType: 'Period-wise Attendance',
            summary: {
                total,
                present,
                absent: total - present,
                rate: total > 0 ? Math.round((present / total) * 100) : 0
            },
            attendance
        });
    } catch (error) {
        console.error('Download period PDF error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Download daily summary PDF
 */
function downloadDailyPDF(req, res) {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        const periods = getAllPeriods();
        const dateObj = new Date(date);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const day = dayNames[dateObj.getDay()];

        // Get all attendance for the day
        const attendance = db.prepare(`
      SELECT a.*, s.roll_no, s.name, s.gender, sub.name as subject_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN subjects sub ON a.subject_id = sub.id
      WHERE a.date = ?
      ORDER BY a.period, s.roll_no
    `).all(date);

        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;

        generateAttendancePDF(res, {
            filename: `daily-attendance-${date}.pdf`,
            date: dateObj.toLocaleDateString('en-IN'),
            day,
            period: 'All Periods',
            timeRange: '09:00 - 17:00',
            subject: 'All Subjects',
            reportType: 'Daily Attendance Report',
            summary: {
                total,
                present,
                absent: total - present,
                rate: total > 0 ? Math.round((present / total) * 100) : 0
            },
            attendance
        });
    } catch (error) {
        console.error('Download daily PDF error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Download student-wise PDF
 */
function downloadStudentPDF(req, res) {
    try {
        const { studentId, startDate, endDate } = req.query;

        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required' });
        }

        const student = db.prepare('SELECT * FROM students WHERE id = ?').get(parseInt(studentId));

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        let query = `
      SELECT a.*, sub.name as subject_name, sub.code as subject_code
      FROM attendance a
      JOIN subjects sub ON a.subject_id = sub.id
      WHERE a.student_id = ?
    `;
        const params = [parseInt(studentId)];

        if (startDate && endDate) {
            query += ' AND a.date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const attendance = db.prepare(query).all(...params);

        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;

        // Subject-wise breakdown
        const subjectMap = {};
        attendance.forEach(a => {
            if (!subjectMap[a.subject_code]) {
                subjectMap[a.subject_code] = { subject: a.subject_name, total: 0, present: 0 };
            }
            subjectMap[a.subject_code].total++;
            if (a.status === 'present') subjectMap[a.subject_code].present++;
        });

        const subjectWise = Object.values(subjectMap).map(s => ({
            ...s,
            rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0
        }));

        generateStudentPDF(res, {
            student,
            stats: {
                total,
                present,
                absent: total - present,
                rate: total > 0 ? Math.round((present / total) * 100) : 0
            },
            subjectWise
        });
    } catch (error) {
        console.error('Download student PDF error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    getPeriodReport,
    getDailyReport,
    getStudentReport,
    getSubjectReport,
    downloadPeriodPDF,
    downloadDailyPDF,
    downloadStudentPDF
};
