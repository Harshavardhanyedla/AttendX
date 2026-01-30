const router = require('express').Router();
const { login, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
router.post('/login', login);
router.get('/me', verifyToken, getMe);
router.get('/status', (req, res) => {
    try {
        const { getDb } = require('../config/database');
        const db = getDb();
        const users = db.exec("SELECT count(*) as count FROM users")[0].values[0][0];
        const students = db.exec("SELECT count(*) as count FROM students")[0].values[0][0];
        const timetable = db.exec("SELECT count(*) as count FROM timetable")[0].values[0][0];
        const subjects = db.exec("SELECT count(*) as count FROM subjects")[0].values[0][0];

        res.json({
            status: 'ok',
            counts: { users, students, timetable, subjects }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.post('/seed', async (req, res) => {
    try {
        const { seed } = require('../seed/seedData');
        await seed();
        res.json({ status: 'success', message: 'Database re-seeded successfully' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
