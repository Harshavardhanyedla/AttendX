/**
 * Generate attendance PDF report - MOCKED FOR DEV
 */
function generateAttendancePDF(res, reportData) {
    res.status(501).send("PDF Generation Disabled (Missing 'pdfkit' dependency)");
}

/**
 * Draw attendance table in PDF - MOCKED FOR DEV
 */
function drawAttendanceTable(doc, attendance) {
}

/**
 * Generate daily summary PDF - MOCKED FOR DEV
 */
function generateDailySummaryPDF(res, data) {
    res.status(501).send("PDF Generation Disabled (Missing 'pdfkit' dependency)");
}

/**
 * Generate student-wise PDF report - MOCKED FOR DEV
 */
function generateStudentPDF(res, data) {
    res.status(501).send("PDF Generation Disabled (Missing 'pdfkit' dependency)");
}

module.exports = {
    generateAttendancePDF,
    generateDailySummaryPDF,
    generateStudentPDF
};
