const { db } = require('../config/firebase');
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
        const attendanceSnapshot = await db.collection("attendance")
            .where("date", "==", date)
            .where("period", "==", periodInt)
            .get();

        if (attendanceSnapshot.empty) {
            return res.json({ date, period: periodInt, summary: { total: 0, present: 0, absent: 0, rate: 0 }, attendance: [] });
        }

        const attendanceData = attendanceSnapshot.docs.map(d => d.data());

        // Fetch student details for joins
        const studentSnapshot = await db.collection("students").get();
        const studentMap = {};
        studentSnapshot.docs.forEach(d => {
            const data = d.data();
            studentMap[data.roll_no] = data;
        });

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

        const periods = getAllPeriods();
        const dateObj = new Date(date);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayStr = dayNames[dateObj.getDay()];

        // Get all attendance for that date
        const attendanceSnapshot = await db.collection("attendance").where("date", "==", date).get();
        const records = attendanceSnapshot.docs.map(d => d.data());

        // Get timetable to know which subjects were supposed to happen
        const timetableSnapshot = await db.collection("timetable").where("day", "==", dayStr).get();
        const timetable = timetableSnapshot.docs.map(d => d.data());

        // Process stats per period
        const periodData = timetable.map(tp => {
            const periodRecords = records.filter(r => r.period === tp.period);
            const total = periodRecords.length;
            const present = periodRecords.filter(r => r.status === 'present').length;

            return {
                period: tp.period,
                periodLabel: `P${tp.period}`,
                timeRange: periods[tp.period] ? `${periods[tp.period].start} - ${periods[tp.period].end}` : 'N/A',
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
        const studentDoc = await db.collection("students").doc(studentId).get();
        if (!studentDoc.exists) {
            return res.status(404).json({ error: 'Student not found' });
        }
        const student = { id: studentDoc.id, ...studentDoc.data() };

        // Fetch attendance
        let query = db.collection("attendance").where("student_id", "==", studentId);
        const attendanceSnapshot = await query.get();
        let attendance = attendanceSnapshot.docs.map(d => d.data());

        // Manual date filter
        if (startDate && endDate) {
            attendance = attendance.filter(a => a.date >= startDate && a.date <= endDate);
        }

        attendance.sort((a, b) => b.date.localeCompare(a.date) || a.period - b.period);

        // Calculate stats
        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;

        // Subject-wise breakdown
        const subjectMap = {};
        attendance.forEach(a => {
            const code = a.subject_id;
            if (!subjectMap[code]) {
                subjectMap[code] = {
                    subject: a.subject_name,
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
async function getSubjectReport(req, res) {
    try {
        const { subjectId, startDate, endDate } = req.query;

        if (!subjectId) {
            return res.status(400).json({ error: 'Subject ID is required' });
        }

        // Get subject info
        const subjectDoc = await db.collection("subjects").doc(subjectId).get();
        if (!subjectDoc.exists) {
            return res.status(404).json({ error: 'Subject not found' });
        }
        const subject = { id: subjectDoc.id, ...subjectDoc.data() };

        // Get attendance
        const attendanceSnapshot = await db.collection("attendance").where("subject_id", "==", subjectId).get();
        let attendanceData = attendanceSnapshot.docs.map(d => d.data());

        if (startDate && endDate) {
            attendanceData = attendanceData.filter(a => a.date >= startDate && a.date <= endDate);
        }

        // Fetch students for joining names
        const studentSnapshot = await db.collection("students").get();
        const studentMap = {};
        studentSnapshot.docs.forEach(d => {
            const data = d.data();
            studentMap[data.roll_no] = data;
        });

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
async function downloadPeriodPDF(req, res) {
    try {
        const { date, period } = req.query;

        if (!date || !period) {
            return res.status(400).json({ error: 'Date and period are required' });
        }

        const periodInt = parseInt(period);
        const attendanceSnapshot = await db.collection("attendance")
            .where("date", "==", date)
            .where("period", "==", periodInt)
            .get();
        const attendanceData = attendanceSnapshot.docs.map(d => d.data());

        // Fetch student details for joins
        const studentSnapshot = await db.collection("students").get();
        const studentMap = {};
        studentSnapshot.docs.forEach(d => {
            const data = d.data();
            studentMap[data.roll_no] = data;
        });

        // Map and sort
        const attendance = attendanceData.map(a => ({
            ...a,
            roll_no: a.student_id,
            name: studentMap[a.student_id]?.name || 'Unknown',
            gender: studentMap[a.student_id]?.gender || 'N/A'
        })).sort((a, b) => a.roll_no.localeCompare(b.roll_no));

        const periodInfo = getPeriodTimeRange(periodInt);
        const dateObj = new Date(date);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;

        generateAttendancePDF(res, {
            filename: `attendance-P${period}-${date}.pdf`,
            date: dateObj.toLocaleDateString('en-IN'),
            day: dayNames[dateObj.getDay()],
            period: `P${period}`,
            timeRange: periodInfo ? `${periodInfo.start} - ${periodInfo.end}` : '',
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
async function downloadDailyPDF(req, res) {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        const dateObj = new Date(date);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const day = dayNames[dateObj.getDay()];

        // Get all attendance for the day
        const attendanceSnapshot = await db.collection("attendance").where("date", "==", date).get();
        const attendanceData = attendanceSnapshot.docs.map(d => d.data());

        // Fetch student details for joins
        const studentSnapshot = await db.collection("students").get();
        const studentMap = {};
        studentSnapshot.docs.forEach(d => {
            const data = d.data();
            studentMap[data.roll_no] = data;
        });

        const attendance = attendanceData.map(a => ({
            ...a,
            roll_no: a.student_id,
            name: studentMap[a.student_id]?.name || 'Unknown',
            gender: studentMap[a.student_id]?.gender || 'N/A'
        })).sort((a, b) => a.period - b.period || a.roll_no.localeCompare(b.roll_no));

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
async function downloadStudentPDF(req, res) {
    try {
        const { studentId, startDate, endDate } = req.query;

        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required' });
        }

        const studentDoc = await db.collection("students").doc(studentId).get();
        if (!studentDoc.exists) {
            return res.status(404).json({ error: 'Student not found' });
        }
        const student = { id: studentDoc.id, ...studentDoc.data() };

        const attendanceSnapshot = await db.collection("attendance").where("student_id", "==", studentId).get();
        let attendance = attendanceSnapshot.docs.map(d => d.data());

        if (startDate && endDate) {
            attendance = attendance.filter(a => a.date >= startDate && a.date <= endDate);
        }

        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;

        // Subject-wise breakdown
        const subjectMap = {};
        attendance.forEach(a => {
            const code = a.subject_id;
            if (!subjectMap[code]) {
                subjectMap[code] = { subject: a.subject_name, total: 0, present: 0 };
            }
            subjectMap[code].total++;
            if (a.status === 'present') subjectMap[code].present++;
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
