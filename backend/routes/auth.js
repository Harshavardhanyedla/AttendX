const router = require('express').Router();
const { login, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
router.post('/login', login);
router.get('/me', verifyToken, getMe);
router.get('/status', (req, res) => {
    try {
        const { getDb } = require('../config/database');
        const db = getDb();
        const users = db.prepare('SELECT id, username, role FROM users').all();
        res.json({ status: 'ok', usersCount: users.length, users });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
