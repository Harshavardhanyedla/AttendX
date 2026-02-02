/**
 * GET /partial
 * Returns students who have partial attendance (bunking) for a specific date.
 */
async function getPartialAttendance(req, res) {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: 'Date is required' });

        // 1. Get total periods marked for this day
        // We find all unique periods present in the attendance collection for this date
        const attendanceSnapshot = await db.collection("attendance")
            .where("date", "==", date)
            .get();

        if (attendanceSnapshot.empty) {
            return res.json({ students: [], totalPeriods: 0 });
        }

        const records = attendanceSnapshot.docs.map(doc => doc.data());

        // Find total distinct periods conducted/marked today
        const conductedPeriods = [...new Set(records.map(r => r.period))];
        const totalPeriods = conductedPeriods.length;

        // 2. Aggregate attendance per student
        const studentStats = {};

        records.forEach(r => {
            const sid = r.student_id; // Using string ID from attendance doc
            if (!studentStats[sid]) {
                studentStats[sid] = { present: 0, participated: 0 };
            }
            studentStats[sid].participated++; // Student was part of a marked class
            if (r.status === 'present') {
                studentStats[sid].present++;
            }
        });

        // 3. Identify students with Partial Attendance
        // Rule: Participated in 'totalPeriods' classes, but present < totalPeriods
        // We probably want to fetch student names too.

        // Let's optimize: Only fetch students who are in the list
        const bunkingStudentIds = Object.keys(studentStats).filter(sid => {
            // A student is bunking if they were present for fewer periods than conducted
            // BUT: What if they were absent for ALL? Is that bunking or just absent?
            // "Partially attended" usually means attended AT LEAST ONE, but not all.
            // User requirement: "Came to college... but did NOT attend all"
            // So: present > 0 AND present < totalConditions

            const stats = studentStats[sid];
            return stats.present > 0 && stats.present < totalPeriods;
        });

        if (bunkingStudentIds.length === 0) {
            return res.json({ students: [], totalPeriods });
        }

        // Fetch details for these students
        // Firestore 'in' query supports max 10/30. We might have many.
        // Better to fetch ALL students (cached?) or mapped?
        // Since we have student_id (int usually), let's just fetch all students to map names.
        // Or if the ID is the document ID, utilize that.
        // In this system, student_id in attendance seems to be the numeric ID or Doc ID?
        // Let's look at markAttendance: student_id: r.studentId.

        const allStudentsSnap = await db.collection("students").get();
        const studentMap = {};
        allStudentsSnap.docs.forEach(d => {
            studentMap[d.id] = d.data();
            // Also map by numeric ID if that's what's stored
            if (d.data().id) studentMap[d.data().id] = d.data();
        });

        const result = bunkingStudentIds.map(sid => {
            const s = studentMap[sid] || { name: 'Unknown', roll_no: 'N/A' };
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

        // Sort by number of missing classes (descending)
        result.sort((a, b) => b.missing - a.missing);

        res.json({ students: result, totalPeriods });

    } catch (error) {
        console.error('getPartialAttendance Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = { getPartialAttendance };
