const bcrypt = require('bcryptjs');
const { getDb } = require('../config/database');
const { generateToken } = require('../middleware/authMiddleware');

exports.login = (req, res) => {
    const { username, password } = req.body;
    const user = getDb().prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
        console.warn(`Login failed: user not found - ${username}`);
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!bcrypt.compareSync(password, user.password)) {
        console.warn(`Login failed: password mismatch for ${username}`);
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json({ token: generateToken(user), user: { id: user.id, role: user.role, name: user.name } });
};

exports.getMe = (req, res) => {
    const user = getDb().prepare('SELECT id,username,name,role FROM users WHERE id=?').get(req.user.id);
    res.json({ user });
};
