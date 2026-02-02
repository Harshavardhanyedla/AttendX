const router = require('express').Router();
const { getSession, getStudents, markAttendance, getLive } = require('../controllers/attendanceController');
const { verifyToken, isCROrAdmin, isAdmin } = require('../middleware/authMiddleware');

const { getPartialAttendance } = require('../controllers/partialController');

router.get('/session', verifyToken, getSession);
router.get('/students', verifyToken, isCROrAdmin, getStudents);
router.post('/mark', verifyToken, isCROrAdmin, markAttendance);
router.get('/live', verifyToken, isAdmin, getLive);
router.get('/partial', verifyToken, isAdmin, getPartialAttendance);

module.exports = router;
