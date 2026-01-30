const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const {
    getPeriodReport,
    getDailyReport,
    getStudentReport,
    getSubjectReport,
    downloadPeriodPDF,
    downloadDailyPDF,
    downloadStudentPDF
} = require('../controllers/reportController');

// All routes require authentication and admin access
router.use(verifyToken);
router.use(isAdmin);

// Report endpoints
router.get('/period', getPeriodReport);
router.get('/daily', getDailyReport);
router.get('/student', getStudentReport);
router.get('/subject', getSubjectReport);

// PDF download endpoints
router.get('/download/period', downloadPeriodPDF);
router.get('/download/daily', downloadDailyPDF);
router.get('/download/student', downloadStudentPDF);

module.exports = router;
